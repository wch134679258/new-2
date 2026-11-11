package com.fenglin.springboottest.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.fenglin.springboottest.entity.Article;
import com.fenglin.springboottest.entity.CoinLog;
import com.fenglin.springboottest.entity.Purchase;
import com.fenglin.springboottest.entity.User;
import com.fenglin.springboottest.exception.BusinessException;
import com.fenglin.springboottest.exception.UnauthorizedException;
import com.fenglin.springboottest.mapper.ArticleMapper;
import com.fenglin.springboottest.mapper.CoinLogMapper;
import com.fenglin.springboottest.mapper.PurchaseMapper;
import com.fenglin.springboottest.mapper.UserMapper;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 樱花小镇 · 金币与体力系统。
 *
 * <p>这一版把「小镇生活」串成一条闭环：</p>
 * <pre>
 *   体力  ──打工(便利店)──▶  金币  ──买书(书店)──▶  解锁全文
 *     ▲                      │
 *     │                      └──训练(健身房)──▶ 体力上限提高
 *     └──睡觉(家) / 蛋白饮(健身房)──
 * </pre>
 *
 * <p><b>服务端是唯一的裁判</b>：前端传上来的分数只作为「表现好坏」的参考，
 * 一律夹到合法区间再算钱；买书价格从数据库读，不信客户端报价。
 * 所有改余额的入口都在事务里，并且写一条 coin_log —— 有据可查，也方便对账。</p>
 */
@Service
public class EconomyService {

    /** 体力自然恢复：每 90 秒 1 点 */
    public static final int ENERGY_REGEN_SECONDS = 90;
    /** 打工一次消耗的体力 */
    public static final int WORK_ENERGY_COST = 12;
    /** 两次打工之间的冷却（秒），避免无脑连点把体力瞬间刷成金币 */
    public static final int WORK_COOLDOWN_SECONDS = 20;
    /** 打工工资区间：表现最差也有底薪，满分约 46 */
    public static final int WORK_BASE_WAGE = 8;
    public static final int WORK_BONUS_MAX = 38;
    /** 健身房：一次训练的花费 / 体力上限增量 / 上限天花板 */
    public static final int GYM_TRAIN_COST = 30;
    public static final int GYM_TRAIN_BONUS = 5;
    public static final int ENERGY_MAX_CAP = 160;
    /** 健身房：一瓶蛋白饮的价格与恢复量 */
    public static final int GYM_DRINK_COST = 8;
    public static final int GYM_DRINK_RESTORE = 30;
    /** 小游戏每日金币上限：防止刷分把经济刷崩 */
    public static final int GAME_DAILY_CAP = 240;
    /** 公园长椅：免费歇脚，恢复少量体力，有冷却防止站着不动刷满 */
    public static final int BENCH_RESTORE = 15;
    public static final int BENCH_COOLDOWN_SECONDS = 120;

    /**
     * 路边贩卖机货道。
     * 价格便宜、恢复量小 —— 它是「差一点就能再打一班」的应急补给，
     * 而不是把体力的主要来源从睡觉搬到贩卖机。
     * key 是稳定标识，价格 / 恢复量只认这张表，客户端改不了。
     */
    private static final Object[][] DRINK_CATALOG = {
        // key,    名称,     单价, 恢复体力, 一句话
        {"water",  "矿泉水",  3,   8,  "冰的，喝完喉咙很舒服"},
        {"cola",   "可乐",    4,  12,  "气泡冲上鼻尖，人一下就醒了"},
        {"sprite", "雪碧",    4,  12,  "柠檬味，配关东煮刚好"},
        {"fanta",  "芬达",    5,  12,  "橙色的，像把夕阳喝下去"},
        {"milk",   "牛奶",    5,  14,  "睡前一瓶，会长高的"},
        {"coffee", "罐装咖啡", 6,  18,  "打工人的燃料"},
        {"energy", "能量饮料", 12, 40,  "喝完心跳有点快，慎用"}
    };

    private static final DateTimeFormatter LOG_FMT = DateTimeFormatter.ofPattern("MM-dd HH:mm");

    private final UserMapper userMapper;
    private final ArticleMapper articleMapper;
    private final PurchaseMapper purchaseMapper;
    private final CoinLogMapper coinLogMapper;

    public EconomyService(UserMapper userMapper, ArticleMapper articleMapper,
                          PurchaseMapper purchaseMapper, CoinLogMapper coinLogMapper) {
        this.userMapper = userMapper;
        this.articleMapper = articleMapper;
        this.purchaseMapper = purchaseMapper;
        this.coinLogMapper = coinLogMapper;
    }

    /* ============================================================
     *  对外：状态
     * ============================================================ */

    /**
     * 小镇状态快照：余额、体力、恢复倒计时、已购数量、今日游戏收入等。
     *
     * <p>体力是「读的时候算」的：不跑定时任务，避免为了一个小站养一个调度器。
     * 每次读取顺手把这段时间恢复的体力结算进库。</p>
     */
    public Map<String, Object> state(Long userId) {
        User u = settle(userId);

        int max = energyMaxOf(u);
        LocalDateTime anchor = u.getEnergyAt();
        int nextRegenIn = 0;
        if (energyOf(u) < max) {
            long elapsed = anchor == null ? ENERGY_REGEN_SECONDS
                    : Math.max(0, Duration.between(anchor, LocalDateTime.now()).getSeconds());
            nextRegenIn = (int) Math.max(1, ENERGY_REGEN_SECONDS - (elapsed % ENERGY_REGEN_SECONDS));
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("money", moneyOf(u));
        resp.put("energy", energyOf(u));
        resp.put("energyMax", max);
        resp.put("regenSeconds", ENERGY_REGEN_SECONDS);
        resp.put("nextRegenIn", nextRegenIn);
        resp.put("workEnergyCost", WORK_ENERGY_COST);
        resp.put("workReadyIn", workReadyIn(userId));
        resp.put("trainCost", GYM_TRAIN_COST);
        resp.put("trainBonus", GYM_TRAIN_BONUS);
        resp.put("drinkCost", GYM_DRINK_COST);
        resp.put("drinkRestore", GYM_DRINK_RESTORE);
        resp.put("energyMaxCap", ENERGY_MAX_CAP);
        resp.put("sleptToday", LocalDate.now().equals(u.getLastSleepDate()));
        resp.put("ownedCount", purchaseMapper.selectArticleIds(userId).size());
        resp.put("gameEarnedToday", gameEarnedToday(userId));
        resp.put("gameDailyCap", GAME_DAILY_CAP);
        resp.put("benchRestore", BENCH_RESTORE);
        resp.put("benchReadyIn", benchReadyIn(userId));
        return resp;
    }

    /** 已购书目 id 列表（书店标记「已入手」） */
    public List<Long> ownedIds(Long userId) {
        return purchaseMapper.selectArticleIds(userId);
    }

    /** 金币流水，最新的在前 */
    public List<Map<String, Object>> logs(Long userId, Integer limit) {
        int n = (limit == null || limit < 1) ? 20 : Math.min(limit, 60);
        List<CoinLog> rows = coinLogMapper.selectList(new LambdaQueryWrapper<CoinLog>()
                .eq(CoinLog::getUserId, userId)
                .orderByDesc(CoinLog::getId)
                .last("LIMIT " + n));
        List<Map<String, Object>> out = new ArrayList<>(rows.size());
        for (CoinLog r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.getId());
            m.put("delta", r.getDelta());
            m.put("balance", r.getBalance());
            m.put("reason", r.getReason());
            m.put("detail", r.getDetail());
            m.put("createdAt", r.getCreatedAt() == null ? "" : r.getCreatedAt().format(LOG_FMT));
            out.add(m);
        }
        return out;
    }

    /* ============================================================
     *  便利店：打工
     * ============================================================ */

    /**
     * 结算一次打工。
     *
     * @param rawScore 收银小游戏的命中表现（0~100），客户端传来的值会被夹住
     * @return { money, energy, wage, score, ...state }
     */
    @Transactional
    public Map<String, Object> work(Long userId, Integer rawScore) {
        User u = settle(userId);

        long readyIn = workReadyIn(userId);
        if (readyIn > 0) {
            throw new BusinessException("刚下班，先歇一歇，还有 " + readyIn + " 秒");
        }
        if (energyOf(u) < WORK_ENERGY_COST) {
            throw new BusinessException("体力不够搬货了：回家睡一觉，或去健身房买瓶蛋白饮");
        }

        int score = rawScore == null ? 0 : Math.max(0, Math.min(100, rawScore));
        // 底薪 + 表现奖金，四舍五入到整币
        int wage = WORK_BASE_WAGE + Math.round(score * WORK_BONUS_MAX / 100f);

        u.setEnergy(energyOf(u) - WORK_ENERGY_COST);
        u.setEnergyAt(energyAnchor());
        int balance = moneyOf(u) + wage;
        u.setMoney(balance);
        saveWallet(u);
        writeLog(userId, wage, balance, "store", "便利店打工 · 收银 " + score + " 分");

        Map<String, Object> resp = new LinkedHashMap<>(state(userId));
        resp.put("wage", wage);
        resp.put("score", score);
        return resp;
    }

    /* ============================================================
     *  健身房
     * ============================================================ */

    /** 撸铁：花钱提高体力上限，顺带恢复一点体力（练完总要喘口气） */
    @Transactional
    public Map<String, Object> gymTrain(Long userId) {
        User u = settle(userId);
        int max = energyMaxOf(u);
        if (max >= ENERGY_MAX_CAP) {
            throw new BusinessException("体力上限已经练到顶了（" + ENERGY_MAX_CAP + "），去书店补充点精神食粮吧");
        }
        if (moneyOf(u) < GYM_TRAIN_COST) {
            throw new BusinessException("金币不够请教练，先去便利店打一班");
        }

        int balance = moneyOf(u) - GYM_TRAIN_COST;
        u.setMoney(balance);
        u.setEnergyMax(Math.min(ENERGY_MAX_CAP, max + GYM_TRAIN_BONUS));
        u.setEnergy(Math.min(u.getEnergyMax(), energyOf(u) + 15));
        u.setEnergyAt(energyAnchor());
        saveWallet(u);
        writeLog(userId, -GYM_TRAIN_COST, balance, "gym", "健身房私教课 · 体力上限 +" + GYM_TRAIN_BONUS);

        Map<String, Object> resp = new LinkedHashMap<>(state(userId));
        resp.put("energyMax", u.getEnergyMax());
        return resp;
    }

    /** 蛋白饮：小额恢复体力，是「还想再打一班」的应急方案 */
    @Transactional
    public Map<String, Object> gymDrink(Long userId) {
        User u = settle(userId);
        int max = energyMaxOf(u);
        if (energyOf(u) >= max) {
            throw new BusinessException("体力已经是满的，先消耗一点再喝");
        }
        if (moneyOf(u) < GYM_DRINK_COST) {
            throw new BusinessException("金币不够，一瓶蛋白饮要 " + GYM_DRINK_COST + " 金币");
        }

        int balance = moneyOf(u) - GYM_DRINK_COST;
        u.setMoney(balance);
        u.setEnergy(Math.min(max, energyOf(u) + GYM_DRINK_RESTORE));
        u.setEnergyAt(energyAnchor());
        saveWallet(u);
        writeLog(userId, -GYM_DRINK_COST, balance, "gym", "蛋白饮 · 体力 +" + GYM_DRINK_RESTORE);

        Map<String, Object> resp = new LinkedHashMap<>(state(userId));
        resp.put("energy", u.getEnergy());
        return resp;
    }

    /* ============================================================
     *  公园：长椅歇脚
     * ============================================================ */

    /**
     * 在公园长椅上坐一会儿：免费，恢复少量体力，{@value #BENCH_COOLDOWN_SECONDS} 秒一次。
     *
     * <p>设计意图：给「体力差一点点」的人一个不用花钱的台阶，
     * 但恢复量远低于睡觉（回满）和蛋白饮（30），所以不会让体力系统失去意义。</p>
     */
    @Transactional
    public Map<String, Object> bench(Long userId) {
        User u = settle(userId);
        long readyIn = benchReadyIn(userId);
        if (readyIn > 0) {
            throw new BusinessException("刚坐过一会儿了，再走两圈，还有 " + readyIn + " 秒");
        }
        int max = energyMaxOf(u);
        if (energyOf(u) >= max) {
            throw new BusinessException("体力已经是满的，不如去便利店打一班");
        }

        int before = energyOf(u);
        u.setEnergy(Math.min(max, before + BENCH_RESTORE));
        u.setEnergyAt(energyAnchor());
        saveWallet(u);
        writeLog(userId, 0, moneyOf(u), "bench", "公园长椅歇脚 · 体力 +" + (u.getEnergy() - before));

        Map<String, Object> resp = new LinkedHashMap<>(state(userId));
        resp.put("restored", u.getEnergy() - before);
        return resp;
    }

    /* ============================================================
     *  路边贩卖机
     * ============================================================ */

    /** 贩卖机货道列表（含当前余额是否买得起，前端直接渲染） */
    public List<Map<String, Object>> drinks() {
        List<Map<String, Object>> out = new ArrayList<>(DRINK_CATALOG.length);
        for (Object[] row : DRINK_CATALOG) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("key", row[0]);
            m.put("name", row[1]);
            m.put("price", row[2]);
            m.put("restore", row[3]);
            m.put("note", row[4]);
            out.add(m);
        }
        return out;
    }

    /**
     * 投币买一瓶：扣钱、回体力、记账。
     *
     * <p>体力已满时直接拒绝 —— 免得手滑把钱浪费在已经装满的槽里。</p>
     */
    @Transactional
    public Map<String, Object> buyDrink(Long userId, String key) {
        Object[] item = null;
        for (Object[] row : DRINK_CATALOG) {
            if (row[0].equals(key)) { item = row; break; }
        }
        if (item == null) {
            throw new BusinessException("这台机器上没有这种饮料");
        }
        String name = (String) item[1];
        int price = (Integer) item[2];
        int restore = (Integer) item[3];

        User u = settle(userId);
        int max = energyMaxOf(u);
        if (energyOf(u) >= max) {
            throw new BusinessException("体力已经满了，喝下去就浪费了");
        }
        if (moneyOf(u) < price) {
            throw new BusinessException("金币不够，这瓶要 " + price + " 金币");
        }

        int balance = moneyOf(u) - price;
        int before = energyOf(u);
        u.setMoney(balance);
        u.setEnergy(Math.min(max, before + restore));
        u.setEnergyAt(energyAnchor());
        saveWallet(u);
        writeLog(userId, -price, balance, "drink", "贩卖机 · " + name + "（体力 +" + (u.getEnergy() - before) + "）");

        Map<String, Object> resp = new LinkedHashMap<>(state(userId));
        resp.put("drink", name);
        resp.put("restored", u.getEnergy() - before);
        return resp;
    }

    /* ============================================================
     *  家：睡觉
     * ============================================================ */

    /** 睡一觉：一天一次，体力回满 */
    @Transactional
    public Map<String, Object> sleep(Long userId) {
        User u = settle(userId);
        if (LocalDate.now().equals(u.getLastSleepDate())) {
            throw new BusinessException("今天已经睡过了，再睡就真的变成猫了");
        }
        int max = energyMaxOf(u);
        u.setEnergy(max);
        u.setEnergyAt(LocalDateTime.now());
        u.setLastSleepDate(LocalDate.now());
        saveWallet(u);
        writeLog(userId, 0, moneyOf(u), "sleep", "在家睡了一觉 · 体力回满");

        Map<String, Object> resp = new LinkedHashMap<>(state(userId));
        resp.put("energy", max);
        return resp;
    }

    /* ============================================================
     *  书店：买书
     * ============================================================ */

    /**
     * 买下一本书，永久解锁全文。
     *
     * <p>价格以数据库为准（客户端只传 id）；已买过、余额不足都会明确拒绝。
     * 唯一索引 `uk_user_article` 兜住并发下的重复下单。</p>
     */
    @Transactional
    public Map<String, Object> buy(Long userId, Long articleId) {
        Article a = articleMapper.selectById(articleId);
        if (a == null) {
            throw new BusinessException("这本书不在店里，可能已经下架");
        }
        int price = a.getPrice() == null ? 0 : a.getPrice();
        if (price <= 0) {
            throw new BusinessException("这是免费试读本，直接翻开就好");
        }
        if (purchaseMapper.countOwned(userId, articleId) > 0) {
            throw new BusinessException("这本书已经在你的书架上了");
        }

        User u = settle(userId);
        if (moneyOf(u) < price) {
            throw new BusinessException("金币不足：还差 " + (price - moneyOf(u)) + " 金币，去便利店打一班吧");
        }

        Purchase p = new Purchase();
        p.setUserId(userId);
        p.setArticleId(articleId);
        p.setPrice(price);
        try {
            purchaseMapper.insert(p);
        } catch (DuplicateKeyException e) {
            throw new BusinessException("这本书已经在你的书架上了");
        }

        int balance = moneyOf(u) - price;
        u.setMoney(balance);
        saveWallet(u);
        writeLog(userId, -price, balance, "book", "买下《" + shortTitle(a.getTitle()) + "》");

        Map<String, Object> resp = new LinkedHashMap<>(state(userId));
        resp.put("articleId", articleId);
        resp.put("price", price);
        return resp;
    }

    /* ============================================================
     *  小游戏奖励
     * ============================================================ */

    /**
     * 小游戏结算：把分数换成金币，有每日上限，收益随时间递减（防刷）。
     *
     * <p>映射规则：每 60 分 = 1 金币，单局最多 40 金币；
     * 今日累计超过上限后不再入账，但游戏照常可以玩。</p>
     *
     * @return { reward, money, capped } —— reward = 0 且 capped = true 表示今天已经赚满
     */
    @Transactional
    public Map<String, Object> gameReward(Long userId, String game, Integer rawScore) {
        int score = rawScore == null ? 0 : Math.max(0, Math.min(20000, rawScore));
        int want = Math.min(40, score / 60);
        int today = gameEarnedToday(userId);
        int room = Math.max(0, GAME_DAILY_CAP - today);
        int reward = Math.min(want, room);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("reward", reward);
        resp.put("capped", want > 0 && reward < want);

        if (reward > 0) {
            User u = settle(userId);
            int balance = moneyOf(u) + reward;
            u.setMoney(balance);
            saveWallet(u);
            writeLog(userId, reward, balance, "game", gameLabel(game) + " · " + score + " 分");
            resp.put("money", balance);
        } else {
            User u = userMapper.selectById(userId);
            resp.put("money", u == null ? 0 : moneyOf(u));
        }
        return resp;
    }

    /** 是否已解锁全文：免费本、已购买、作者本人、管理员都算 */
    public boolean canReadFull(User viewer, Article article) {
        int price = article.getPrice() == null ? 0 : article.getPrice();
        if (price <= 0) return true;
        if (viewer == null) return false;
        if (viewer.getPermission() != null && viewer.getPermission() == 0) return true;
        return purchaseMapper.countOwned(viewer.getId(), article.getId()) > 0;
    }

    /* ============================================================
     *  内部工具
     * ============================================================ */

    /** 取用户并把该补的体力补上（幂等：没有可恢复的就原样返回） */
    private User settle(Long userId) {
        User u = userMapper.selectById(userId);
        if (u == null) {
            throw new UnauthorizedException("用户不存在或已被注销");
        }
        int max = energyMaxOf(u);
        int cur = energyOf(u);
        LocalDateTime anchor = u.getEnergyAt();
        LocalDateTime now = LocalDateTime.now();

        if (cur >= max) {
            // 满体力时不推进锚点，保证「用掉之后重新开始计时」
            if (anchor == null) {
                u.setEnergyAt(now);
                saveWallet(u);
            }
            return u;
        }
        if (anchor == null) {
            u.setEnergyAt(now);
            saveWallet(u);
            return u;
        }

        long elapsed = Duration.between(anchor, now).getSeconds();
        if (elapsed < ENERGY_REGEN_SECONDS) return u;

        int gain = (int) (elapsed / ENERGY_REGEN_SECONDS);
        int next = Math.min(max, cur + gain);
        u.setEnergy(next);
        u.setEnergyAt(next >= max ? now : anchor.plusSeconds((long) gain * ENERGY_REGEN_SECONDS));
        saveWallet(u);
        return u;
    }

    /**
     * 扣体力 / 加体力之后，恢复计时的锚点一律重置为「现在」。
     *
     * <p>如果沿用旧锚点，从满体力掉到不满时会按上一次满体力的时间一次性补一大截，
     * 等于白嫖；统一在这里取 now()，各调用点不用各写一遍。</p>
     */
    private LocalDateTime energyAnchor() {
        return LocalDateTime.now();
    }

    /** 只写钱包相关列，避免 updateById 把整行（含密码哈希）写回 */
    private void saveWallet(User u) {
        userMapper.update(null, new LambdaUpdateWrapper<User>()
                .eq(User::getId, u.getId())
                .set(User::getMoney, u.getMoney())
                .set(User::getEnergy, u.getEnergy())
                .set(User::getEnergyMax, u.getEnergyMax())
                .set(User::getEnergyAt, u.getEnergyAt())
                .set(User::getLastSleepDate, u.getLastSleepDate()));
    }

    private void writeLog(Long userId, int delta, int balance, String reason, String detail) {
        CoinLog log = new CoinLog();
        log.setUserId(userId);
        log.setDelta(delta);
        log.setBalance(balance);
        log.setReason(reason);
        log.setDetail(detail != null && detail.length() > 120 ? detail.substring(0, 120) : detail);
        coinLogMapper.insert(log);
    }

    /** 距离下次可以打工还有多少秒（0 = 现在就能上工） */
    private long workReadyIn(Long userId) {
        LocalDateTime last = coinLogMapper.selectLastAt(userId, "store");
        if (last == null) return 0;
        long passed = Duration.between(last, LocalDateTime.now()).getSeconds();
        return Math.max(0, WORK_COOLDOWN_SECONDS - passed);
    }

    /** 距离下次能在长椅上歇脚还有多少秒（0 = 现在就可以） */
    private long benchReadyIn(Long userId) {
        LocalDateTime last = coinLogMapper.selectLastAt(userId, "bench");
        if (last == null) return 0;
        long passed = Duration.between(last, LocalDateTime.now()).getSeconds();
        return Math.max(0, BENCH_COOLDOWN_SECONDS - passed);
    }

    private int gameEarnedToday(Long userId) {
        Integer sum = coinLogMapper.sumTodayByReason(userId, "game");
        return sum == null ? 0 : sum;
    }

    private static int moneyOf(User u) {
        return u.getMoney() == null ? 0 : u.getMoney();
    }

    private static int energyOf(User u) {
        return u.getEnergy() == null ? energyMaxOf(u) : u.getEnergy();
    }

    private static int energyMaxOf(User u) {
        return u.getEnergyMax() == null || u.getEnergyMax() <= 0 ? 100 : u.getEnergyMax();
    }

    private static String gameLabel(String game) {
        if (game == null) return "小游戏";
        switch (game) {
            case "snake": return "花瓣贪吃蛇";
            case "tetris": return "樱落方块";
            case "fish": return "樱海大鱼";
            default: return "小游戏";
        }
    }

    private static String shortTitle(String title) {
        if (title == null) return "无题";
        return title.length() > 16 ? title.substring(0, 16) + "…" : title;
    }
}

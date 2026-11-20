package com.fenglin.springboottest.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.fenglin.springboottest.dto.CheatRequest;
import com.fenglin.springboottest.entity.Article;
import com.fenglin.springboottest.entity.CoinLog;
import com.fenglin.springboottest.entity.Purchase;
import com.fenglin.springboottest.entity.User;
import com.fenglin.springboottest.exception.BusinessException;
import com.fenglin.springboottest.mapper.ArticleMapper;
import com.fenglin.springboottest.mapper.CoinLogMapper;
import com.fenglin.springboottest.mapper.PurchaseMapper;
import com.fenglin.springboottest.mapper.UserMapper;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 后台「作弊台」：管理员可以直接给某个账号加金币、改体力与体力上限。
 *
 * <p>为什么单独一个 Service：正常的小镇经济里，余额只能通过打工 / 游戏 / 买书变动，
 * 每个入口都要校验冷却、上限、价格。作弊台是唯一的「无约束入口」，
 * 把这些例外集中在一处，比在 EconomyService 里到处开口子安全得多 ——
 * 后者一旦忘了加校验，玩家就能直接刷钱。</p>
 *
 * <p>但有三条底线仍然保留：</p>
 * <ol>
 *   <li>只有数据库里 permission=0 的账号能调用（每次重新查库，降权立即失效）；</li>
 *   <li>改余额必须同时写一条 coin_log（reason=cheat），账本上没有来路的钱是不允许的；</li>
 *   <li>数值仍然落在合法范围里（金币非负、体力不超过上限），否则后续结算会算错。</li>
 * </ol>
 */
@Service
public class CheatService {

    /** 金币上限：给到 999 万，够用又不会把 INT 撑爆 */
    private static final int MONEY_MIN = 0;
    private static final int MONEY_MAX = 9_999_999;
    /** 体力上限的地板与天花板：天花板特意远高于游戏的 160，作弊就是要能突破 */
    private static final int ENERGY_MAX_FLOOR = 1;
    private static final int ENERGY_MAX_CAP = 9_999;
    /** 单次增量绝对值上限，挡住手滑输入 99999999 这种 */
    private static final int DELTA_LIMIT = 9_999_999;

    private static final String REASON = "cheat";
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter LOG_FMT = DateTimeFormatter.ofPattern("MM-dd HH:mm");

    private final AdminService adminService;
    private final UserMapper userMapper;
    private final ArticleMapper articleMapper;
    private final PurchaseMapper purchaseMapper;
    private final CoinLogMapper coinLogMapper;

    public CheatService(AdminService adminService, UserMapper userMapper, ArticleMapper articleMapper,
                        PurchaseMapper purchaseMapper, CoinLogMapper coinLogMapper) {
        this.adminService = adminService;
        this.userMapper = userMapper;
        this.articleMapper = articleMapper;
        this.purchaseMapper = purchaseMapper;
        this.coinLogMapper = coinLogMapper;
    }

    // ============================================================
    //  读取：某个账号的钱包快照
    // ============================================================

    /**
     * 作弊台打开时先看一眼现状：多少钱、多少体力、上限多少、今天睡过没有。
     *
     * <p>这里故意<b>不</b>调用 {@code EconomyService.state()} —— 那个方法会把
     * 自然恢复的体力结算进库，而作弊台只想看「现在是什么样」，不该有副作用。</p>
     */
    public Map<String, Object> wallet(String authorization, Long targetId) {
        adminService.requireAdmin(authorization);
        User target = requireTarget(targetId);
        return snapshot(target);
    }

    // ============================================================
    //  写入：加钱 / 改属性
    // ============================================================

    /**
     * 执行一次作弊。所有改动在一个事务里完成，并写一条 reason=cheat 的金币流水。
     *
     * <p>应用顺序固定为「先绝对值、再增量」，因此同时传 money=100 与 moneyDelta=50
     * 的结果是 150。日常只传一种即可。</p>
     */
    @Transactional
    public Map<String, Object> apply(String authorization, Long targetId, CheatRequest req) {
        adminService.requireAdmin(authorization);
        if (req == null || req.isEmpty()) {
            throw new BusinessException("没有任何要修改的内容");
        }
        User target = requireTarget(targetId);

        int beforeMoney = moneyOf(target);
        int beforeEnergy = energyOf(target);
        int beforeMax = energyMaxOf(target);

        List<String> changes = new ArrayList<>(4);

        // ---------- 1. 体力上限：先算，因为体力要被它夹住 ----------
        int max = beforeMax;
        if (req.getEnergyMax() != null) {
            max = clamp(req.getEnergyMax(), ENERGY_MAX_FLOOR, ENERGY_MAX_CAP);
        }
        if (req.getEnergyMaxDelta() != null) {
            max = clamp(max + clampDelta(req.getEnergyMaxDelta()), ENERGY_MAX_FLOOR, ENERGY_MAX_CAP);
        }
        if (max != beforeMax) {
            changes.add("体力上限 " + beforeMax + " → " + max);
        }

        // ---------- 2. 体力：不允许超过上限，否则「满体力」判断会失真 ----------
        int energy = Math.min(beforeEnergy, max);
        boolean energyTouched = false;
        if (req.getEnergy() != null) {
            energy = clamp(req.getEnergy(), 0, max);
            energyTouched = true;
        }
        if (req.getEnergyDelta() != null) {
            energy = clamp(energy + clampDelta(req.getEnergyDelta()), 0, max);
            energyTouched = true;
        }
        if (energy != beforeEnergy) {
            changes.add("体力 " + beforeEnergy + " → " + energy);
        }

        // ---------- 3. 金币 ----------
        int money = beforeMoney;
        if (req.getMoney() != null) {
            money = clamp(req.getMoney(), MONEY_MIN, MONEY_MAX);
        }
        if (req.getMoneyDelta() != null) {
            money = clamp(money + clampDelta(req.getMoneyDelta()), MONEY_MIN, MONEY_MAX);
        }
        int moneyDelta = money - beforeMoney;
        if (moneyDelta != 0) {
            changes.add("金币 " + beforeMoney + " → " + money);
        }

        // ---------- 4. 睡觉限制 ----------
        boolean resetSleep = Boolean.TRUE.equals(req.getResetSleep());
        if (resetSleep) {
            changes.add("睡觉冷却已清空");
        }

        // ---------- 5. 落库 ----------
        // 只写这几列：updateById 会把密码哈希整行写回，没必要也不安全
        LambdaUpdateWrapper<User> update = new LambdaUpdateWrapper<User>()
                .eq(User::getId, target.getId())
                .set(User::getMoney, money)
                .set(User::getEnergy, energy)
                .set(User::getEnergyMax, max);
        // 动过体力就把恢复锚点重置到现在，避免沿用旧锚点一次性补一大截
        if (energyTouched || max != beforeMax) {
            update.set(User::getEnergyAt, LocalDateTime.now());
        }
        if (resetSleep) {
            update.set(User::getLastSleepDate, null);
        }
        userMapper.update(null, update);

        // ---------- 6. 一键解锁书目 ----------
        int unlocked = 0;
        if (Boolean.TRUE.equals(req.getUnlockAll())) {
            unlocked = unlockAll(target.getId());
            if (unlocked > 0) {
                changes.add("解锁 " + unlocked + " 本付费书");
            }
        }

        // ---------- 7. 记账：即使只改了体力（delta=0）也留一笔，方便回看谁动过 ----------
        writeLog(target.getId(), moneyDelta, money, describe(changes));

        Map<String, Object> resp = new LinkedHashMap<>(snapshot(requireTarget(targetId)));
        resp.put("unlocked", unlocked);
        resp.put("beforeMoney", beforeMoney);
        resp.put("beforeEnergy", beforeEnergy);
        resp.put("beforeEnergyMax", beforeMax);
        return resp;
    }

    /** 把全部付费书目塞进书架，返回本次新增的本数（已拥有的跳过） */
    private int unlockAll(Long userId) {
        List<Article> paid = articleMapper.selectList(new LambdaQueryWrapper<Article>()
                .select(Article::getId, Article::getTitle, Article::getPrice)
                .gt(Article::getPrice, 0));
        int added = 0;
        for (Article a : paid) {
            if (purchaseMapper.countOwned(userId, a.getId()) > 0) continue;
            Purchase p = new Purchase();
            p.setUserId(userId);
            p.setArticleId(a.getId());
            p.setPrice(0); // 作弊入手的，成交价记 0
            try {
                purchaseMapper.insert(p);
                added++;
            } catch (DuplicateKeyException ignored) {
                // 并发下 uk_user_article 兜住了，已经拥有就算了
            }
        }
        return added;
    }

    // ============================================================
    //  内部工具
    // ============================================================

    private User requireTarget(Long targetId) {
        if (targetId == null) {
            throw new BusinessException("请先选择要作弊的用户");
        }
        User target = userMapper.selectById(targetId);
        if (target == null) {
            throw new BusinessException("用户不存在");
        }
        return target;
    }

    private Map<String, Object> snapshot(User target) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", target.getId());
        m.put("name", target.getName());
        m.put("permission", target.getPermission() == null ? 1 : target.getPermission());
        m.put("money", moneyOf(target));
        m.put("energy", energyOf(target));
        m.put("energyMax", energyMaxOf(target));
        m.put("energyAt", target.getEnergyAt() == null ? "" : target.getEnergyAt().format(TIME_FMT));
        m.put("lastSleepDate", target.getLastSleepDate() == null ? "" : target.getLastSleepDate().toString());
        m.put("sleptToday", LocalDate.now().equals(target.getLastSleepDate()));
        m.put("ownedCount", purchaseMapper.selectArticleIds(target.getId()).size());
        m.put("logs", recentLogs(target.getId()));
        return m;
    }

    /** 最近 6 条金币流水：作弊完能立刻在面板里看到自己刚动过什么 */
    private List<Map<String, Object>> recentLogs(Long userId) {
        List<CoinLog> rows = coinLogMapper.selectList(new LambdaQueryWrapper<CoinLog>()
                .eq(CoinLog::getUserId, userId)
                .orderByDesc(CoinLog::getId)
                .last("LIMIT 6"));
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

    /** 只写钱包相关列，避免 updateById 把整行（含密码哈希）写回 */
    private void writeLog(Long userId, int delta, int balance, String detail) {
        CoinLog log = new CoinLog();
        log.setUserId(userId);
        log.setDelta(delta);
        log.setBalance(balance);
        log.setReason(REASON);
        log.setDetail(detail != null && detail.length() > 120 ? detail.substring(0, 120) : detail);
        coinLogMapper.insert(log);
    }

    private static String describe(List<String> changes) {
        if (changes.isEmpty()) return "作弊台 · 查看";
        return "作弊台 · " + String.join(" · ", changes);
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private static int clampDelta(int delta) {
        return clamp(delta, -DELTA_LIMIT, DELTA_LIMIT);
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
}

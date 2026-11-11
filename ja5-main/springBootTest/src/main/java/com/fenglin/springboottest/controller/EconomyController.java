package com.fenglin.springboottest.controller;

import com.fenglin.springboottest.config.AuthSupport;
import com.fenglin.springboottest.dto.BuyRequest;
import com.fenglin.springboottest.dto.DrinkRequest;
import com.fenglin.springboottest.dto.GameRewardRequest;
import com.fenglin.springboottest.dto.WorkRequest;
import com.fenglin.springboottest.service.EconomyService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 樱花小镇 · 金币 / 体力接口（全部需要登录）。
 *
 * <pre>
 * GET  /api/economy/state          小镇状态：余额、体力、倒计时、已购数量
 * GET  /api/economy/owned          已购书目 id 列表
 * GET  /api/economy/logs?limit=20  金币流水
 * POST /api/economy/work           { score }      便利店打工结算
 * POST /api/economy/gym/train                      健身房私教课
 * POST /api/economy/gym/drink                      健身房蛋白饮
 * POST /api/economy/sleep                          回家睡觉（每天一次）
 * POST /api/economy/bench                          公园长椅歇脚（免费，有冷却）
 * GET  /api/economy/drinks                         路边贩卖机货道
 * POST /api/economy/drinks/buy     { key }         投币买一瓶饮料
 * POST /api/economy/shop/buy       { articleId }   书店买书
 * POST /api/economy/game           { game, score } 小游戏结算
 * </pre>
 *
 * 所有返回值都带上最新的 state 字段，前端一次请求就能把 HUD 刷新到最新，
 * 不用再补一次 GET。
 */
@RestController
@RequestMapping("/api/economy")
public class EconomyController {

    private final EconomyService economyService;
    private final AuthSupport authSupport;

    public EconomyController(EconomyService economyService, AuthSupport authSupport) {
        this.economyService = economyService;
        this.authSupport = authSupport;
    }

    /** 小镇状态 */
    @GetMapping("/state")
    public Map<String, Object> state(@RequestHeader(value = "Authorization", required = false) String auth) {
        return economyService.state(authSupport.requireUserId(auth));
    }

    /** 已购书目 id */
    @GetMapping("/owned")
    public Map<String, Object> owned(@RequestHeader(value = "Authorization", required = false) String auth) {
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("list", economyService.ownedIds(authSupport.requireUserId(auth)));
        return resp;
    }

    /** 金币流水 */
    @GetMapping("/logs")
    public Map<String, Object> logs(
            @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("list", economyService.logs(authSupport.requireUserId(auth), limit));
        return resp;
    }

    /** 便利店打工 */
    @PostMapping("/work")
    public Map<String, Object> work(
            @Valid @RequestBody(required = false) WorkRequest req,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        Long uid = authSupport.requireUserId(auth);
        Integer score = req == null ? 0 : req.getScore();
        return economyService.work(uid, score);
    }

    /** 健身房私教课 */
    @PostMapping("/gym/train")
    public Map<String, Object> gymTrain(
            @RequestHeader(value = "Authorization", required = false) String auth) {
        return economyService.gymTrain(authSupport.requireUserId(auth));
    }

    /** 健身房蛋白饮 */
    @PostMapping("/gym/drink")
    public Map<String, Object> gymDrink(
            @RequestHeader(value = "Authorization", required = false) String auth) {
        return economyService.gymDrink(authSupport.requireUserId(auth));
    }

    /** 回家睡觉 */
    @PostMapping("/sleep")
    public Map<String, Object> sleep(
            @RequestHeader(value = "Authorization", required = false) String auth) {
        return economyService.sleep(authSupport.requireUserId(auth));
    }

    /** 公园长椅歇脚 */
    @PostMapping("/bench")
    public Map<String, Object> bench(
            @RequestHeader(value = "Authorization", required = false) String auth) {
        return economyService.bench(authSupport.requireUserId(auth));
    }

    /** 贩卖机货道列表 */
    @GetMapping("/drinks")
    public Map<String, Object> drinks(
            @RequestHeader(value = "Authorization", required = false) String auth) {
        // 需要登录：列表本身不敏感，但这样能顺手带上余额判断，省一次请求
        authSupport.requireUserId(auth);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("list", economyService.drinks());
        return resp;
    }

    /** 贩卖机买饮料 */
    @PostMapping("/drinks/buy")
    public Map<String, Object> buyDrink(
            @Valid @RequestBody DrinkRequest req,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        return economyService.buyDrink(authSupport.requireUserId(auth), req.getKey());
    }

    /** 书店买书 */
    @PostMapping("/shop/buy")
    public Map<String, Object> buy(
            @Valid @RequestBody BuyRequest req,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        return economyService.buy(authSupport.requireUserId(auth), req.getArticleId());
    }

    /** 小游戏结算 */
    @PostMapping("/game")
    public Map<String, Object> game(
            @Valid @RequestBody GameRewardRequest req,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        return economyService.gameReward(authSupport.requireUserId(auth), req.getGame(), req.getScore());
    }
}

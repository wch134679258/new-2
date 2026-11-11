package com.fenglin.springboottest.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * 小游戏结算请求（家 · 书桌上的笔记本）。
 *
 * <p>game 只用于流水文案（snake / tetris / fish），不参与金额计算；
 * score 会被夹到 0~20000，再按「每 60 分 1 金币、单局上限 40」折算。</p>
 */
public class GameRewardRequest {

    private String game;

    @Min(value = 0, message = "分数不能是负数")
    @Max(value = 20000, message = "分数超出上限")
    private Integer score;

    public String getGame() {
        return game;
    }

    public void setGame(String game) {
        this.game = game;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }
}

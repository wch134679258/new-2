package com.fenglin.springboottest.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * 便利店打工结算请求。
 *
 * <p>score 是收银小游戏的命中表现（0~100），只作为奖金依据。
 * 就算客户端伪造一个大数，服务端也会夹到 100，工资上限固定在 46。</p>
 */
public class WorkRequest {

    @Min(value = 0, message = "表现分不能是负数")
    @Max(value = 100, message = "表现分最高 100")
    private Integer score;

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }
}

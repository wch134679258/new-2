package com.fenglin.springboottest.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 贩卖机购买请求：只传货道 key（如 cola），价格与恢复量由服务端货道表决定。
 */
public class DrinkRequest {

    @NotBlank(message = "请选择要买的饮料")
    private String key;

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }
}

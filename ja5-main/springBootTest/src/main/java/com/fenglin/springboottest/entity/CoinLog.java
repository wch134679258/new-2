package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDateTime;

/**
 * 金币流水：每一次余额变动都留一笔，方便在「便利店账本」里回看。
 *
 * <p>写流水和改余额必须在同一个事务里，否则会出现有账无钱 / 有钱无账。</p>
 */
@TableName("coin_log")
public class CoinLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    /** 正数入账，负数出账 */
    private Integer delta;

    /** 这笔之后的余额 */
    private Integer balance;

    /** book=买书 / store=便利店工资 / gym=健身房 / game=小游戏 / sleep=睡觉 */
    private String reason;

    /** 可读说明，例如「《龙族》入手」 */
    private String detail;

    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Integer getDelta() {
        return delta;
    }

    public void setDelta(Integer delta) {
        this.delta = delta;
    }

    public Integer getBalance() {
        return balance;
    }

    public void setBalance(Integer balance) {
        this.balance = balance;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getDetail() {
        return detail;
    }

    public void setDetail(String detail) {
        this.detail = detail;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

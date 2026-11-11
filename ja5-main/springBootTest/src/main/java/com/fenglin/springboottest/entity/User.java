package com.fenglin.springboottest.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 用户表实体
 */
@TableName("user")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 昵称（唯一登录名） */
    private String name;

    /** BCrypt 加密后的密码 */
    private String password;

    /** 权限：1=默认用户，0=管理员 */
    private Integer permission;

    /** 金币余额：便利店打工、游戏结算、买书都动这一项 */
    private Integer money;

    /** 当前体力：打工 / 训练消耗，随时间自然恢复 */
    private Integer energy;

    /** 体力上限，健身房训练可以练高 */
    private Integer energyMax;

    /** 体力恢复的结算锚点：读的时候按时间差补上这段时间的自然恢复 */
    private LocalDateTime energyAt;

    /** 上次睡觉日期：每天只能靠睡觉回满一次 */
    private LocalDate lastSleepDate;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public User() {
    }

    public User(String name, String password) {
        this.name = name;
        this.password = password;
        this.permission = 1;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Integer getPermission() {
        return permission;
    }

    public void setPermission(Integer permission) {
        this.permission = permission;
    }

    public Integer getMoney() {
        return money;
    }

    public void setMoney(Integer money) {
        this.money = money;
    }

    public Integer getEnergy() {
        return energy;
    }

    public void setEnergy(Integer energy) {
        this.energy = energy;
    }

    public Integer getEnergyMax() {
        return energyMax;
    }

    public void setEnergyMax(Integer energyMax) {
        this.energyMax = energyMax;
    }

    public LocalDateTime getEnergyAt() {
        return energyAt;
    }

    public void setEnergyAt(LocalDateTime energyAt) {
        this.energyAt = energyAt;
    }

    public LocalDate getLastSleepDate() {
        return lastSleepDate;
    }

    public void setLastSleepDate(LocalDate lastSleepDate) {
        this.lastSleepDate = lastSleepDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

package com.fenglin.springboottest.dto;

/**
 * 后台「作弊台」请求：一次性给某个用户加/改属性与金币。
 *
 * <p>约定：每一对字段（绝对值 + 增量）都会按「先设定、再累加」的顺序应用，
 * 只传其中一种就是最常用的语义。所有字段都可以不传（null = 不改这一项）。</p>
 *
 * <pre>
 * { "money": 9999 }          金币直接设成 9999
 * { "moneyDelta": 500 }      金币 +500（负数就是扣）
 * { "energy": 100,
 *   "energyMax": 200 }       体力 100、上限 200
 * { "resetSleep": true }     清掉「今天已睡」的限制
 * { "unlockAll": true }      一键解锁全部付费书目
 * </pre>
 */
public class CheatRequest {

    /** 金币绝对值 */
    private Integer money;

    /** 金币增量，可负 */
    private Integer moneyDelta;

    /** 体力绝对值（会被夹到 0 ~ 体力上限） */
    private Integer energy;

    /** 体力增量，可负 */
    private Integer energyDelta;

    /** 体力上限绝对值 */
    private Integer energyMax;

    /** 体力上限增量，可负 */
    private Integer energyMaxDelta;

    /** true = 清掉今天睡过觉的标记，可以再睡一次 */
    private Boolean resetSleep;

    /** true = 把全部付费书目直接放进书架（0 元成交，记流水） */
    private Boolean unlockAll;

    public Integer getMoney() {
        return money;
    }

    public void setMoney(Integer money) {
        this.money = money;
    }

    public Integer getMoneyDelta() {
        return moneyDelta;
    }

    public void setMoneyDelta(Integer moneyDelta) {
        this.moneyDelta = moneyDelta;
    }

    public Integer getEnergy() {
        return energy;
    }

    public void setEnergy(Integer energy) {
        this.energy = energy;
    }

    public Integer getEnergyDelta() {
        return energyDelta;
    }

    public void setEnergyDelta(Integer energyDelta) {
        this.energyDelta = energyDelta;
    }

    public Integer getEnergyMax() {
        return energyMax;
    }

    public void setEnergyMax(Integer energyMax) {
        this.energyMax = energyMax;
    }

    public Integer getEnergyMaxDelta() {
        return energyMaxDelta;
    }

    public void setEnergyMaxDelta(Integer energyMaxDelta) {
        this.energyMaxDelta = energyMaxDelta;
    }

    public Boolean getResetSleep() {
        return resetSleep;
    }

    public void setResetSleep(Boolean resetSleep) {
        this.resetSleep = resetSleep;
    }

    public Boolean getUnlockAll() {
        return unlockAll;
    }

    public void setUnlockAll(Boolean unlockAll) {
        this.unlockAll = unlockAll;
    }

    /** 有没有任何一项要改（全是空就直接拒绝，免得白跑一次） */
    public boolean isEmpty() {
        return money == null && moneyDelta == null
                && energy == null && energyDelta == null
                && energyMax == null && energyMaxDelta == null
                && !Boolean.TRUE.equals(resetSleep)
                && !Boolean.TRUE.equals(unlockAll);
    }
}

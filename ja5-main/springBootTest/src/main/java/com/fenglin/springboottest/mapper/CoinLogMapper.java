package com.fenglin.springboottest.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fenglin.springboottest.entity.CoinLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;

/**
 * 金币流水 Mapper。
 *
 * <p>除了普通增删查，这里放两条「经济规则要用的小统计」：
 * 打工冷却要看最近一次工资时间，游戏收益要看今天已经赚了多少。</p>
 */
@Mapper
public interface CoinLogMapper extends BaseMapper<CoinLog> {

    /** 某个用户某类流水最近一次发生的时间（打工冷却用） */
    @Select("SELECT MAX(created_at) FROM coin_log WHERE user_id = #{userId} AND reason = #{reason}")
    LocalDateTime selectLastAt(@Param("userId") Long userId, @Param("reason") String reason);

    /** 今日某类流水累计金额（小游戏每日上限用）；只统计正数入账 */
    @Select("SELECT COALESCE(SUM(delta), 0) FROM coin_log "
            + "WHERE user_id = #{userId} AND reason = #{reason} AND delta > 0 AND created_at >= CURDATE()")
    Integer sumTodayByReason(@Param("userId") Long userId, @Param("reason") String reason);
}

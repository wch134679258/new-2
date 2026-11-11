package com.fenglin.springboottest.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fenglin.springboottest.entity.Purchase;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 已购书目 Mapper。
 */
@Mapper
public interface PurchaseMapper extends BaseMapper<Purchase> {

    /** 当前用户已购的书目 id（书店列表标记「已入手」用） */
    @Select("SELECT article_id FROM purchase WHERE user_id = #{userId}")
    List<Long> selectArticleIds(Long userId);

    /** 某本书是否已被该用户买下（详情页判断要不要上锁） */
    @Select("SELECT COUNT(*) FROM purchase WHERE user_id = #{userId} AND article_id = #{articleId}")
    int countOwned(Long userId, Long articleId);
}

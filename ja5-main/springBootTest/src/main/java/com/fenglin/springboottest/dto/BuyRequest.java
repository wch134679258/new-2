package com.fenglin.springboottest.dto;

import jakarta.validation.constraints.NotNull;

/**
 * 书店购买请求：只传书目 id，价格一律由服务端从数据库读。
 */
public class BuyRequest {

    @NotNull(message = "请选择要买的书")
    private Long articleId;

    public Long getArticleId() {
        return articleId;
    }

    public void setArticleId(Long articleId) {
        this.articleId = articleId;
    }
}

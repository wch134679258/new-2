package com.fenglin.springboottest.service;

import com.fenglin.springboottest.dto.ArticleItem;
import com.fenglin.springboottest.entity.Article;
import com.fenglin.springboottest.entity.User;
import com.fenglin.springboottest.exception.BusinessException;
import com.fenglin.springboottest.mapper.ArticleMapper;
import com.fenglin.springboottest.mapper.FavoriteMapper;
import com.fenglin.springboottest.mapper.PurchaseMapper;
import com.fenglin.springboottest.mapper.UserMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 文章阅读服务：详情（浏览量自增 + 收藏状态 + 书店解锁判断）、相关文章推荐。
 */
@Service
public class ArticleService {

    /** 相关文章展示条数 */
    private static final int RELATED_LIMIT = 4;
    /** 未购买时能读到的正文比例（剩下的留给书店） */
    private static final double PREVIEW_RATIO = 0.35;
    /** 试读段落最短长度，避免极短正文被截成一句半 */
    private static final int PREVIEW_MIN = 120;
    /** 至少要给书店留下这么多字，否则试读就等于全文了 */
    private static final int PAYWALL_MIN = 60;

    private final ArticleMapper articleMapper;
    private final FavoriteMapper favoriteMapper;
    private final LikeService likeService;
    private final UserMapper userMapper;
    private final PurchaseMapper purchaseMapper;

    public ArticleService(ArticleMapper articleMapper, FavoriteMapper favoriteMapper, LikeService likeService,
                          UserMapper userMapper, PurchaseMapper purchaseMapper) {
        this.articleMapper = articleMapper;
        this.favoriteMapper = favoriteMapper;
        this.likeService = likeService;
        this.userMapper = userMapper;
        this.purchaseMapper = purchaseMapper;
    }

    /**
     * 文章详情。
     *
     * <p>打开详情即浏览量 +1（SQL 自增，避免并发覆盖）；
     * 登录用户额外返回 favorited（当前是否已收藏该文），未登录为 false。</p>
     *
     * <p><b>书店模式</b>：售价大于 0 且没买过时，正文只返回前 28%（试读段），
     * 并带 locked=true、price，前端据此渲染「还差多少金币」的购买卡。
     * 免费本 / 已购买 / 管理员都能拿到全文。</p>
     *
     * @param id        文章 id
     * @param viewerId  当前登录用户 id，未登录传 null
     */
    public Map<String, Object> detail(Long id, Long viewerId) {
        Article a = articleMapper.selectById(id);
        if (a == null) {
            throw new BusinessException("文章不存在或已被删除");
        }
        articleMapper.incrementViews(id);

        boolean favorited = false;
        User viewer = viewerId == null ? null : userMapper.selectById(viewerId);
        if (viewer != null) {
            favorited = favoriteMapper.selectCount(new LambdaQueryWrapper<com.fenglin.springboottest.entity.Favorite>()
                    .eq(com.fenglin.springboottest.entity.Favorite::getUserId, viewerId)
                    .eq(com.fenglin.springboottest.entity.Favorite::getArticleId, id)) > 0;
        }

        int price = a.getPrice() == null ? 0 : a.getPrice();
        boolean unlocked = price <= 0
                || (viewer != null && viewer.getPermission() != null && viewer.getPermission() == 0)
                || (viewer != null && purchaseMapper.countOwned(viewer.getId(), id) > 0);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", a.getId());
        resp.put("title", a.getTitle());
        resp.put("summary", a.getSummary());
        resp.put("content", unlocked ? a.getContent() : previewOf(a.getContent()));
        resp.put("author", a.getAuthor());
        resp.put("categoryId", a.getCategoryId());
        resp.put("category", a.getCategory());
        resp.put("tags", ArticleItem.splitTags(a.getTags()));
        // 本地已自增 1，直接返回 +1 后的浏览量，无需再查一次库
        resp.put("views", (a.getViews() == null ? 0 : a.getViews()) + 1);
        resp.put("createdAt", a.getCreatedAt() == null ? "" : a.getCreatedAt().format(ArticleItem.FMT));
        resp.put("updatedAt", a.getUpdatedAt() == null ? "" : a.getUpdatedAt().format(ArticleItem.FMT));
        resp.put("favorited", favorited);
        // 点赞态（登录用户）与点赞总数（公开）
        resp.put("liked", viewerId != null && likeService.isLiked(viewerId, id));
        resp.put("likes", likeService.countOfArticle(id));
        // 书店：价格 / 是否上锁 / 是否已入手 / 全文预估字数（试读卡上展示）
        resp.put("price", price);
        resp.put("locked", !unlocked);
        resp.put("owned", price > 0 && viewer != null && purchaseMapper.countOwned(viewer.getId(), id) > 0);
        resp.put("wordCount", a.getContent() == null ? 0 : a.getContent().length());
        return resp;
    }

    /**
     * 试读正文：按比例截断，尽量在换行处断开，避免把一句话切成两半。
     */
    private static String previewOf(String content) {
        if (content == null || content.isEmpty()) return "";
        int total = content.length();
        if (total <= PAYWALL_MIN + PREVIEW_MIN) return content;
        int cut = Math.max(PREVIEW_MIN, (int) Math.round(total * PREVIEW_RATIO));
        cut = Math.min(cut, total - PAYWALL_MIN);
        if (cut >= total) return content;
        int lineBreak = content.lastIndexOf('\n', cut);
        if (lineBreak > PREVIEW_MIN) cut = lineBreak;
        return content.substring(0, cut);
    }

    /**
     * 相关文章：优先推共享标签的文章（共同标签越多越相关）；
     * 一篇共享标签的文章都没有时，退化为同分类按热度推荐。
     */
    public List<ArticleItem> related(Long id) {
        Article a = articleMapper.selectById(id);
        if (a == null) {
            throw new BusinessException("文章不存在或已被删除");
        }
        List<Article> hits = articleMapper.selectRelatedByTags(id, RELATED_LIMIT);
        if (hits.isEmpty() && a.getCategoryId() != null) {
            hits = articleMapper.selectRelatedByCategory(id, a.getCategoryId(), RELATED_LIMIT);
        }
        List<ArticleItem> items = new ArrayList<>(hits.size());
        for (Article h : hits) {
            items.add(ArticleItem.from(h));
        }
        return items;
    }
}

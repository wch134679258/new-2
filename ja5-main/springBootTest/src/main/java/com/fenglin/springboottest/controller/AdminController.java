package com.fenglin.springboottest.controller;

import com.fenglin.springboottest.dto.AdminArticleRequest;
import com.fenglin.springboottest.dto.AdminCategoryRequest;
import com.fenglin.springboottest.dto.AdminTagRequest;
import com.fenglin.springboottest.dto.CheatRequest;
import com.fenglin.springboottest.dto.LoginRequest;
import com.fenglin.springboottest.dto.PermissionUpdateRequest;
import com.fenglin.springboottest.service.AdminService;
import com.fenglin.springboottest.service.AuthService;
import com.fenglin.springboottest.service.CheatService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 后台管理接口。
 * 除登录外，所有接口都要求 Bearer token 且数据库中的 permission=0。
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthService authService;
    private final AdminService adminService;
    private final CheatService cheatService;

    public AdminController(AuthService authService, AdminService adminService, CheatService cheatService) {
        this.authService = authService;
        this.adminService = adminService;
        this.cheatService = cheatService;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody LoginRequest req) {
        return authService.adminLogin(req);
    }

    @GetMapping("/stats")
    public Map<String, Object> stats(
            @RequestHeader(value = "Authorization", required = false) String auth) {
        return adminService.stats(auth);
    }

    @GetMapping("/articles")
    public Map<String, Object> articles(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        return adminService.articles(auth, keyword, page, size);
    }

    @GetMapping("/articles/{id}")
    public Map<String, Object> articleDetail(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable Long id) {
        return adminService.articleDetail(auth, id);
    }

    @PostMapping("/articles")
    public Map<String, Object> createArticle(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody AdminArticleRequest req) {
        return adminService.saveArticle(auth, null, req);
    }

    @PutMapping("/articles/{id}")
    public Map<String, Object> updateArticle(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable Long id,
            @RequestBody AdminArticleRequest req) {
        return adminService.saveArticle(auth, id, req);
    }

    @DeleteMapping("/articles/{id}")
    public Map<String, Object> deleteArticle(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable Long id) {
        adminService.deleteArticle(auth, id);
        return Map.of("message", "文章已删除");
    }

    @GetMapping("/categories")
    public Object categories(
            @RequestHeader(value = "Authorization", required = false) String auth) {
        return adminService.categories(auth);
    }

    @PostMapping("/categories")
    public Map<String, Object> createCategory(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody AdminCategoryRequest req) {
        return adminService.saveCategory(auth, null, req);
    }

    @PutMapping("/categories/{id}")
    public Map<String, Object> updateCategory(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable Long id,
            @RequestBody AdminCategoryRequest req) {
        return adminService.saveCategory(auth, id, req);
    }

    @DeleteMapping("/categories/{id}")
    public Map<String, Object> deleteCategory(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable Long id) {
        adminService.deleteCategory(auth, id);
        return Map.of("message", "分类已删除");
    }

    @GetMapping("/tags")
    public Object tags(
            @RequestHeader(value = "Authorization", required = false) String auth) {
        return adminService.tags(auth);
    }

    @PostMapping("/tags")
    public Map<String, Object> createTag(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody AdminTagRequest req) {
        return adminService.saveTag(auth, null, req);
    }

    @PutMapping("/tags/{id}")
    public Map<String, Object> updateTag(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable Long id,
            @RequestBody AdminTagRequest req) {
        return adminService.saveTag(auth, id, req);
    }

    @DeleteMapping("/tags/{id}")
    public Map<String, Object> deleteTag(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable Long id) {
        adminService.deleteTag(auth, id);
        return Map.of("message", "标签已删除");
    }

    @GetMapping("/users")
    public Map<String, Object> users(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        return adminService.users(auth, keyword, page, size);
    }

    @PutMapping("/users/{id}/permission")
    public Map<String, Object> updatePermission(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable Long id,
            @RequestBody PermissionUpdateRequest req) {
        return adminService.updatePermission(auth, id, req.getPermission());
    }

    /**
     * 作弊台：读取某个账号的钱包现状（金币 / 体力 / 上限 / 已购书 / 最近流水）。
     * 只读，不会推进体力恢复的锚点。
     */
    @GetMapping("/users/{id}/wallet")
    public Map<String, Object> userWallet(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable Long id) {
        return cheatService.wallet(auth, id);
    }

    /**
     * 作弊台：直接给某个账号加金币、改体力与体力上限。
     *
     * <pre>
     * POST /api/admin/users/2/cheat
     * { "moneyDelta": 1000 }                 金币 +1000
     * { "money": 9999, "energy": 100 }       金币设为 9999、体力设为 100
     * { "energyMax": 300, "resetSleep": true } 上限 300、清掉今天的睡觉限制
     * { "unlockAll": true }                  一键解锁全部付费书目
     * </pre>
     */
    @PostMapping("/users/{id}/cheat")
    public Map<String, Object> cheat(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable Long id,
            @RequestBody CheatRequest req) {
        return cheatService.apply(auth, id, req);
    }
}

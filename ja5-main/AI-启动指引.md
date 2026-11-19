# AI 快速启动指引（ja4 项目）

> **本文件写给 AI 助手看**（人类也可参考）。这台电脑每次重置后 `node_modules`、`target` 文件夹会被删除，请依赖本文件避免重复探索，直接执行标准流程。
> 最后更新：2026-10-16（新增：文章详情/收藏/搜索建议 + 《凡人修仙传》小说内容 + 前端多页面；详见「八、2026-10-16 功能升级」）

**测试账号**：昵称 `verify用户`，密码 `abc12345`（2026-10-16 重新入库，可直接登录验证；注意数据库当天被重置过，`段先生` 账号的密码未知）
**版本管理**：项目根目录已是 git 仓库（分支 main）。改动代码后请提交；开机后如怀疑文件被动过，可用 `git status` / `git diff` 对比。

## 一、项目结构（都在 C:\Users\Administrator\Desktop\ja3-main\）

```
Desktop\ja4\
├─ 启动项目.bat / 启动前端.bat / 启动后端.bat / 停止项目.bat   ← GBK 编码一键脚本
├─ AI-启动指引.md    ← 本文件
├─ _archive\        冗余副本归档区（2026-10-19 从 ja3-main 移入，可随时删）
└─ ja3-main\
   ├─ aurora-vue-2\     前端：Vue3 + Vite，端口 5173（Aurora 登录/注册页）
   ├─ springBootTest\   后端：Spring Boot 3.4.5 + MyBatis-Plus，端口 8081（自带 mvnw）
   └─ *.rar             原始压缩包，勿删
```

## 二、环境（已确认可用，无需重新检查）

- **Node**：系统 PATH 有 node（D:\Program Files\nodejs，v20.11）；AI 沙盒内优先用托管版：
  `C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-2\node.exe`
- **Java**：Zulu 21（PATH 有 java），满足项目要求（JDK 17+）
- **Maven**：无全局 mvn，用 `springBootTest\mvnw.cmd`（阿里云镜像已配置，~/.m2 已缓存约 800MB）
- **MySQL 8.0**：已安装，服务自启（3306 端口），账号 root / 123456
- **数据库**：`springboot_test` 库已建好（user 表：id/name/password，name 唯一索引，**无 email 列**）。若库被重置，重跑 `springBootTest\init-db.sql`（mysql 客户端在 C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe）
- **npm 缓存**：C:\Users\Administrator\AppData\Local\npm-cache（若缓存保留，安装很快）

## 三、开机后的标准流程（AI 直接照做，不要重新分析）

1. **推荐：一键启动**（AI 请用 PowerShell 工具后台调用，用户可直接双击）：
   ```
   & "C:\Users\Administrator\Desktop\ja3-main\启动后端.bat"    ← 后台运行
   & "C:\Users\Administrator\Desktop\ja3-main\启动前端.bat"    ← 后台运行
   ```
   脚本会自动 npm install / mvnw 编译，**不依赖已删除的 node_modules、target**
2. **验证就绪**（轮询即可）：
   - `curl http://localhost:5173` → 200
   - `curl http://localhost:8081/api/auth/captcha` → JSON
3. **打开页面**：http://localhost:5173 （昵称 + 密码注册/登录，带图形验证码）
4. **停止项目**：运行 `停止项目.bat`（kill 5173、8081 端口进程）

**实测耗时参考**：前端冷启动约 30 秒（依赖重装），热启动约 5 秒；后端冷编译约 60-70 秒，热启动约 20 秒。

## 四、关键事实（避免不必要的思考）

- **登录方式**：昵称 + 密码。**邮箱功能已全部移除**（表单、后端 DTO/Service/实体、数据库列、verify_code 表均已删）
- 接口签名：
  - `POST /api/auth/register { name, password, captchaId, captcha }` → `{ token, userId }`
  - `POST /api/auth/login { name, password, remember }` → `{ token, userId }`
  - `GET /api/auth/me`（Bearer token）→ `{ id, name }`
- `vite.config.js` 已配置 `/api → http://localhost:8081` 代理，前端**无需 .env**；后端 CorsConfig 也放行 5173（双保险）
- JWT 密钥与数据库密码均为演示值（root/123456），生产需替换
- 图形验证码存后端内存 Map，重启后端即失效（正常现象）；4 位字母数字不区分大小写
- 每次开机 node_modules、target 必被清空 → **这是设计如此，不是故障**，脚本已适配

## 五、AI 沙盒环境的坑（脚本已内置规避，若手动执行需注意）

- 沙盒会注入 `SERVER__PORT`（双下划线）环境变量，Spring 宽松绑定会把它当成 `server.port`，导致后端绑到错误端口 → 手动跑后端前先清掉
- 沙盒注入的 HTTP_PROXY/HTTPS_PROXY 指向会失效的本地代理 → 手动 npm 前先清掉
- bash 里 `cmd //c 中文.bat` 传参会乱码 → 用 PowerShell 工具 `& "路径.bat"` 代替
- PowerShell 工具前台运行拿不到 stdout → 用 run_in_background 后台运行再用 TaskOutput 读输出
- cmd 黑名单：sc.exe、wmic.exe、reg.exe、从 bash 调 powershell 均被禁

## 六、首页搜索（2026-10-14 完成）

**数据模型（两级分类）**：
- `category` 一级分类（前端/后端/设计/数据库/工程）
- `tag` 二级标签，`category_id` 归属一级分类
- `article_tag` 文章↔标签多对多；`article.category_id` 冗余一级分类便于过滤
- **建表脚本**：`springBootTest/init-db.sql`（全量，幂等）；已有库增量升级用 `springBootTest/migrate-category.sql`（幂等，自动回填关联）

**接口**（均公开无需登录）：
- `GET /api/search?q=&categoryId=&tagId=&sort=hot|new&page=&size=` —— 关键词命中 标题/摘要/正文/作者/标签串，有关键词时按「标题命中>标签命中>热度」相关度排序；分类与标签可叠加（分级分类交叉检索）
- `GET /api/search/categories` —— 分类树（一级分类+其下标签+文章数）
- `GET /api/search/hot-tags` —— 热门标签（按关联文章数倒序）

**前端**：`HomePage.vue` 已接入（分类导航、二级标签联动、热度/最新排序、筛选面包屑、分页）；API 封装在 `src/api/search.js`。

**AI 沙盒跑后端的坑（新增）**：沙盒的 `SERVER__PORT` 会让后端绑错端口（实测跑到 8080）。正确姿势：
```bash
env -u SERVER_PORT -u SERVER__PORT -u SERVER_ADDRESS -u SERVER__ADDRESS -u SERVER_HOST -u SERVER__HOST -u MAVEN_OPTS \
  HTTP_PROXY= HTTPS_PROXY= http_proxy= https_proxy= \
  java -classpath "$MVN_HOME/boot/plexus-classworlds-2.8.0.jar" -Dclassworlds.conf="$MVN_HOME/bin/m2.conf" \
  -Dmaven.home="$MVN_HOME" -Dmaven.multiModuleProjectDirectory="$PWD" \
  org.codehaus.plexus.classworlds.launcher.Launcher -o -DskipTests spring-boot:run -Dspring-boot.run.jvmArguments="-Dserver.port=8081"
```
（`mvn`/`mvnw` shell 脚本在沙盒内因 classworlds 加载问题不可用，直接用 java 调 Launcher 可行）

## 七、已知缺失 / 可改进（截至 2026-10-14）

- `后端\`、`后端文件\` 冗余副本文件夹，建议归档避免混淆
- 后端无单元测试
- 密码找回功能随邮箱一并移除（如需找回，可后续加管理员重置或手机号方案）
- `user` 表中 `段先生` 的旧密码 hash 与任何已知口令不匹配（历史遗留数据），已新增 `verify用户`/`abc12345` 作为可用测试账号

## 八、2026-10-16 功能升级（文章详情 / 收藏 / 搜索建议 / 小说内容）

### 8.1 数据库变更（幂等迁移脚本，按序执行）

```
springBootTest/migrate-novel.sql     新增「小说」分类 + 7 个标签 + 《凡人修仙传》5 篇文章（含正文）
springBootTest/migrate-novel-more.sql 小说第二辑：《龙族》《蛊真人》《诡秘之主》作品级标签 + 6 篇文章（含正文）
springBootTest/migrate-favorite.sql  新增 favorite 收藏表（user_id + article_id 联合唯一）
```

> 2026-10-16 当天库被重置过（只剩 `段先生`），上述两个脚本已执行；测试账号 `verify用户`/`abc12345`
> 已用 BCrypt 重新入库（id=2）。若库再被重置，重跑 init-db.sql + 这两个迁移脚本即可。

### 8.2 新增后端接口

```
GET  /api/article/{id}              文章详情（浏览量 +1；带 Bearer token 时返回 favorited）
GET  /api/article/{id}/related      相关文章（共享标签优先，同分类兜底，最多 4 条）
GET  /api/search/suggest?q=         搜索建议（标题 5 条 + 标签 5 条）
POST /api/favorites/{articleId}     收藏（需登录）   -> { message }
DELETE /api/favorites/{articleId}   取消收藏（需登录）
GET  /api/favorites?page=&size=     我的收藏列表（分页，需登录）
GET  /api/favorites/ids             已收藏的文章 id 列表（需登录，列表页标记收藏态）
```

关键类：`ArticleService` / `FavoriteService` / `ArticleController` / `FavoriteController` /
`FavoriteMapper(.xml)`；`ArticleItem.from()` 为搜索/收藏/相关文章共用的实体转 DTO 工厂；
`JwtUtil.tryGetUserId()` 用于「可选登录」接口（详情页：未登录也能看，登录了多返回收藏态）。

### 8.3 前端结构（视图状态机，无 vue-router）

App.vue 管理 view：`auth / home / article / favorites / discover / about`，body 加 `view-home` 类开启滚动。

```
src/api/http.js        统一请求层（token 注入 / 401 清token / {message} 错误提取），auth|search|article|favorites 四个 api 共用
src/api/article.js     详情 / 相关文章
src/api/favorites.js   收藏列表 / ids / 收藏 / 取消
src/components/SiteNav.vue       全站导航（首页/发现/收藏/关于全部可用）
src/components/ArticleCard.vue   文章卡片（整卡可点击、分类/标签可点、星星收藏）
src/components/ArticleDetail.vue 阅读页（正文分段、收藏、相关文章、返回）
src/components/FavoritesPage.vue 我的收藏（未登录引导登录、可直接取消收藏）
src/components/DiscoverPage.vue  发现页（最新/热门/分类入口）
src/components/AboutPage.vue     关于页（项目介绍 + 技术栈 + 测试账号）
src/components/SearchBar.vue     升级：建议下拉（防抖 250ms）+ 搜索历史（localStorage）+ 键盘导航 + 关键词高亮
src/components/HomePage.vue      升级：卡片进详情、卡片收藏、数字分页、支持跨页面初始筛选 initialFilter
```

修复：首页结果卡片 `.rcard` 原本只有媒体查询里的 padding、无基础样式（裸奔），现已由 ArticleCard 提供完整样式。

### 8.4 验证记录（2026-10-16 全部通过）

- 搜索「凡人修仙传」→ 5 条结果，标题命中优先（id 16/18/19/20 + 韩立人物志）
- 搜索建议 `q=凡人` → 3 条标题 + 2 条标签
- 详情/相关文章/收藏增删查/重复收藏 400/未登录 401/收藏不存在文章 400 均符合预期
- 前端 `vite build` 通过，8 个新组件经 dev server 逐一编译 200

### 8.5 环境备注

- `mvnw package` 离线会因缺 surefire 插件依赖失败；重启后端用文档「六」节末尾的 java Launcher 方式跑 `spring-boot:run`（compile 离线可用）
- Windows curl 传中文 JSON body：先 `printf` 写入**Windows 绝对路径**文件，再 `--data-binary @绝对路径`（MSYS 的 /tmp 路径 curl.exe 不认）

---

## 九、2026-10-19 后端加固（稳定性 / 安全 / 日志）

### 9.1 目录结构变化

- `ja3-main/后端/`、`ja3-main/后端文件/` → 归档到 **`_archive/`**（`git mv`，历史可追溯）
- `springBootTest/` 内新增：`config/AuthSupport.java`、`resources/logback-spring.xml`
- `springBootTest/` 内重命名：`application-prob.properties` → **`application-prod.properties`**（原名拼写错误）
- `UserController.java`（遗留 demo，密码硬编码 123、`/user/test` 打印配置）**经用户确认保留原样**，未删除，仅在此记录风险

### 9.2 配置与日志

| 项 | 改动 |
|---|---|
| `application.properties` | 中文注释原先全是 `?`（文件编码已损坏）→ 重写为 UTF-8；修正 `com.fengling`→`com.fenglin` 拼写（原配置从未生效）；新增优雅停机、错误不回传堆栈 |
| SQL 日志 | `StdOutImpl`（直接刷 stdout、绕过日志级别、无法归档）→ `Slf4jImpl`，由 `logging.level.com.fenglin.springboottest.mapper=debug` 控制 |
| 日志文件 | `log/xx.log` 单文件不轮转 → `log/springboot-test.log`，**10MB/天滚动 + gz + 保留 14 天 + 总量 200MB 封顶** |
| 多环境 | 新增 `application-prod.properties`（HikariCP 调参、敏感项走环境变量、SQL 日志关闭） |
| logback 坑 | `logback-spring.xml` 里 **不要 include** `org/springframework/boot/logging/logback/console.xml`——`spring-boot:run` 下解析不到，控制台日志会整段消失；改为自己定义 CONSOLE appender |

### 9.3 安全加固

- **JwtUtil**：`secret.getBytes()` 平台默认编码 → `StandardCharsets.UTF_8`（消除跨平台签名不互认的隐患）；补 HS384 密钥 ≥48 字节前置校验；`JwtParser` 缓存复用（线程安全）
- **AuthService**：`BCryptPasswordEncoder` 提升为单例 bean；注册补长度上限 + `DuplicateKeyException` 竞态转换（不再 500）；**登录失败 5 次锁定 60 秒**（内存计数，重启清零）
- **CaptchaService**：`new Random()` → `ThreadLocalRandom`；内存 Map 加上限 2000，防刷接口撑爆内存
- **AuthSupport**（新）：三处 Controller 各自复制的 Bearer 解析逻辑收敛为 `requireUserId` / `optionalUserId`

### 9.4 接口响应约定（新增）

`GlobalExceptionHandler` 现在兜底所有异常，**永远返回 `{message}` JSON，不再回 HTML 错误页**：

| 场景 | 状态码 | message |
|---|---|---|
| 业务异常 | 400 | 原文案 |
| 未登录 / 令牌无效 | 401 | 请先登录 / 登录已过期，请重新登录 |
| JSON 格式错误 | 400 | 请求体格式不正确，请检查后重试 |
| `@Valid` 校验失败 | 400 | `name 请输入昵称`（字段名 + 原因） |
| 参数类型错误 | 400 | 参数格式不正确：categoryId |
| 方法不支持 | 405 | 不支持的请求方法：POST |
| 路径不存在 | 404 | 接口不存在 |
| 唯一索引冲突 | 409 | 数据冲突，记录可能已存在 |
| 未预期异常 | 500 | 服务器内部错误，请稍后再试（堆栈只进日志） |

### 9.5 验证记录（2026-10-19 全部通过）

- `mvnw compile`：**BUILD SUCCESS**，34 个源文件零警告
- 冒烟：captcha / search / categories / hot-tags / suggest / article 详情 / related / favorites 增删查 / 重复收藏 400 / 未登录 401 / 假 token 401
- 新异常分支逐一验证：坏 JSON 400、空昵称 400、非数字 categoryId 400、POST /api/search 405、不存在路径 404
- 登录限流：连续 5 次失败后第 6 次返回「尝试次数过多，请 60 秒后再试」

### 9.6 本次踩坑记录（供后续参考）

- **数据库被重置过**：本机 MySQL 里 `springboot_test` 库曾不存在（`Unknown database`）→ 重跑 `init-db.sql` + `migrate-novel.sql` + `migrate-favorite.sql`
- `verify用户` 的旧 BCrypt hash 与 `abc12345` 不匹配 → 已用后端同款 `BCryptPasswordEncoder` 重新生成 hash 更新，测试账号恢复可用
- bash 直接 `cmd //c` 会被 MSYS 路径转换坑到；`./mvnw.cmd` 直接可执行
- 用 curl 发中文 JSON body 必须 `--data-binary @Windows绝对路径`（见 8.5）

## 十、2026-10-19 星空贪吃蛇小游戏（前后端联动）

### 10.1 功能概览

- 前端新页面 `aurora-vue-2/src/components/SpaceSnake.vue`（Canvas 实现，无新增依赖），入口：登录后导航栏「游戏」
- 玩法：光蛇吞噬小星球变长；普通星球 +10 分，金色星球 +50 分（约 12% 概率）；每吃一颗航速加快，撞边界 / 撞自己结束
- 交互：方向键 / WASD / 触屏滑动 / 虚拟方向键；空格暂停；切窗口自动暂停；**全屏按钮**（Fullscreen API，Esc 退出）
- 视觉：星空视差背景 + 极光星云（呼应 AuroraBackground）、发光蛇身（青→紫渐变）、带环行星、粒子与浮字特效、死亡震屏
- 本地最高分存 `localStorage`（`aurora_snake_best`）；联网成绩走 `/api/game` 接口

### 10.2 数据库变更

执行 `springBootTest/migrate-game-score.sql`（幂等）：

- 新表 `game_score`（id, user_id, nickname 快照, score, length, duration, created_at）
- 排名口径：分数 DESC → duration ASC → id ASC；`idx_game_score_rank` 联合索引

### 10.3 新增后端接口

| 方法 | 路径 | 登录 | 说明 |
|---|---|---|---|
| POST | `/api/game/scores` | 是 | 提交成绩 `{score, length, duration}` → `{message, score, best, isNewBest, rank, playCount, leaderboard}` |
| GET | `/api/game/leaderboard?limit=10` | 否 | 排行榜 Top N（1~50）→ `{list: [ScoreItem]}` |
| GET | `/api/game/my-best` | 是 | 我的最好成绩 → `{best, rank, playCount}` |

- 新增文件：`entity/GameScore.java`、`mapper/GameScoreMapper.java`、`service/GameScoreService.java`、`controller/GameController.java`、`dto/ScoreRequest.java`、`dto/ScoreItem.java`（record）
- 昵称由服务端按 userId 反查（`userMapper.selectById`），客户端伪造不了；分数/长度/时长均有 `@Valid` 上限校验

### 10.4 前端文件

- 新增：`src/components/SpaceSnake.vue`、`src/api/game.js`
- 改动：`App.vue`（视图状态机新增 `game` 分支）、`SiteNav.vue`（菜单新增「游戏」）、`AboutPage.vue`（特性卡片 + 简介）
- `style.css`：**修复「不能滑动」**——`body` 原写死 `overflow:hidden`，窗口矮于登录卡时内容被裁剪且无法滚动；改为 `overflow-y:auto` + `place-items:safe center`（内容超高时从顶部排列，避免居中裁剪）

### 10.5 验证记录（2026-10-19 全部通过）

- `mvnw compile` BUILD SUCCESS；`npm run build` 44 modules 零错误
- 接口冒烟：未登录提交 401、`limit=0` 回落默认 10、越界 score 400（`@Valid`）、正常提交返回 rank + 最新榜单、`my-best` 无成绩时 best=0
- 前端：游戏页渲染 / 开始 / 暂停 / 重开 / 结算遮罩 / 提交按钮状态机均按预期（构建 + 逻辑走查）



---

## 十一、2026-10-23 交互与站点结构补全（后端接口 + 前端页面）

### 11.1 后端

**新增表（幂等脚本 `springBootTest/migrate-history-like.sql`）**：`read_history`（浏览历史）、`article_like`（点赞），均为 user_id + article_id 联合唯一。

**新增接口**

| 方法 | 路径 | 登录 | 说明 |
|---|---|---|---|
| POST | `/api/history/{articleId}` | 是 | 记录浏览（重复浏览只刷新时间） |
| GET | `/api/history?page=&size=` | 是 | 浏览历史（按浏览时间倒序，带 viewedAt） |
| DELETE | `/api/history/{articleId}` | 是 | 删除一条 |
| DELETE | `/api/history` | 是 | 清空，返回 removed |
| POST | `/api/likes/{articleId}` | 是 | 点赞 → `{ liked, likes }` |
| DELETE | `/api/likes/{articleId}` | 是 | 取消点赞 → `{ liked, likes }` |
| GET | `/api/likes/ids` | 是 | 我点赞过的 id |
| GET | `/api/likes/{articleId}/count` | 否 | 某文章点赞数 |
| GET | `/api/user/profile` | 是 | 个人中心汇总 `{ user, stats:{favorites,history,likes}, game }` |

关键类：`HistoryService` / `LikeService` / `ProfileService` + 三个 Controller；
`dto/HistoryItem`（`@JsonIgnore` 掉 tagsRaw，对外只给拆好的 tags 数组）；
`ArticleService.detail` 新增 `liked` / `likes` 两个字段。

**数据**：`migrate-article-content.sql`（幂等）把 8 篇技术文章的正文从 ~150 字补全到 ~1300 字 / 6 段（详情页按空行分段渲染）。

**启动脚本**：`启动后端.bat` / `启动前端.bat` 内置 `:killport`，启动前先结束占用 8081 / 5173 的残留进程 —— 解决「二次启动直接崩在端口被占用」。

### 11.2 前端

新增：`api/{history,likes,profile}.js`、`composables/useToast.js`、`components/{ToastHost,StateBlocks,SiteFooter,ProfilePage}.vue`。
改动：`App.vue`（新增 profile 视图 + 全局 ToastHost + 全站页脚）、`SiteNav.vue`（菜单加「我的」，头像可点）、
`ArticleDetail.vue`（点赞按钮 + 浏览历史上报 + 阅读时长 + 点赞数）、
`HomePage/DiscoverPage/FavoritesPage`（操作结果改走 Toast）、`AboutPage.vue`（功能一览 + 项目结构）。

- **Toast**：`toast.success/error/info()`，模块级单例，最多 3 条、悬停暂停、点击关闭
- **StateBlocks**：`variant="skeleton|empty|error"`，骨架屏带微光动画，空/错误态带行动按钮
- **页脚**：登录页与全屏游戏页不显示（App 里按 view 判断）

### 11.3 验证记录

- `mvnw -o compile` BUILD SUCCESS；`npm run build` 59 modules 零错误
- 接口冒烟：profile / history 增删改查 / likes 增删 / ids / count / 详情 liked+likes 全通过
- 文章详情返回 6 段正文、likes=1、liked=true

### 11.4 踩坑

- **Vue SFC 报「Element is missing end tag」**：文件末尾漏了 `</style>`，报错位置会指向 `<style>` 那一行而不是文件末尾，容易误判
- **改 GBK 中文 .bat 禁用 `sed -i`**：会丢掉 CR，cmd 解析崩坏（本次用 `iconv` 转 GBK + `tr/sed` 重建 CRLF）

---

## 十二、2026-10-26 机器重置后的恢复流程（重要：重置会连数据库一起清空）

### 12.1 重置实际会丢什么（比原先记录的更严重）

原先文档只记了 `node_modules` / `target` 被删。实测本次重置后**数据库 `springboot_test` 也被清了**，不只是编译产物：

| 项目 | 重置后的状态 |
|---|---|
| `aurora-vue-2/node_modules` | 消失 → `npm install`（约 30 秒，31 个包） |
| `springBootTest/target` | 消失 → `mvnw.cmd compile` |
| `~/.m2/repository` 中**本项目专用依赖** | 消失（mybatis-plus **3.5.9** spring-boot3-starter、mybatis-plus-jsqlparser 3.5.9、jjwt **0.12.6**） |
| 数据库 `user` 表 | **0 行**，测试账号没了 |
| 数据库 `favorite` / `game_score` / `read_history` / `article_like` | **整表不存在** |
| 《凡人修仙传》5 篇小说文章 | 丢失，article 从 13 篇掉回 8 篇 |

### 12.2 一键恢复（推荐）

双击 **`ja5-main\恢复数据.bat`**（GBK + CRLF），按序跑 8 个幂等脚本并重建测试账号：

```
init-db.sql → migrate-category.sql → migrate-novel.sql → migrate-novel-more.sql
→ migrate-favorite.sql → migrate-game-score.sql → migrate-history-like.sql → migrate-article-content.sql
```

恢复后基准值：**文章 19 / 分类 6 / 标签 37 / 用户 1**（`verify用户` / `abc12345`，id=2）。

### 12.3 手动恢复命令

```bash
# 前端依赖
cd ja5-main/aurora-vue-2 && npm install --no-audit --no-fund

# 后端依赖（注意：不要加 -o，见 12.4）
cd ja5-main/springBootTest && ./mvnw.cmd -B compile
```

测试账号密码哈希用后端同款 BCrypt 生成（**不要**用 `BCryptPasswordEncoder`，它在单文件模式缺 commons-logging 依赖）：

```bash
java -cp "C:/Users/Administrator/.m2/repository/org/springframework/security/spring-security-crypto/6.4.5/spring-security-crypto-6.4.5.jar" Hash2.java abc12345
# Hash2.java: System.out.println(BCrypt.hashpw(a[0], BCrypt.gensalt(10)));
```

### 12.4 关键修正：`mvnw -o`（离线）在本机已不可用

11.3 写的「`mvnw -o compile` BUILD SUCCESS」**已失效**——`~/.m2` 里只剩别的项目的旧版本（mybatis-plus 3.5.1、jjwt 0.9.1），本项目要的 3.5.9 / 0.12.6 不在缓存里，离线模式必然报 `Cannot access aliyunmaven in offline mode`。

> 结论：重置后首次编译**必须联网**（阿里云镜像可用，实测约 28 秒拉完）。联网拉一次后本地才重新有缓存。
> 另：`java -cp` 在 bash 里必须传 **Windows 盘符路径**（`C:/...`），MSYS 的 `/c/...` 路径 JVM 认不到。

### 12.5 验证记录（2026-10-26 全部通过）

- `npm install` 31 包 / `npm run build` 59 modules 零错误
- `mvnw -B compile` BUILD SUCCESS；`spring-boot:run` 正常起在 8081
- 接口冒烟：captcha ✓ / login（verify用户 + abc12345，返回 token）✓ / 搜索「凡人」5 条 ✓
- profile `{user,stats,game}` ✓ / history ✓ / likes/ids ✓ / game/leaderboard ✓

### 12.6 启动脚本路径 bug（已修，双击仍起不来的元凶）

`启动前端.bat` / `启动后端.bat` 是项目还在**仓库根目录**时写的，里面是：

```
cd /d "%~dp0ja5-main\aurora-vue-2"     ← 错
cd /d "%~dp0ja5-main\springBootTest"   ← 错
```

但这两个 bat 现在位于 `ja5-main\` 内，`%~dp0` 已经是 `...\ja5-main\`，再拼一层就变成
不存在的 `ja5-main\ja5-main\aurora-vue-2` → 脚本一运行立即失败。

**正确写法**（`%~dp0` 直接拼子目录）：

```
cd /d "%~dp0aurora-vue-2"
cd /d "%~dp0springBootTest"
```

> 修改 GBK 中文 .bat 后**必须重建 CRLF**：用 `iconv` 转码或 `sed` 处理会吃掉 CR，
> cmd 解析会崩坏（表现是脚本一闪而过、中文变乱码）。改完用 `xxd` 确认行尾是 `0d 0a`。
> 本目录所有 .bat 均为 **GBK + CRLF**，新增脚本请用
> `iconv -f UTF-8 -t GBK xx.bat | sed 's/$/\r/' > tmp && mv tmp xx.bat` 转换。

### 12.7 沙盒内起的服务不持久

`npm run dev` / `spring-boot:run` 在 AI 沙盒后台跑，进程会被回收（实测后端启动成功
2 秒、运行约 26 秒后即被终止，日志无应用级错误）。**只能用于冒烟验证**。
要长期运行请让用户双击 `启动项目.bat`，在用户自己的会话里不会被回收。

---

## 十三、2026-11-04 启动链路重写（快 2~3 倍 + 一键就绪）

### 13.1 项目路径已变

**当前路径：`D:\workSpace\ja5\ja5-main`**（本文档前面章节写的 `C:\Users\Administrator\Desktop\ja3-main`
是历史路径，已失效；脚本内部统一用 `%~dp0` 相对定位，换目录不用改脚本）。

### 13.2 实测数据（同一台机器，热启动）

| 环节 | 旧做法 | 新做法 | 结果 |
|---|---|---|---|
| 后端就绪 | `mvnw spring-boot:run` **11.2 s** | 增量编译 + `java -cp` 直启 **≈7 s**（无改动编译 3.9 s + JVM 3.5 s） | ↓ 约 40% |
| 后端依赖解析 | 每次 Maven 全量启动 | `classpath.txt` 缓存，仅 pom 变更时重算 | 省 4 s |
| 前端就绪 | `npm run dev` **3.4 s** | `node node_modules/vite/bin/vite.js` **1.4 s** | ↓ 约 60% |
| 冷启动 | 两个窗口各跑各的，人工判断好了没 | 并行 + 健康检查 + 自动开浏览器 | 少等一轮 |
| 一键启动 | 无就绪反馈 | 主控轮询 `/api/auth/captcha` 与 `/`，3~8 s 后自动打开页面 | 可感知 |

### 13.3 新脚本分工

```
启动项目.bat   主控：环境检查 → 清端口 → 数据库自检(可选自动恢复) → 并行拉起两端 → 健康检查 → 开浏览器
启动后端.bat   单启后端：依赖 classpath 缓存 → mvnw -o 增量编译 → java 直启（前台，Ctrl+C 停）
启动前端.bat   单启前端：依赖缺了才装 → node 直启 vite
停止项目.bat   按端口结束进程（不再按进程名批量杀 java/node，避免误杀别的项目）
恢复数据.bat   7 个幂等迁移 + 测试账号 + migrate-admin 提权（新增，之前漏了）
```

要点：
- **后端不再走 `spring-boot:run`**：该插件在离线模式下会因 `spring-boot-loader-tools` 等
  插件依赖缺失**直接报错退出**（本次实测 `mvnw -o spring-boot:run` 必失败）。改为
  `dependency:build-classpath` 生成 `target/classpath.txt` + `java -cp` 直启，**离线可用**。
- 编译仍走 Maven（`-o` 优先，失败自动切联网），保证增量编译正确性。
- JVM 参数 `-XX:TieredStopAtLevel=1 -Xss512k -Dspring.jmx.enabled=false`：开发环境只做
  C1 编译换启动速度；devtools 热重启依然生效（日志里 `restartedMain` 可见）。

### 13.4 本次踩的三个坑（改脚本必看）

1. **`set /p` 只能读 1024 字符**：classpath.txt 有 7.3 KB，`set /p DEPCP=<target\classpath.txt`
   会静默截断，表现为 `NoClassDefFoundError: BCryptPasswordEncoder`（前 1KB 里没有这个 jar）。
   必须用 `for /f "usebackq delims=" %%L in ("target\classpath.txt") do set "DEPCP=%%L"`。
2. **`!VAR!` 需要 `setlocal enabledelayedexpansion`**，否则原样传到命令行；
   反之 `%VAR%` 在 `( )` 块内会在解析时就展开。两种写法别混用。
3. **`call :sub && set X=1` 的坑**：`if 条件 call :sub && set ...` 里条件为假时 `if` 本身
   返回 0，`&&` 后的语句**仍会执行**。要写成 `( call :sub \n if errorlevel 1 set ... )`。

### 13.5 数据库自检

主控会查 `springboot_test.article` 是否有数据；缺失时用 `choice` 询问（15 秒默认 Y），
同意后调用 `恢复数据.bat`（幂等）。这样「开机后库被清空」不再需要人工先跑恢复脚本。

### 13.6 沙盒里跑不起来/被回收时的替代验证法

沙盒内 `agent-browser` 守护进程会卡住，可用已下载的 Chrome 直接截图验证 UI：

```bash
"/c/Users/Administrator/.agent-browser/browsers/chrome-157.0.8103.38/chrome.exe" \
  --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=1440,3000 --virtual-time-budget=15000 \
  --screenshot="C:/tmp/home.png" "http://localhost:5173/"
```

登录态怎么造：`POST /api/auth/login` 拿 token → 在 `aurora-vue-2/public/` 放一个临时
`__seed.html`（写 `localStorage.setItem('aurora_token', token)` 后 `location.replace('/')`），
截完图记得删掉，别提交。


补充：Chrome 的 `--window-size` 有最小窗口宽度，窄屏（如 390）会被裁切而不是重新布局。
要看真实移动端，用 CDP 覆盖视口：

```js
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
```

（`chrome --headless --remote-debugging-port=9333` 起进程，再用 Node 内置 WebSocket 走 CDP，
Node 18+ 无需装 puppeteer。）

---

## 十四、2026-11-04 首页改版（结构重排）

### 14.1 问题定位

对照截图（1440×900）确认，问题不在配色而在结构：首屏上方约 40% 是空白、13 篇文章同一规格平铺、
除第一张卡外全无封面、数据条 4 张玻璃卡纯占位、分类两行 chips 噪音、侧栏「今日星语」是随机文案、
HomePage 自带 footer 与 SiteFooter 重复渲染。

### 14.2 改动

| 位置 | 改动 |
|---|---|
| `components/HomePage.vue` | 模板与样式重写；脚本逻辑（检索/分页/无限滚动/收藏/跨页筛选）**原样保留** |
| `components/PickCard.vue` | 新增：带封面的精选卡，`lead` 变体用作首屏头条 |
| `components/ArticleRow.vue` | 新增：紧凑列表行（小封面 + 标题 + 元信息 + 浏览数） |
| `utils/cover.js` | 新增：按文章 id 轮转 `public/covers/*.jpg`，三个卡片组件共用 |
| `ArticleCard.vue` | **未改动**（发现页 / 收藏页继续用它，零回归风险） |

新结构：Hero 左文案右头条 → 内联指标条 → 单行分类 tab（选中后展开二级标签）→ 精选三列 + 列表行 →
侧栏（热门榜单 / 分类分布 / 继续探索 + 随便逛逛）。删掉「今日星语」与页面自带 footer。

### 14.3 几个判断规则（改的时候别踩）

- `showPicks = !hasFilter && list.length > 3`：搜索/筛选结果里每条命中项地位相同，**不要**硬挑三条当精选。
- 精选取 `list.slice(0,3)`，列表行取 `slice(3)`；无限滚动追加的分页只进列表行。
- 头条取 `pool[0] || list[0]`：`pool` 是全站最热 50 条，比当前列表更稳。
- **类名别用 `.tabs` / `.tab`**：`style.css` 里给登录页 tabs 写过 `.tabs{background/padding}` 和 `.tab{flex:1}`，
  冲突会让首页分类按钮被均分撑满整行。本次改用 `.cat-tabs` / `.cat-tab`。

### 14.4 验证记录

- `npm run build` 65 modules 通过（改版前 59）
- CDP 实测三种状态：默认态（精选 3 + 列表 7 + 共 13 条）、点「前端」（精选隐藏、2 条、二级标签展开）、
  搜索「凡」+ 前端筛选（0 条、面包屑同时显示关键词与分类）
- 1440 / 1024 / 390 三个宽度：`document.scrollWidth == clientWidth == 390`，无横向溢出

### 14.5 已知未做

- `SiteNav` 在 ≤900px 直接 `display:none` 掉菜单，**移动端没有导航入口**（首页改版前就存在，本次未动）
- 首页「更新节奏」热力图没做：缺按日期的发布/浏览量数据，需要后端补统计接口

---

## 十五、2026-11-10 启动体系重写（.bat 只做壳，逻辑全在 PowerShell）

### 15.1 为什么要重写

「双击 启动后端.bat 没反应 / 一闪就退，登录页注册登录进不去首页」的排查结论：
**前端 5173 在跑，后端 8081 压根没启动**（`log/springboot-test.log` 无当日记录），
Vite 代理连不上 8081 返回 `500 + text/plain`，前端只能显示「请求失败，请稍后再试」，
看起来像地址写错，其实是后端没起来。

旧 .bat 的问题在于：所有逻辑（编码、CRLF、`%~dp0` 尾反斜杠、`!VAR!` 延迟展开、
`set /p` 截断、`start /d "%~dp0"` 引号转义）都写在批处理里，一旦出错窗口一闪就没了，
且没有任何日志可查。

### 15.2 新结构

```
ja5-main\
├─ 启动后端.bat / 启动前端.bat / 启动项目.bat / 停止项目.bat   ← 纯 ASCII 三行壳，只负责调用 ps1
├─ scripts\
│   ├─ start-backend.ps1    后端：定位 java → 清端口 → 依赖 classpath → 按需增量编译 → java -cp 直启
│   ├─ start-frontend.ps1   前端：定位 node → 清端口 → 缺依赖才 npm install → node vite.js
│   ├─ start-all.ps1        一键：环境检查 → 清端口 → 库自检 → 各开一个窗口 → 健康检查 → 开浏览器
│   └─ stop-all.ps1         按端口停 5173 / 8081（不按进程名杀，避免误杀）
└─ logs\                     每次启动一份 backend-*.log / frontend-*.log / start-all-*.log
```

- `.bat` 内容固定为：`powershell -NoProfile -ExecutionPolicy Bypass -NoLogo -File "%~dp0scripts\xxx.ps1"`
  **纯 ASCII + CRLF**，不写一个中文，从根上消灭编码坑
- `.ps1` 统一 **UTF-8 带 BOM + CRLF**（PS 5.1 读无 BOM 的 UTF-8 中文会乱码，必须带 BOM）
- 失败时窗口不关，会打出 `[错误] xxx`，并把全过程写进 `logs\`

### 15.3 本机环境的新事实（2026-11-10 实测）

| 项 | 值 |
|---|---|
| 项目路径 | `C:\Users\duan\Desktop\jage\ja5-main`（13.1 写的 `D:\workSpace\ja5` 已过期） |
| JDK | **25.0.2**，真实路径 `D:\Program Files\Java\jdk-25.0.2`；另有 `C:\Program Files\Java\jdk-17` |
| `JAVA_HOME` | **未设置** |
| MySQL | **8.4**（`C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe`），root/123456 正常 |
| Node | `E:\node\node.exe`（v22.23.4，系统 PATH） |

**头号坑：PATH 里的 `java` 是 Oracle javapath 转发桩**
`C:\Program Files\Common Files\Oracle\Java\javapath\java.exe` —— cmd 里能正常跑，
但 **PowerShell 会把它当「文档」拒绝执行**，报 `CannotActivateDocumentInPipeline`。
所以 `start-backend.ps1` 里显式跳过 javapath，改为扫 `C:\/D:\Program Files\Java` 下的
真实 JDK 目录并按主版本号取最新（优先 JAVA_HOME）。

### 15.4 其它修正

- `恢复数据.bat` 里写死的 `MySQL Server 8.0` 路径 → 改成 `for /d` 通配匹配 `MySQL Server *`，
  8.0/8.4/9.x 都能找到（这是「启动项目.bat 一进来就报库未就绪」的原因之一）
- `启动项目.bat` 原来用 `start ... /d "%~dp0"`，`%~dp0` 结尾的反斜杠会和闭合引号粘连，
  可能直接「系统找不到指定的路径」→ 新方案改为在 ps1 里 `Start-Process -WorkingDirectory`，无此问题

### 15.5 AI 沙盒的限制（重要，别再试了）

- **cmd.exe 被完全拦截**：Bash 调 `cmd.exe` 直接报「Invoking cmd.exe from Bash bypasses all command validation」；
  PowerShell 工具调 `cmd /c` 报「cmd.exe cannot be used from the PowerShell tool」。所以 **.bat 无法在沙盒里验证**
- **PowerShell 工具无法执行任何原生程序**：`& 'C:\Windows\System32\whoami.exe'` 静默零输出、
  `$LASTEXITCODE` 为空（`java.exe`、`node.exe` 同理）。ps1 里的「启动进程」这一步只能由用户实测
- 能在沙盒里做的：`[System.Management.Automation.Language.Parser]::ParseFile()` 语法校验（推荐每次都跑）
- curl 打本地端口前必须去掉注入的代理：
  `env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy curl ...`（否则得到假 502）
- bash 里 `java ... &` 起的后端能活 1~5 分钟，之后被回收 → 只能用于冒烟，不能当常驻服务

### 15.6 冒烟记录（2026-11-10）

- 后端手工 `java -cp target/classes;target/classpath.txt` 起在 8081：登录 `verify用户/abc12345` 直连与经 5173 代理均 200
- 用真实验证码走 `/api/auth/register`：新建 userId=3 → 立即登录成功（测试账号已从库中删除）
- `mvnw.cmd -B -q -o -DskipTests compile`：BUILD SUCCESS（仅 JDK25 的 jansi/Unsafe 警告）
- `npm run build`：71 modules 通过（本次改了 `src/api/http.js`）
- 4 个 ps1：ParseFile 全部 OK，BOM 齐全；`.bat` 壳为纯 ASCII + CRLF

### 15.7 前端错误提示改进

`src/api/http.js` 新增 `OFFLINE_MSG`：fetch 直接 reject（后端没起）或拿到**非 JSON 的 5xx**
（后端有 GlobalExceptionHandler，正常出错必回 JSON，所以非 JSON 5xx 必是代理连不上）时，
提示「连不上后端服务，请确认后端已在 8081 端口启动（双击 启动项目.bat）」，
不再让用户去猜「是不是地址错了」。

### 15.8 二次修正：后台运行版（2026-11-10 18:06，以本节为准）

- 前后端改为 `Start-Process` **后台独立运行**，不再依赖两个黑窗口保持打开；启动成功后关闭窗口不会停止服务
- Java 禁用 devtools 自动重启（`-Dspring.devtools.restart.enabled=false`），避免开发期热重启造成状态误判
- 运行输出分别写入 `logs/backend-runtime-*`、`logs/frontend-runtime-*`；PID 写入 `run/*.pid`（已 gitignore）
- `启动项目.bat` 最后必须验证 **`http://127.0.0.1:5173/api/auth/captcha`**，即浏览器登录/注册真正走的链路，
  而不是只检查 8081 端口；通过后才打开浏览器
- Vite 代理目标固定为 **`http://127.0.0.1:8081`**，避免 Windows/Node 将 localhost 解析到 ::1 的兼容问题
- 实测：`localhost` / `127.0.0.1` / `192.168.1.5` 的 5173 页面与验证码接口均 200；
  `verify用户 / abc12345` 登录成功；真实验证码注册临时账号并立即登录成功（临时账号已删除）
- 前端默认勾选「记住我」，`App.vue` 在挂载时若发现 `localStorage.aurora_token`，会调用 `/auth/me`
  并直接进入首页。这是自动恢复登录，不是跳过认证；点导航栏「退出登录」或用无痕窗口即可看到登录/注册页。
- 后台运行版只明确打印一个推荐地址 **`http://localhost:5173/`**，这是有意为之；本机使用不需要 Network 地址。

---

## 十六、2026-11-17 序章页（进入小镇之前的开始页面）

### 16.1 这一屏是干什么的

原来的链路是「登录成功 → 直接落到樱花小镇地图」。现在中间加了一屏 **序章页**：

```
auth 登录 ──成功──> entry 序章页 ──「进入小镇」──> town 樱花小镇
            （带着 token 自动恢复登录也先到 entry）
```

- 视觉：一屏日系动画插画（新海诚式逆光 + 粉彩）—— 后山崖顶的千年樱，一个人倚着树根坐着休息，
  山下一角是小镇（坡屋顶小屋、喷泉广场、樱花行道树、湖与远山），缓慢推镜 + 花瓣吹雪
- 版式：**墨色字 + 白瓷玻璃片**（品牌 / 用户名 / 退出登录 / 左下铭牌都是玻璃片），
  文案落在右上方天空留白处，画面下半部（山下小镇 + 树下的人）整块不压任何东西
- 交互：`进入小镇` 按钮、`Enter` 键都能进门；点下去先叠一层暖光（ease-in 0.82s），
  780ms 后 emit `enter` 由 `App.vue` 切 `view = 'town'`
- **只做桌面端**（用户明确要求）：没有单独适配手机竖屏，窄窗口只是收窄 padding / 字号

### 16.2 文件

| 文件 | 说明 |
|---|---|
| `src/components/TownEntry.vue` | 新增，整屏序章页（自带花瓣 canvas，复用 `createPetalField`） |
| `src/App.vue` | 新增 `entry` 视图 + `goEntry()`；`onSuccess`/`onMounted` 改为先进 entry；`bareStage` 让 entry 与 town 都不叠全局天空/花瓣；`showFooter` 排除 entry |
| `public/town/entry-tree.jpg` | 主视觉 1536×912（≈420KB，已裁掉生成工具右下角水印） |
| `index.html` | 加 `<link rel="preload" as="image" href="/town/entry-tree.jpg">` |
| `ja5-main/art-source/` | 原始 PNG 未压缩版（v1/v2/v3 三版）；已 gitignore，不入库也不进 public |

### 16.3 踩坑（改这一屏必看）

1. **类名千万别叫 `.brand`**：`style.css` 里登录页的 `.brand` 有底色、`::before/::after` 光斑，
   序章页的 brand 会被整块涂成粉色方块。现已改名 `.entry__brand` / `.eb-mark` / `.eb-cn` / `.eb-en`。
2. **`body` 在登录态是 `display:grid; place-items:center`**：序章页只有绝对定位子元素，
   `width:100%` 在 grid 里会算成 0（第一版整屏空白就是这个）。已加 `min-width:100vw` 兜底。
3. **渐变文字（background-clip:text）不要继承 text-shadow**：父级 h1 的深色阴影会从透明字形里
   透出来，把整行染成灰的。`.entry__title em` 必须显式 `text-shadow: none`，投影用 `drop-shadow()`。
4. **亮图不能用「白字 + 暗角」那套**：现在的图是明亮粉彩，白字压不住、加暗角又把画毁掉。
   正确做法是墨色字（`#35263a`）+ 淡白光晕，控件统一白瓷玻璃片，只做加法调色（补暖光、樱花色柔边）。
5. **文案要避开太阳**：图里右上方有很强的逆光，字压在光斑上会发虚。文案定位在 `left:45% / top:34%`，
   正好落在云与湖面之间的中调区域；再叠一层 `radial-gradient` 白纱（0.6）给它垫底。
6. **闪白要用 ease-in**：`cubic-bezier(.55,0,.85,.35)`，前半段几乎看不出、最后 200ms 才亮满。
7. **推镜是 `animation`**：出门时要先 `animation: none` 再给 `transform`，否则 `transition` 不生效。

### 16.4 主视觉三代

| 版本 | 内容 | 问题 |
|---|---|---|
| v1 | 正面全景千年樱（树干居中、花冠满铺） | 写实 3D 味太重，跟小镇的粉彩不搭 |
| v2 | 低机位仰视、枝桠横跨成拱、石台旅人 | 电影感强但偏暗，白字+暗角方案与站内气质相反 |
| **v3（现用）** | 日系动画风：后山崖顶千年樱 + 倚树休息的人 + 山下小镇一角 | 与 2.5D 小镇是同一套语言，过渡自然 |

三版都是 1536×1024 生成 → 裁掉底部 110px（去「AI 生成」水印）→ JPG q89/q90。

### 16.5 验证记录

- `vite build` 93 modules 通过
- 真实 App 打桩 `/api/auth/me`：带 token 进站 → entry → 点按钮 → `town` 渲染、`entry` 卸载、
  全局 `#petals` 不重复挂载；`document.scrollWidth == clientWidth`
- 1440×900 / 1600×900 截图核对排版与对比度

---

## 十七、2026-11-17 地图扩建 + 学校/车站 + 建筑辨识度重做

### 17.1 地图：17×17 → 21×21

只改了两个常量，现有坐标一个都没动：

```
G   = 17 → 21                                  // 网格数（新增的两翼就是新街区）
VBX/VBY/VBW/VBH = -215 / 112 / 1440 / 812      // 取景框跟着放大，长宽比基本不变
```

- `ip()` 的原点、`HW/HH` 都没变，所以**老建筑自动留在原位**，岛往前（屏幕左下/右下方）长出去，
  多出来的地正好放学校和车站
- 岛的生长是「往前」而不是「四周」，小镇主体偏岛的后半部，前场成了新街区 —— 视觉上是「镇子往湖边扩了一块」
- **小溪要手动延长**：`STREAM_PTS` 原来终止在 gy=17 的旧岛边，不改的话水会停在草地上。
  现在补到 `[6.3,19.2] → [6.9,21.0]`，瀑布位置同步改成 `ip(6.9, 21.0)`

### 17.2 新增两栋建筑（都能点，都有独立页面）

| 建筑 | 坐标 (x,y,w,d,h) | 入口 | 页面 |
|---|---|---|---|
| 樱花学校 | 17.0 / 4.2 / 3.1 / 2.2 / 88 | 地图名牌 / 校门 | `SchoolPage.vue`（黑板课程表 + 图书角 + 点名册） |
| 樱花车站 | 11.0 / 16.3 / 3.6 / 1.9 / 66 | 地图名牌 / 月台 | `StationPage.vue`（发车牌 + 倒计时 + 时刻表 + 取车票） |

- `App.vue` 新增 `school` / `station` 两个视图，`SiteNav` **没加**这两个入口 —— 走地图进去才是小镇的味道
- 两个页面都用 `TownShell`，钱包条自动复用；**没有新增后端接口**：
  学校是「上课打卡 / 自习」写 localStorage，车站是纯前端算下一班车 + 生成一张车票，
  以后要接真实数据再补接口
- 车站的道具是独立 `scene` 项（不是在建筑里）：`track`（道床 + 枕木 + 双轨）和 `train`（车头 + 车厢），
  这样铁轨可以一直伸到岛边、电车可以停在月台外侧

### 17.3 建筑「不像」的根因和改法

原来所有楼都是同一个 `buildVenue()` 生成的盒子，只换了墙色、窗户行列和招牌 ——
**轮廓完全一样**，缩小后只能靠名牌认。这轮给每栋加了「只属于它」的特征件：

| 建筑 | 新增特征 |
|---|---|
| 书店 | 整面橱窗 + 三层书架（彩色书脊）+ 横臂吊牌（翻开的书）+ 门口一摞书 |
| 便利店 | 通高玻璃幕墙（竖框 + 货架影）+ 屋顶 24H 灯箱 + 门口 A 字招牌 |
| 健身房 | 玻璃幕墙 + **屋顶哑铃招牌**（两片配重 + 横杆，最远都能认出） |
| 家 | 门廊（双柱 + 小雨棚）+ 门廊灯 + 栅栏 + 窗台花箱 + 邮箱 + **烟囱冒烟** |
| 学校 | 通排教室大窗 + 正面挂钟 + **钟楼**（四面攒尖顶 + 小钟 + 顶尖球）+ 旗杆 + 校门门柱 |
| 车站 | 月台（抬高 8 + 黄线）+ 两根站名牌立柱 + 站钟 + 月台长椅 |

配套改动：
- `doorU` / `awningU`：门位与雨棚位置可配（书店/便利店的门偏左，右侧整面留给橱窗）
- `labelLift`：名牌抬高量（学校有钟楼 → 82，车站有月台 → 34），不设就用默认 24/48
- 新增 `ellipsePath()`：屏幕坐标系里的椭圆，挂钟、配重片、烟团都用它

### 17.4 这轮踩的坑（很值钱）

1. **替换代码块时用文本 index 圈范围，把中间的「屋顶」代码一起删了**：
   我按 `if (v.key === 'station') {` 到 `if (extraRoof.length)...` 取区间，但屋顶那一大段
   （`const roofParts = []` 到 `if/else` 收尾）正好夹在两者之间 → 整段被替换掉，
   页面直接白屏，控制台报 `ReferenceError: roofParts is not defined`。
   **教训：取区间前先 `grep` 确认区间内没有别的完整代码段；出事就从 `git show HEAD:文件` 里捞回来**
2. **铁轨的 depth 不能按远端算**：`depth = gx1 + ty` 会让铁轨排在电车之上，把整列车盖住。
   贴地的东西（道床、轨道）应该给一个很小的 depth 先画，电车用自己车身的 depth
3. **攒尖顶的底边要贴「朝向镜头」的那条边**（`ty + 0.44`），贴后沿（`ty - 0.44`）会画成歪的楔子
4. **白丝/雨棚不能和屋顶同高**：两者都在 z≈44~50 时会糊成一大块紫色，压到 z34~38 才分得开

### 17.5 验证记录

- `vite build` 通过（模块数 93 → 96，多两个页面）
- 端到端（CDP 打桩 `/api/auth/me`）：登录 → 序章页 → 进小镇 → 点「樱花学校」→ 黑板页 →
  点导航「小镇」→ 点「樱花车站」→ 发车牌页，全部正常，无运行时异常
- 1440×900 逐块放大核对了六栋楼的造型、名牌位置、铁轨与电车的遮挡关系

---

## 十八、2026-11-17 咖啡馆 / 甜品屋 / 花店 + 地图分页

### 18.1 三间新店（商店街）

| 建筑 | 坐标 (x,y,w,d,h) | 特征件 |
|---|---|---|
| 咖啡馆 | 14.2 / 11.8 / 2.1 / 1.7 / 62 | 暖光大橱窗 + 窗里的咖啡杯 + 绿色圆牌吊招牌 + 门口小圆桌 |
| 甜品屋 | 17.2 / 12.4 / 2.1 / 1.7 / 58 | 玻璃甜点柜（一排小蛋糕）+ 高脚杯招牌 + 带伞小圆桌 |
| 花店 | 6.8 / 16.2 / 1.9 / 1.7 / 54 | 整面橱窗摆花 + 门口三只铁皮花桶 + 手画条纹雨棚 + 吊篮 |

- 三间店共用 **`ShopPage.vue`**（`shop-key` = cafe / sweet / flower）：价目卡 + 「来一份」生成小票 + 「和老板聊两句」
- 小票、闲聊次数都是纯前端（localStorage），**没接后端**，也不假扣金币 —— 卡片上直接写了「记账，不扣金币」
- 咖啡馆 / 甜品屋一开始放在 家 旁边，后来挪到右前方那片空地，让九栋房子在图上铺得更开

### 18.2 地图分页（方向键切换）

用户反馈「地图小、边缘空」，做成 **4 张可取景的地图**，`←` `→` 或左右圆形按钮 / 底部页签切换：

| 页 | 视野 | 出现的名牌 |
|---|---|---|
| 全景 | 整个小岛 | 全部 9 栋 |
| 本町 | 广场周边 | 书店 / 便利店 / 家 / 公园 |
| 商店街 | 右前方 | 健身房 / 咖啡馆 / 甜品屋 / 花店 |
| 学校·车站 | 右侧与站前 | 樱花学校 / 樱花车站 |

实现要点（`SakuraTown.vue`）：
- 切页 = **换 viewBox**（`vb` ref + `vbStr`），房子不搬家，所以名牌与点击热区自动跟着走
- `frameOf(keys)` 用建筑自身 bbox（含 `h + 58` 的头顶留白）算出取景框，再按 1.72 补比例；
  改建筑坐标不用手调取景框
- 换框有跳变 → `flipping` 状态让 svg 与名牌淡出 0.18s，中途换 `vb`，再淡入
- 名牌按 `pageKeys` 过滤：不在当前街区的建筑不出名牌（否则会被夹到画面边缘堆成一排）
- 键盘 `ArrowLeft / ArrowRight` 绑在 window 上，`onBeforeUnmount` 里解绑

### 18.3 顺带修的两处

1. **取景框收紧**：菱形岛的四个角全是空的，把 `VBX/VBY/VBW/VBH` 从 -215/112/1440/812 收到
   -96/196/1188/660，裁掉上方天空与前方崖底，房子整体大了约 18%（面板也放宽到 1600 / 高度 -104）
2. **名牌上下夹紧**：`spots` 里 `py` 原来只夹左右，收紧取景框后最上面那排名牌会被切掉 → 现在夹 `[58, stageH-26]`
3. **`v-html` 里的 svg 套不上 scoped 样式**：`ShopPage` 的店铺图标用 `v-html` 注入，
   `.sign svg {}` 匹配不到（scoped 属性加不到注入内容上），图标被压成 0×0 —— 改 `.sign :deep(svg)`

### 18.4 验证记录

- `vite build` 通过，模块数 96 → 97
- 分页：点页签 / 左右箭头 / 键盘 ←→ 三种方式都验证过，名牌随页切换（本町→书店/便利店/家/公园，
  商店街→健身房/咖啡馆/甜品屋/花店，学校·车站→樱花学校/樱花车站）
- 小店页：点「来一份」→ 小票正确（店名 / 单号 / 品项 / 18 币 / 时间 / 「未付款 · 记账」/ 店主语）
- 端到端：登录 → 序章 → 小镇 → 点「咖啡馆」名牌 → 咖啡馆页，无运行时异常

---

## 十九、2026-11-17 2.5D 室内剖视（点进建筑看里面）

### 19.1 是什么

点地图上的建筑进到页面后，**页面顶部会出现一张「拆开的房间」**：
和小镇同一套 2:1 斜轴投影，但只保留后方两面墙（朝向镜头的两面拆掉），
能看见地板、家具和墙上的东西，并带「客厅 / 卧室 / 收银台」这种区域小牌。

### 19.2 四个文件

| 文件 | 作用 |
|---|---|
| `src/components/iso/iso.js` | 投影与基础图元：`ip / P / poly / ep / box / slab / onWall / roomShell` |
| `src/components/iso/props.js` | 家具件库，36 个件（沙发、床、书架、收银台、跑步机、石灯、绘马架…） |
| `src/components/iso/scenes.js` | 七个场景的布置表 + `SCENE_OF` 映射 |
| `src/components/InteriorScene.vue` | 渲染器：外壳 → 墙件 → 家具（按 x+y 排序）→ 区域小牌 |

接入方式：`TownShell` 加了一个 `scene` 属性，各页面只写 `scene="gym"` 就行，
剖视图会自动出现在 HUD 和页面正文之间。

### 19.3 七个场景

| 页面 | scene | 内容 |
|---|---|---|
| 家 | `home` | 玄关（地垫/换鞋凳）· 客厅（沙发/茶几/地毯/电视墙）· 卧室（床/书桌/衣柜）· 后院（栅栏/花坛/秋千） |
| 书店 | `home_book` | 橱窗展示台 · 主厅四排书架 · 阅读角（桌/椅/落地灯） |
| 便利店 | `store` | 进门地垫 · 两组货架 + 双开门冷柜 · 收银台与收银机 |
| 学校 | `school` | 教室（黑板/讲台/六套课桌）· 图书室（书架/长桌）· 武道室（榻榻米/假人/器具架） |
| 健身房 | `gym` | 力量区（哑铃架/卧推凳/杠铃）· 有氧区（两台跑步机）· 休息角（饮水机/长椅） |
| 车站 | `station` | 两排候车长椅 · 两台售票机 · 时刻表 |
| 公园亭 | `gazebo` | 石桌石凳 · 许愿牌架 · 两盏石灯 |

### 19.4 加一件家具 / 一个场景怎么做

1. 在 `props.js` 里写一个 `(s) => parts[]` 的函数，登记到文件底部的 `DRAW` 表
2. 在 `scenes.js` 的对应场景 `props` 里写 `{ type: 'xxx', x: 1.2, y: 2.4, ... }`
3. 墙上的东西写到 `walls`（`windowWall / poster / blackboard` 三种，face 选 `left`/`right`）
4. 院子这类「只有地没有墙」的，写成 `extras` 里的 `{ kind: 'ground', ... }`

### 19.5 踩坑

1. **`<script setup>` 里不能有第二个 `props`**：我最初把家具列表的 computed 也叫 `props`，
   和 `defineProps` 的返回值撞名，构建直接报 `Identifier 'props' has already been declared` → 改名 `placed`
2. **家具必须按 x+y 排序**，否则后排的书架会盖住前排的桌子（渲染器里 `placed` 已排好）
3. **`onWall` 的坐标**：左墙（x=0）是「u 沿 y 走」，右墙（y=0）是「u 沿 x 走」，
   写海报时很容易记反，反了会贴到墙上但位置歪
4. 区域小牌的 z 要比家具高 30 左右，否则会压在沙发/工作台上

### 19.6 现状与后续

- 这一版是「能一眼认出来」的程度：每间房 6–12 件家具，靠区域小牌说清楚功能分区
- 还能继续加密度：窗帘、地毯纹样、墙上的钟、桌上的杯子、天花板的灯、
  以及「点家具有反馈」的交互（现在只有页面本身的交互）
- 验证：`vite build` 通过；真实链路 小镇 → 点「健身房」→ 页面顶部出现剖视图，无运行时异常

---

## 二十、2026-11-18 通用细节（屋顶 / 墙面 / 门前小院 / 地面）+ 属性与心情

### 20.1 屋顶：先分深浅，再挂小件

| 改动 | 做法 |
|---|---|
| 木檐口 | 朝向镜头的两条檐口各压一道 `#6f4a48` 木色带，屋顶有了「厚度」 |
| 浅紫描边 | 木条上再压 `#bb9fc0` 细线，深紫主色不发闷 |
| 天窗 | 平屋顶画在顶面，人字顶画在坡面上（沿坡面参数 t 取一小块，不能直接贴顶面） |
| 小烟囱 | 只有平屋顶需要补，人字顶那段原来就有；烟囱帽 + 一缕烟 |
| 小天线 | 一根杆 + 两道横挑，商店 / 学校 / 车站 / 健身房有 |
| 落花 | 屋顶散 6 片樱瓣，平顶按顶面坐标、坡顶按坡面参数 |

开关放在 **`ROOF_KIT`** 表里（`SakuraTown.vue` 顶部），按 key 配 `chimney / skylight / antenna`。

### 20.2 墙面：窗户不能整面一样

`buildVenue` 里新增 `addWindow(fn, u0, u1, z0, z1)`，按 `winSeed++ % 4` 轮换四种样式：

1. **竖中梃**：中间一道细竖线
2. **窗台花箱**：窗台板 + 一盆小樱花（这家有人住）
3. **窗帘**：两侧米白帘 + 窗顶一根杆
4. **十字窗格**：竖中梃 + 横档

门的处理也补了：门框（两道竖边 + 门头）、黄铜门把手、门侧一根小扶手（`h >= 44` 才有）。

### 20.3 门前小院：`yardProps(v)`

每栋楼外面那一圈全部由 `yardProps(v)` 生成，返回一个 path 数组，接在 `deco` 后面：

```js
deco: deco.concat(yardProps(v))
```

**关键：按 (x+y) 从小到大排。** 斜轴投影里 x+y 越大越靠前，
不排序的话门口的花桶会被远处的小径盖住：

```js
const groups = []
const add = (cx, cy, parts) => groups.push({ k: cx + cy, parts })
// …每件东西 add() 一次…
groups.sort((a, b) => a.k - b.k)
```

每栋楼的东西：

| 建筑 | 院子里 |
|---|---|
| 家 | 木栅栏（7 根尖头木条 + 两道横档）· 小邮箱 · 花坛 · 迷你樱花树苗 · 户外小桌椅 · 晾衣绳三件小衣服 |
| 书店 | A 字立式招牌 · 落地玻璃展示柜（里面三本书）· 两摞书堆 · 门上一圈花环 |
| 便利店 | 门口防滑垫 · 户外冰柜（三瓶饮料）· 小推车 · 自动门感应器 · 两盆绿植 |
| 健身房 | 防滑垫 · 外墙深紫哑铃挂板 · 户外引体架（含吊环）· 绿植 |
| 学校 | 校门拱门（双柱 + 拱 + 匾）· 石质校碑 · 两侧四棵小圆樱 · 花坛 · 升旗台 |
| 咖啡馆 | 小黑板（写菜单）· 两盆绿植 · 窗下长花箱 |
| 甜品屋 | 甜品小推车 · 两盆花 |
| 花店 | 两层花架 · 小木牌 · 门口绿植 |
| 车站 | 月台两端的木花箱（画在 z=8 的月台面上） |

### 20.4 地面：不再是光秃秃草地

每栋楼都会有：**门前石板小径（4 块，交替左右偏）· 墙根碎石带 · 墙角青苔 · 零星小草（6 丛）· 落在地上的樱瓣（6 片）· 墙角灌木**。

坐标全部用地面格坐标，写起来跟摆家具一样：

```js
const pt = (t, side = 0) => (rightDoor ? [x1 + t, dcy + side] : [dcx + side, y1 + t])
```

`pt(t, side)` = 「从门口往外 t 格、横向偏 side 格」，右开门的楼（花店）自动换向。

### 20.5 属性系统：`src/composables/useStats.js`

七项：**体力 VIGOR / 力量 STRENGTH / 智力 WITS / 敏捷 AGILITY / 神秘 MYSTIC / 魅力 CHARM / 幸运 LUCK**，
各 0–99，每 10 点一级，存 localStorage（`sakura_stats_v1`）。

- 入口：`gain(key, n)`；批量：`gainMany({ wits: 2, vigor: 1 })`
- 提示：右下角浮出「智力 +2」，**同一属性连点会合并**（点三次显示 +6），最多三条
- 称号：跟着最高的那一项走（守樱人 / 镇上的书本虫 / 店门口的招牌 …）
- 面板：HUD 的「属性」按钮打开，七条分段进度条 + Lv + 称号 + 总成长

各行为给什么（同一个动作只加一次，避免刷）：

| 行为 | 属性 |
|---|---|
| 便利店打工 | 敏捷 +1、体力 +1 |
| 健身房训练 | 力量 +2、体力 +1 |
| 蛋白饮 | 体力 +1 |
| 回家睡觉 | 体力 +3 |
| 书店买书 | 智力 +1 |
| 公园长椅 | 魅力 +1、幸运 +1 |
| 小游戏 | 敏捷 +1 |
| 学校上课 | 智力 +2、体力 +1 |
| 学校自习 | 智力 +1 |
| 咖啡馆点单 | 魅力 +2 |
| 甜品屋点单 | 魅力 +2 |
| 花店点单 | 神秘 +1、魅力 +1 |
| 小店闲聊 | 魅力 +1 |
| 车站取票 | 敏捷 +1、幸运 +1 |

> 属性成长挂在 `useEconomy.js` 的 action 里（work / train / protein / sleep / buy / bench / drink / gameReward），
> 页面只要调 action 就自动涨；学校 / 小店 / 车站这些没走经济接口的，在各自页面里直接 `gain()`。

### 20.6 实时状态：财富 / 体力 / 心情

- **财富** = `wallet.money`（金币），**体力** = `wallet.energy / energyMax`，都在 HUD 上
- **心情** = `mood`（0–100），跟七项属性分开管理：
  - 打工 −6、训练 +6、蛋白饮 +2、睡觉 +14、长椅 +8、饮料 +5、买书 +3、小游戏 +4
  - 上课 +3、点单 +6~10、闲聊 +3、取票 +4
  - 每 90 秒往 60 靠一格（`startVitals()`，在 `startTicker()` 里顺带启动），放着不管会慢慢回落
  - 四档文案：雀跃 / 惬意 / 平静 / 有点闷 / 低落
- 三处展示：**HUD 第二条状态条**（粉色，随档位变色）、**小镇右上角钱包胶囊**、**小镇左侧属性速览**

### 20.7 这轮踩的坑

1. **Bash 里用 heredoc 跑 Python，脚本有时会被执行两次** —— 第一遍写好文件，第二遍断言失败，
   于是 `import` 和模板块各出现两份（页面直接报 `Identifier … has already been declared`，
   属性面板还会渲染两遍）。**改文件一律写成 .py 文件再执行**，别用 heredoc。
2. **`${…}` 写在 bash heredoc 里会被当参数展开**（报 `Bad substitution`），
   模板字符串进 Python 字符串时尤其容易中招，同上：写文件。
3. **`energyPercent` 从来没被解构**：`TownShell` 里 `const { wallet, refresh, startTicker } = useEconomy()`，
   但模板用了 `energyPercent`，HUD 的体力条宽度一直是空字符串。补上解构才修好。
4. **属性条的 `10 / 99` 看起来像空条**：加了十格刻度（`repeating-linear-gradient`），
   值小的时候也像「一格一格涨」而不是「坏了」。
5. **「力量 STRENGTH」把行挤成两行**：给名称列 `white-space: nowrap` + 加宽到 86px + EN 字号降到 7px。

### 20.8 验证记录

- `vite build` 通过（模块 96 → 105）
- 小镇四张地图逐页截图核对：屋顶木檐口/天窗/烟囱/落花、四种窗户、门前小院与地面细节都在
- 属性面板：7 行、称号、总成长正常；连点三次「来一份」提示合并为「魅力 +6 / 心情 +24」
- HUD：财富 128 · 体力 62/100 · 心情 94/100，三条状态各自独立

---

## 二十、2026-11-18 通用细节（屋顶 / 墙面 / 门前小院 / 地面）+ 属性与心情

### 20.1 屋顶：先分深浅，再挂小件

| 改动 | 做法 |
|---|---|
| 木檐口 | 朝向镜头的两条檐口各压一道 `#6f4a48` 木色带，屋顶有了「厚度」 |
| 浅紫描边 | 木条上再压 `#bb9fc0` 细线，深紫主色不发闷 |
| 天窗 | 平屋顶画在顶面，人字顶画在坡面上（沿坡面参数 t 取一小块，不能直接贴顶面） |
| 小烟囱 | 只有平屋顶需要补，人字顶那段原来就有；烟囱帽 + 一缕烟 |
| 小天线 | 一根杆 + 两道横挑，商店 / 学校 / 车站 / 健身房有 |
| 落花 | 屋顶散 6 片樱瓣，平顶按顶面坐标、坡顶按坡面参数 |

开关放在 **`ROOF_KIT`** 表里（`SakuraTown.vue` 顶部），按 key 配 `chimney / skylight / antenna`。

### 20.2 墙面：窗户不能整面一样

`buildVenue` 里新增 `addWindow(fn, u0, u1, z0, z1)`，按 `winSeed++ % 4` 轮换四种样式：

1. **竖中梃**：中间一道细竖线
2. **窗台花箱**：窗台板 + 一盆小樱花（这家有人住）
3. **窗帘**：两侧米白帘 + 窗顶一根杆
4. **十字窗格**：竖中梃 + 横档

门的处理也补了：门框（两道竖边 + 门头）、黄铜门把手、门侧一根小扶手（`h >= 44` 才有）。

### 20.3 门前小院：`yardProps(v)`

每栋楼外面那一圈全部由 `yardProps(v)` 生成，返回一个 path 数组，接在 `deco` 后面：

```js
deco: deco.concat(yardProps(v))
```

**关键：按 (x+y) 从小到大排。** 斜轴投影里 x+y 越大越靠前，
不排序的话门口的花桶会被远处的小径盖住：

```js
const groups = []
const add = (cx, cy, parts) => groups.push({ k: cx + cy, parts })
// …每件东西 add() 一次…
groups.sort((a, b) => a.k - b.k)
```

每栋楼的东西：

| 建筑 | 院子里 |
|---|---|
| 家 | 木栅栏（7 根尖头木条 + 两道横档）· 小邮箱 · 花坛 · 迷你樱花树苗 · 户外小桌椅 · 晾衣绳三件小衣服 |
| 书店 | A 字立式招牌 · 落地玻璃展示柜（里面三本书）· 两摞书堆 · 门上一圈花环 |
| 便利店 | 门口防滑垫 · 户外冰柜（三瓶饮料）· 小推车 · 自动门感应器 · 两盆绿植 |
| 健身房 | 防滑垫 · 外墙深紫哑铃挂板 · 户外引体架（含吊环）· 绿植 |
| 学校 | 校门拱门（双柱 + 拱 + 匾）· 石质校碑 · 两侧四棵小圆樱 · 花坛 · 升旗台 |
| 咖啡馆 | 小黑板（写菜单）· 两盆绿植 · 窗下长花箱 |
| 甜品屋 | 甜品小推车 · 两盆花 |
| 花店 | 两层花架 · 小木牌 · 门口绿植 |
| 车站 | 月台两端的木花箱（画在 z=8 的月台面上） |

### 20.4 地面：不再是光秃秃草地

每栋楼都会有：**门前石板小径（4 块，交替左右偏）· 墙根碎石带 · 墙角青苔 · 零星小草（6 丛）· 落在地上的樱瓣（6 片）· 墙角灌木**。

坐标全部用地面格坐标，写起来跟摆家具一样：

```js
const pt = (t, side = 0) => (rightDoor ? [x1 + t, dcy + side] : [dcx + side, y1 + t])
```

`pt(t, side)` = 「从门口往外 t 格、横向偏 side 格」，右开门的楼（花店）自动换向。

### 20.5 属性系统：`src/composables/useStats.js`

七项：**体力 VIGOR / 力量 STRENGTH / 智力 WITS / 敏捷 AGILITY / 神秘 MYSTIC / 魅力 CHARM / 幸运 LUCK**，
各 0–99，每 10 点一级，存 localStorage（`sakura_stats_v1`）。

- 入口：`gain(key, n)`；批量：`gainMany({ wits: 2, vigor: 1 })`
- 提示：右下角浮出「智力 +2」，**同一属性连点会合并**（点三次显示 +6），最多三条
- 称号：跟着最高的那一项走（守樱人 / 镇上的书本虫 / 店门口的招牌 …）
- 面板：HUD 的「属性」按钮打开，七条分段进度条 + Lv + 称号 + 总成长

各行为给什么（同一个动作只加一次，避免刷）：

| 行为 | 属性 |
|---|---|
| 便利店打工 | 敏捷 +1、体力 +1 |
| 健身房训练 | 力量 +2、体力 +1 |
| 蛋白饮 | 体力 +1 |
| 回家睡觉 | 体力 +3 |
| 书店买书 | 智力 +1 |
| 公园长椅 | 魅力 +1、幸运 +1 |
| 小游戏 | 敏捷 +1 |
| 学校上课 | 智力 +2、体力 +1 |
| 学校自习 | 智力 +1 |
| 咖啡馆点单 | 魅力 +2 |
| 甜品屋点单 | 魅力 +2 |
| 花店点单 | 神秘 +1、魅力 +1 |
| 小店闲聊 | 魅力 +1 |
| 车站取票 | 敏捷 +1、幸运 +1 |

> 属性成长挂在 `useEconomy.js` 的 action 里（work / train / protein / sleep / buy / bench / drink / gameReward），
> 页面只要调 action 就自动涨；学校 / 小店 / 车站这些没走经济接口的，在各自页面里直接 `gain()`。

### 20.6 实时状态：财富 / 体力 / 心情

- **财富** = `wallet.money`（金币），**体力** = `wallet.energy / energyMax`，都在 HUD 上
- **心情** = `mood`（0–100），跟七项属性分开管理：
  - 打工 −6、训练 +6、蛋白饮 +2、睡觉 +14、长椅 +8、饮料 +5、买书 +3、小游戏 +4
  - 上课 +3、点单 +6~10、闲聊 +3、取票 +4
  - 每 90 秒往 60 靠一格（`startVitals()`，在 `startTicker()` 里顺带启动），放着不管会慢慢回落
  - 四档文案：雀跃 / 惬意 / 平静 / 有点闷 / 低落
- 三处展示：**HUD 第二条状态条**（粉色，随档位变色）、**小镇右上角钱包胶囊**、**小镇左侧属性速览**

### 20.7 这轮踩的坑

1. **Bash 里用 heredoc 跑 Python，脚本有时会被执行两次** —— 第一遍写好文件，第二遍断言失败，
   于是 `import` 和模板块各出现两份（页面直接报 `Identifier … has already been declared`，
   属性面板还会渲染两遍）。**改文件一律写成 .py 文件再执行**，别用 heredoc。
2. **`${…}` 写在 bash heredoc 里会被当参数展开**（报 `Bad substitution`），
   模板字符串进 Python 字符串时尤其容易中招，同上：写文件。
3. **`energyPercent` 从来没被解构**：`TownShell` 里 `const { wallet, refresh, startTicker } = useEconomy()`，
   但模板用了 `energyPercent`，HUD 的体力条宽度一直是空字符串。补上解构才修好。
4. **属性条的 `10 / 99` 看起来像空条**：加了十格刻度（`repeating-linear-gradient`），
   值小的时候也像「一格一格涨」而不是「坏了」。
5. **「力量 STRENGTH」把行挤成两行**：给名称列 `white-space: nowrap` + 加宽到 86px + EN 字号降到 7px。

### 20.8 验证记录

- `vite build` 通过（模块 96 → 105）
- 小镇四张地图逐页截图核对：屋顶木檐口/天窗/烟囱/落花、四种窗户、门前小院与地面细节都在
- 属性面板：7 行、称号、总成长正常；连点三次「来一份」提示合并为「魅力 +6 / 心情 +24」
- HUD：财富 128 · 体力 62/100 · 心情 94/100，三条状态各自独立

---

## 二十一、2026-11-18 属性面板两态：日常 / 探索战斗

### 21.1 为什么分两套

在镇上过日子只需要知道「我累不累、力气够不够、今天想不想读书」，
敏捷 / 神秘 / 幸运这些要到出门探索、进战斗才用得上。
所以面板做成两种形态，同一个面板里切，不用跳页。

| 形态 | 显示 | 头部右侧 |
|---|---|---|
| 日常 DAILY | 体力 / 力量 / 智力 / 魅力（`DAILY_KEYS`） | 总成长 |
| 探索战斗 ADVENTURE | 七项全开 + 一层「战斗换算」 | 战力 |

切换状态存 `localStorage.sakura_panel_mode`，下次打开还记得。

### 21.2 代码在哪

`src/composables/useStats.js`：

```js
export const DAILY_KEYS = ['vigor', 'strength', 'wits', 'charm']
export const panelMode = ref('daily')          // 存 localStorage
export function setPanelMode(key)              // 只认 daily / battle
export const visibleStats = computed(...)      // 面板与小镇速览都用它
export const hiddenStats  = computed(...)      // 日常模式那句提示用
export const power   = computed(...)           // 七项加权
export const combat  = computed(...)           // 换算表
```

**要改「日常留哪几项」，只改 `DAILY_KEYS` 一处**，面板、小镇速览、提示文案会一起变。

`TownShell.vue` 里的面板结构：

```
称号 / 总成长（战斗态显示战力）
[日常 | 探索战斗]      ← segmented control
属性行（v-for="s in visibleStats"）
战斗换算（v-if panelMode === 'battle'）／提示（v-else）
```

### 21.3 战斗换算是怎么折的

每个数都能追到某一项属性，不是凭空调的：

| 数值 | 公式 | 来源 |
|---|---|---|
| 生命 HP | `40 + 体力×4` | 体力 |
| 攻击 ATK | `力量×1.6 + 体力×0.4` | 力量为主 |
| 防御 DEF | `体力×1.1 + 力量×0.5` | 体力 + 力量 |
| 闪避 EVA | `敏捷×1.2 %` | 敏捷 |
| 暴击 CRIT | `4 + 幸运×0.6 %` | 幸运 |
| 灵视 SIGHT | `神秘×1.5` | 神秘 |
| 鼓舞 RALLY | `魅力×1.3` | 魅力 |

七项属性正好各管一个战斗数值，加新属性时记得同步加一行，否则面板会出现「有属性没换算」。

### 21.4 踩的坑：`.stats` 又被全局样式吃了

面板根类名一开始叫 `.stats`，结果 `style.css` 里有一份落地页的：

```css
.stats { display: flex; gap: 26px; margin-top: 34px; }
.stats div b { color: #fff; }        /* ← 面板里的标题全变白，看不见 */
.stats div span { color: rgba(255,235,244,.62); }
```

于是「日常 / 探索战斗」两个按钮的文字直接消失（白底白字）。
**改成 `.stpanel` 就好了**，内部 `.stats__*` 不受影响（类名是整词匹配，`stats__mode` ≠ `stats`）。

这已经是第三次栽在同一类坑里了（前两次：`.brand`、`.tabs`）。
**给新组件起类名前，先 `grep` 一遍 `src/style.css`。**

### 21.5 验证记录

- `vite build` 通过（105 模块）
- 日常态：4 行（体力/力量/智力/魅力）+ 一句「敏捷 · 神秘 · 幸运 先收起来了」
- 战斗态：7 行 + 战斗换算 7 格（生命 80 / 攻击 20 / 防御 16 / 闪避 12% / 暴击 8% / 灵视 9 / 鼓舞 36），战力 95
- 切换后刷新页面仍是上次的形态（`localStorage.sakura_panel_mode`）
- 面板高度按 1440×900 调到 760px，战斗态一屏放得下；更矮的窗口内部滚动

---

## 二十一、2026-11-18 属性面板两态：日常 / 探索战斗

### 21.1 为什么分两套

在镇上过日子只需要知道「我累不累、力气够不够、今天想不想读书」，
敏捷 / 神秘 / 幸运这些要到出门探索、进战斗才用得上。
所以面板做成两种形态，同一个面板里切，不用跳页。

| 形态 | 显示 | 头部右侧 |
|---|---|---|
| 日常 DAILY | 体力 / 力量 / 智力 / 魅力（`DAILY_KEYS`） | 总成长 |
| 探索战斗 ADVENTURE | 七项全开 + 一层「战斗换算」 | 战力 |

切换状态存 `localStorage.sakura_panel_mode`，下次打开还记得。

### 21.2 代码在哪

`src/composables/useStats.js`：

```js
export const DAILY_KEYS = ['vigor', 'strength', 'wits', 'charm']
export const panelMode = ref('daily')          // 存 localStorage
export function setPanelMode(key)              // 只认 daily / battle
export const visibleStats = computed(...)      // 面板与小镇速览都用它
export const hiddenStats  = computed(...)      // 日常模式那句提示用
export const power   = computed(...)           // 七项加权
export const combat  = computed(...)           // 换算表
```

**要改「日常留哪几项」，只改 `DAILY_KEYS` 一处**，面板、小镇速览、提示文案会一起变。

`TownShell.vue` 里的面板结构：

```
称号 / 总成长（战斗态显示战力）
[日常 | 探索战斗]      ← segmented control
属性行（v-for="s in visibleStats"）
战斗换算（v-if panelMode === 'battle'）／提示（v-else）
```

### 21.3 战斗换算是怎么折的

每个数都能追到某一项属性，不是凭空调的：

| 数值 | 公式 | 来源 |
|---|---|---|
| 生命 HP | `40 + 体力×4` | 体力 |
| 攻击 ATK | `力量×1.6 + 体力×0.4` | 力量为主 |
| 防御 DEF | `体力×1.1 + 力量×0.5` | 体力 + 力量 |
| 闪避 EVA | `敏捷×1.2 %` | 敏捷 |
| 暴击 CRIT | `4 + 幸运×0.6 %` | 幸运 |
| 灵视 SIGHT | `神秘×1.5` | 神秘 |
| 鼓舞 RALLY | `魅力×1.3` | 魅力 |

七项属性正好各管一个战斗数值，加新属性时记得同步加一行，否则面板会出现「有属性没换算」。

### 21.4 踩的坑：`.stats` 又被全局样式吃了

面板根类名一开始叫 `.stats`，结果 `style.css` 里有一份落地页的：

```css
.stats { display: flex; gap: 26px; margin-top: 34px; }
.stats div b { color: #fff; }        /* ← 面板里的标题全变白，看不见 */
.stats div span { color: rgba(255,235,244,.62); }
```

于是「日常 / 探索战斗」两个按钮的文字直接消失（白底白字）。
**改成 `.stpanel` 就好了**，内部 `.stats__*` 不受影响（类名是整词匹配，`stats__mode` ≠ `stats`）。

这已经是第三次栽在同一类坑里了（前两次：`.brand`、`.tabs`）。
**给新组件起类名前，先 `grep` 一遍 `src/style.css`。**

### 21.5 验证记录

- `vite build` 通过（105 模块）
- 日常态：4 行（体力/力量/智力/魅力）+ 一句「敏捷 · 神秘 · 幸运 先收起来了」
- 战斗态：7 行 + 战斗换算 7 格（生命 80 / 攻击 20 / 防御 16 / 闪避 12% / 暴击 8% / 灵视 9 / 鼓舞 36），战力 95
- 切换后刷新页面仍是上次的形态（`localStorage.sakura_panel_mode`）
- 面板高度按 1440×900 调到 760px，战斗态一屏放得下；更矮的窗口内部滚动

---

## 二十二、2026-11-18 后山 + 樱之异境（自由开放副本）

### 22.1 两套世界怎么分开

```
小镇（日常）   auth → entry → town → 九栋楼 / 后山
                                      │
                                      └─ 走近千年樱 → 花瓣漩涡 → 樱之异境（战斗）
                                                                    │
                                          ← 归乡樱瓣 / 被打败 ←──────┘
```

- **小镇日常**：休闲、建筑、庭院、散步，不出现怪物，属性面板默认「日常」形态（只四项）
- **樱之异境**：进门自动 `setPanelMode('battle')`，七维全开；回合制战斗、宝箱、密道、BOSS
- 唯一入口是后山巨樱，靠近才触发提示，玩家自己决定进不进

### 22.2 后山 `BackHill.vue`

- 整屏 SVG 场景：草坡小岛 + 碎石小路（`pathPts` 折线生成路面与石子）+ 石灯 + 长椅 + 五棵小树
- 千年樱：树干/枝桠/三层叠色树冠/毛边花簇/垂枝，全部在 `<g class="giant" transform="translate(150,42)">` 里，
  **移位只改这一个 transform**，不用重算每个坐标
- 小人：`me` 是一个 `{x,y}`，靠 CSS `transition: transform 1.7s` 自己走过去（不用 rAF）
- 走近 → 等 1.7s → 雾浮起来（`.hill__mist.on`）→ 弹出提示卡（原文照设定写）
- 确认 → 30 片花瓣的漩涡（`--a/--r/--d/--t` 四个 CSS 变量）+ 中心白光扩散，1.85s 后 `emit('enter-realm')`

### 22.3 异境 `Dungeon.vue`：自由开放，不是线性闯关

**一张大地图，四个区域，顺序不限**：

| 区域 | 定位 | 怪 | 区域机制 | 练什么 |
|---|---|---|---|---|
| 樱雾漫林 | 初级 | 樱花木傀儡 · 幼年樱雾精灵 | 记忆花瓣剧情碎片 | 力量 / 神秘 / 敏捷 |
| 浮樱镜湖 | 中级 | 花瓣蜂群 · 湖影幻妖 | **魅力 ≥14 可交涉跳过战斗** · 智力 14 开宝箱 · 幸运 10 触发微光 | 智力 / 魅力 / 幸运 |
| 古樱根域 | 高阶 | 青苔石魔 · 根须守卫 | **智力 18 开密道** · 幸运 12 撞隐藏根室 | 力量 / 体力 |
| 灵樱神域 | BOSS | 樱影护卫 ×2 · 樱之守护灵 | **不要求通关前三个区域**，实力够就能来 | 全属性 |

- 顶栏常驻**七维属性条**（体力/力量/智力/敏捷/神秘/魅力/幸运），进门自动切战斗面板形态
- **归乡樱瓣**常驻右上角：随时回后山，不惩罚、不扣东西（只在离开时把花瓣折算成神秘）
- 战斗：斩（攻击+暴击）/ 凝神（下一击必暴，限 2 次）/ 交涉（仅镜湖，魅力够时出现）/ 退开
- 伤害公式：`攻击 ×(0.85~1.15) − 敌防×0.5`，暴击 ×1.7；敌方同理，闪避按 `敏捷×1.2%` 判定
- 通关：BOSS 倒下 → 写 `localStorage.sakura_hollow_cleared` → 后山多一层特效 + 徽标「樱心已静」

### 22.4 新增文件与App接线

| 文件 | 说明 |
|---|---|
| `src/components/BackHill.vue` | 后山整屏场景 + 走近提示 + 花瓣漩涡 |
| `src/components/Dungeon.vue` | 异境四区域 / 战斗 / 宝箱 / 密道 / 通关 |
| `src/App.vue` | 新增 `backhill` / `dungeon` 视图、`goRealm()`、`onExitRealm()`；`bareStage` 与 `showFooter` 排除这两屏 |
| `src/components/SiteNav.vue` | 菜单加「后山」 |
| `src/components/SakuraTown.vue` | 小镇面板加「上后山」按钮 |

### 22.5 这轮踩的坑

1. **Bash heredoc 跑 Python 会被执行两次**（这轮第 N 次）：第一遍写好文件，第二遍断言失败 / 重复插入，
   于是 `const lakeFarTrees`、`const blessPetals`、`blessed`、`bossCleared` 各出现两份，构建直接
   `Identifier ... has already been declared`。**改文件一律写 .py 文件再执行**。
2. **模板里用到、脚本里没声明**：`sheet` 漏了 `const sheet = ref(null)`，
   一开宝箱/事件就 `ReferenceError: sheet is not defined`，整页白。
   以后加弹窗先确认 ref 声明。
3. **`toast.ok` 不存在**：composable 只有 `success / error / info`，写错会抛异常。
4. **`preserveAspectRatio="meet"` 会让场景缩在中间留黑边**，异境要 `slice` 才铺满。
5. **SVG 图标是描边路径，不能当填充画**：`<g fill>` 里放 `M...L...` 的描边路径 = 一片空白，
   必须 `fill="none" :stroke="..."`。
6. **暗色区域（根域）的标签要反色**：给 `<svg>` 绑 `:class="`is-${region}`"`，
   `.is-roots .enc__label` 换成浅色描边，否则深紫底上根本看不见。

### 22.6 验证记录

- `vite build` 通过（模块 105 → 107）
- 端到端（打桩 `/api/auth/me`）：登录 → 序章 → 小镇 → 上后山 → 走近 → 提示 → 漩涡 → 异境，
  四个区域逐个切换、镜湖开战、神域点 BOSS（190 血）、退开、归乡，全部无运行时异常
- 把属性调高后打通 BOSS：出现「HOLLOW CLEARED」结算 → 回到后山，徽标与树下浮花都在
- 1440×900 逐屏截图核对：后山构图、四区域配色、战斗面板、通关弹窗

---

## 二十二、2026-11-18 后山 + 樱之异境（自由开放副本）

### 22.1 两套世界怎么分开

```
小镇（日常）   auth → entry → town → 九栋楼 / 后山
                                      │
                                      └─ 走近千年樱 → 花瓣漩涡 → 樱之异境（战斗）
                                                                    │
                                          ← 归乡樱瓣 / 被打败 ←──────┘
```

- **小镇日常**：休闲、建筑、庭院、散步，不出现怪物，属性面板默认「日常」形态（只四项）
- **樱之异境**：进门自动 `setPanelMode('battle')`，七维全开；回合制战斗、宝箱、密道、BOSS
- 唯一入口是后山巨樱，靠近才触发提示，玩家自己决定进不进

### 22.2 后山 `BackHill.vue`

- 整屏 SVG 场景：草坡小岛 + 碎石小路（`pathPts` 折线生成路面与石子）+ 石灯 + 长椅 + 五棵小树
- 千年樱：树干/枝桠/三层叠色树冠/毛边花簇/垂枝，全部在 `<g class="giant" transform="translate(150,42)">` 里，
  **移位只改这一个 transform**，不用重算每个坐标
- 小人：`me` 是一个 `{x,y}`，靠 CSS `transition: transform 1.7s` 自己走过去（不用 rAF）
- 走近 → 等 1.7s → 雾浮起来（`.hill__mist.on`）→ 弹出提示卡（原文照设定写）
- 确认 → 30 片花瓣的漩涡（`--a/--r/--d/--t` 四个 CSS 变量）+ 中心白光扩散，1.85s 后 `emit('enter-realm')`

### 22.3 异境 `Dungeon.vue`：自由开放，不是线性闯关

**一张大地图，四个区域，顺序不限**：

| 区域 | 定位 | 怪 | 区域机制 | 练什么 |
|---|---|---|---|---|
| 樱雾漫林 | 初级 | 樱花木傀儡 · 幼年樱雾精灵 | 记忆花瓣剧情碎片 | 力量 / 神秘 / 敏捷 |
| 浮樱镜湖 | 中级 | 花瓣蜂群 · 湖影幻妖 | **魅力 ≥14 可交涉跳过战斗** · 智力 14 开宝箱 · 幸运 10 触发微光 | 智力 / 魅力 / 幸运 |
| 古樱根域 | 高阶 | 青苔石魔 · 根须守卫 | **智力 18 开密道** · 幸运 12 撞隐藏根室 | 力量 / 体力 |
| 灵樱神域 | BOSS | 樱影护卫 ×2 · 樱之守护灵 | **不要求通关前三个区域**，实力够就能来 | 全属性 |

- 顶栏常驻**七维属性条**（体力/力量/智力/敏捷/神秘/魅力/幸运），进门自动切战斗面板形态
- **归乡樱瓣**常驻右上角：随时回后山，不惩罚、不扣东西（只在离开时把花瓣折算成神秘）
- 战斗：斩（攻击+暴击）/ 凝神（下一击必暴，限 2 次）/ 交涉（仅镜湖，魅力够时出现）/ 退开
- 伤害公式：`攻击 ×(0.85~1.15) − 敌防×0.5`，暴击 ×1.7；敌方同理，闪避按 `敏捷×1.2%` 判定
- 通关：BOSS 倒下 → 写 `localStorage.sakura_hollow_cleared` → 后山多一层特效 + 徽标「樱心已静」

### 22.4 新增文件与App接线

| 文件 | 说明 |
|---|---|
| `src/components/BackHill.vue` | 后山整屏场景 + 走近提示 + 花瓣漩涡 |
| `src/components/Dungeon.vue` | 异境四区域 / 战斗 / 宝箱 / 密道 / 通关 |
| `src/App.vue` | 新增 `backhill` / `dungeon` 视图、`goRealm()`、`onExitRealm()`；`bareStage` 与 `showFooter` 排除这两屏 |
| `src/components/SiteNav.vue` | 菜单加「后山」 |
| `src/components/SakuraTown.vue` | 小镇面板加「上后山」按钮 |

### 22.5 这轮踩的坑

1. **Bash heredoc 跑 Python 会被执行两次**（这轮第 N 次）：第一遍写好文件，第二遍断言失败 / 重复插入，
   于是 `const lakeFarTrees`、`const blessPetals`、`blessed`、`bossCleared` 各出现两份，构建直接
   `Identifier ... has already been declared`。**改文件一律写 .py 文件再执行**。
2. **模板里用到、脚本里没声明**：`sheet` 漏了 `const sheet = ref(null)`，
   一开宝箱/事件就 `ReferenceError: sheet is not defined`，整页白。
   以后加弹窗先确认 ref 声明。
3. **`toast.ok` 不存在**：composable 只有 `success / error / info`，写错会抛异常。
4. **`preserveAspectRatio="meet"` 会让场景缩在中间留黑边**，异境要 `slice` 才铺满。
5. **SVG 图标是描边路径，不能当填充画**：`<g fill>` 里放 `M...L...` 的描边路径 = 一片空白，
   必须 `fill="none" :stroke="..."`。
6. **暗色区域（根域）的标签要反色**：给 `<svg>` 绑 `:class="`is-${region}`"`，
   `.is-roots .enc__label` 换成浅色描边，否则深紫底上根本看不见。

### 22.6 验证记录

- `vite build` 通过（模块 105 → 107）
- 端到端（打桩 `/api/auth/me`）：登录 → 序章 → 小镇 → 上后山 → 走近 → 提示 → 漩涡 → 异境，
  四个区域逐个切换、镜湖开战、神域点 BOSS（190 血）、退开、归乡，全部无运行时异常
- 把属性调高后打通 BOSS：出现「HOLLOW CLEARED」结算 → 回到后山，徽标与树下浮花都在
- 1440×900 逐屏截图核对：后山构图、四区域配色、战斗面板、通关弹窗

---

## 二十三、2026-11-18 开始页画风统一（已按用户要求回退）（照片 -> 矢量插画）


> **状态：已回退。** 2026-11-18 02:35 按用户要求把开始页退回 AI 厚涂主视觉版（`entry-tree.jpg`）。
> 本章的矢量方案与几个坑（雾层压树干、屋顶叠深色发黑、毛边滤镜的颗粒悬空）仍然有效，
> 将来若再走矢量路线可以直接复用；代码在 `git show e6c254a` 里。

### 23.1 为什么要改

开始页原先是 AI 生成的厚涂插画（1536×914 的 JPG），而小镇地图和后山都是**矢量扁平 + 2:1 斜轴**，
两屏挨着看就是「一张画」接「一个网页」，风格断层。

现在开始页主视觉改成**内联 SVG**，和小镇、后山共用同一套语言：

| 元素 | 用的东西 |
|---|---|
| 天空 | `radialGradient` #fffbfd → #fdf0f6 → #eef1f9 → #dce7f6（与 BackHill 的 hillSky 同族） |
| 草坡 | `linearGradient` #d3e3bd → #bcd3a4 → #9dba88（与小镇 grassGrad 同族） |
| 远山 | #e9ecf7 / #e4ecdb 两层 + 雪线 |
| 湖 | #e4f1fa → #c9e0f1 → #aecbe4 + 白色反光条 |
| 房子 | 深紫屋顶 #7a6199 / #8a76a8、浅紫亮坡 #9d8ab8、粉白墙 #fbeade、暖窗 #ffe0a2 —— 和地图上的建筑同一组色 |
| 千年樱 | 五层叠色 + 噪声位移毛边（见 23.3） |

### 23.2 构图（1200×720 viewBox，`preserveAspectRatio="xMidYMid slice"`）

左近右远的斜向纵深，五层景深：

```
天空 + 云  ->  远山/雪线  ->  湖  ->  山脚小镇（八栋侧视小屋 + 两棵行道樱）
           ->  近景草坡（碎石小径 / 苔石 / 小樱 / 灌木）
           ->  坡顶台地上的千年樱 + 倚树休息的人
```

- 文案仍在右上，`left:46% / top:27%`，正好落在天空里，不压任何具体物件
- 房子、树、草、石全部数据驱动（`houses / townTrees / hillTrees / rocks / grass / pathStones / fallPetals`），
  改坐标只动 `LAYOUT` 之类的小数组
- 房子按 `baseY = 642 - (x - 566) * 0.05` 收，右侧更远也更矮，远景才有空气感

### 23.3 关键手法：树冠别用「椭圆堆」画

第一版用十几个大椭圆叠成一顶花冠，缩略看是**一朵粉色的云 / 一颗西兰花**。有效的改法是三层：

1. **背光层要露出来**：`#cf7097` 一组椭圆只在下缘与右侧露出 10–20px，树冠才有厚度
2. **加噪声位移滤镜**（`#eRuff`）：`feTurbulence baseFrequency=0.012 + feDisplacementMap scale=20`，
   把光滑的椭圆轮廓打碎成花团。
   - 频率别调高（0.032 会变成均匀小锯齿，像西兰花）
   - 位移别调小（<10 边缘还是圆的）
3. **枝干透出花丛**：在花冠之上再画 5 条 `#8a6152`、`opacity=.38` 的细枝，
   没有这几笔，一大片粉色永远是「云」不是「树」

其余小件：
- 花簇颗粒只放在轮廓附近，且要**向内收 13%**（`pull(x, y, 0.87)`）——
  毛边滤镜会让轮廓随机外扩，颗粒不收回就会变成一堆悬空的小球
- 支梢只从左右下缘伸出去，**头顶不要画**：花冠一毛糙，头顶的枝就成了两条「眉毛」
- 树干加 `#eBark`（位移 5）让轮廓不顺滑；树根要贴地横铺，别画成尖刺

### 23.4 踩的坑（都很隐蔽）

1. **雾层画在最后，把近景树干切成了两半**：`eHaze` 那条横向雾带原本放在 svg 末尾，
   树干正好穿过它，于是树干中部出现一道水平色变。雾是「远处的空气」，必须画在近景之前
2. **屋顶色叠太多层会变成黑尖帽**：`#6b5589` 主面 + 两道深色脊线，缩到远景就成了近黑的三角，
   现在改成中紫主面 + 浅紫亮坡 + 浅紫脊线
3. **`entry-tree.jpg` 的 preload 要一起删**：内联 SVG 不需要图片请求，留着只会 404
4. **`ready` 的触发方式要换**：原来是 `@load` 图片，SVG 没有 load 事件，改 `requestAnimationFrame`
5. **低垂花枝一开始从树干中段横伸出去**，缩略看是两只「牛角」；改成从花冠下缘垂下的细枝才自然

### 23.5 文件

| 文件 | 变化 |
|---|---|
| `src/components/TownEntry.vue` | 主视觉 img → 内联 SVG；新增约 200 行场景数据；`.entry__photo` → `.entry__art` |
| `ja5-main/aurora-vue-2/index.html` | 删掉 `entry-tree.jpg` 的 preload |
| `ja5-main/art-source/` | 旧的 AI 图归档为 `entry-tree-v3-ai.jpg`（已 gitignore） |
| `public/town/` | 清空（这一屏不再需要位图） |

### 23.6 验证

- `vite build` 通过（模块数不变，JS 体积 +2KB 左右，换掉了一张 420KB 的图）
- 1280×800 / 1440×900 / 1600×900 三种桌面尺寸截图核对，无横向溢出、无空边
- 端到端：进站 → 开始页 → 点「进入小镇」→ 暖光过渡 → 小镇渲染、entry 卸载

---

## 二十四、2026-11-20 建筑主题优化 + 室内剖视分小空间

### 24.1 外观：屋顶从「旧仓库紫」改成薰衣草紫

原来的 `ROOF_LIGHT #7f5a7c` / `ROOF_DARK #5c3d59` 发褐，压在白墙上是旧仓库的味道。
现在：

```
ROOF_LIGHT #8272a6   ROOF_DARK #61528b   ROOF_TOP #9a8cc0
```

另外给平顶加了 **6 道平行屋脊的瓦楞线**（人字顶 3 道沿坡），
半透明白 / 深紫交替，屋顶不再是一整块平色 —— 这一处比换色更提质感。

墙裙：踢脚从 6 抬到 11（按层高 9~13 自适应），并在上沿加一道细线，
立面终于有「上下两段」，不是一张纸。

### 24.2 室内：把「一个大开间」拆成连通小空间

原来每个场景都是 7~8 格的大单间，靠家具分区。现在用 **隔墙 + 门洞**真正切开：

| 场景 | 隔墙位置 | 切出的空间 |
|---|---|---|
| 家 | x = 4.6（y 0.3–4.4） | 客厅 ↔ 卧室（门洞 y 2.4） |
| 书店 | x = 5.3（y 0.4–5.9） | 主厅 ↔ 阁楼（门洞 y 1.55） |
| 便利店 | x = 2.35（y 0.35–3.6） | 收银区 ↔ 货架区（门洞 y 2.1） |
| 学校 | x = 4.35（y 0.35–5.6） | 教室 ↔ 图书室·武道室（门洞 y 3.9） |
| 健身房 | x = 3.95（y 0.35–5.0） | 力量区 ↔ 有氧·休息（门洞 y 3.6） |
| 车站 | x = 4.1（y 0.3–3.4） | 候车厅 ↔ 售票区（门洞 y 2.15） |
| 公园亭 | 无（`bare: true`） | 户外空间，只留台基 |

**关键实现**：隔墙不能整面扔进场景，否则家具会整片压在墙前/墙后穿帮。
`divider()` 把墙按 0.4 格切成小段，每段自带 `depth = at + u`，跟家具一起排序 ——
所以玄关的凳子会在墙前面、卧室的床会在墙后面，遮挡关系是对的。

### 24.3 五层渲染顺序

```
地板（含双向木纹）
  → 后墙 + 墙面光影 + 窗/挂画
  → 排序队列：隔墙分段 + 家具（按 x+y）
  → 前沿墙垛（永远在家具之前）
  → 前景（贴着镜头的花枝，压最上）
```

- **前沿墙垛**：`frontPiers()` 在剖切线两端各留 0.34 格宽的一段外墙（带墙芯断面 + 顶面），
  这就是用户要的「门口保留一小段外部轮廓边角」。注意**不能画整面**——
  试过画 y=d 的整面墙芯，投影后是一整张平行四边形，直接把室内挡死。
- **前景**：`scene.foreground` 不参与排序，永远画在最上层，用来压住画面下角做纵深。

### 24.4 新增家具（9 件）

`tvWall`（电视墙）、`floorLamp`（落地灯）、`deskLamp`（台灯）、
`bayWindow`（飘窗，带软垫和抱枕）、`coatHooks`（玄关挂钩板）、
`laundry`（晾衣架）、`punchingBag`（沙袋）、`towelRack`（毛巾架）、
`floorCushion`（懒人坐垫）。

这几件专门挑「能一眼认出房间功能」的：客厅有电视墙、卧室有飘窗、健身房有沙袋。

### 24.5 踩的坑

1. **剖切面不能画整面**：见 24.3。第一版把前沿墙芯整面画出来，室内全黑。
2. **`bash heredoc 跑 python` 会被执行两次**（这个坑第五次犯了）：
   这次导致 `pierParts` 声明两遍，构建报 `Identifier 'pierParts' has already been declared`。
   现在所有改造脚本都写成 `C:/tmp/xxx.py` 再执行，并在开头加幂等判断。
3. **隔墙和墙同色就等于没画**：`#efdae2` 贴在 `#f7e6ec` 上完全看不见，
   要压到 `#e6c9d5` 才有轮廓。
4. **`max-height` 相对视口**：剖视图设 74vh 时，在页面里（标题+钱包条之下）会被截断，
   改成 `min(58vh, 560px)` 才完整露出来。
5. **户外亭子不该有墙**：给 `room` 加 `bare: true`，`roomShell` 跳过墙体，`frontPiers` 直接返回空。

### 24.6 验证

- `vite build` 通过，模块数不变，JS +6KB
- 七个场景逐个截图核对（`_verify/iso2-*.jpg`）
- 端到端：进站 → 小镇 → 点「书店」→ 页面顶部出现剖视图，无运行时异常

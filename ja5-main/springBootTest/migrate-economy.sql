-- ============================================================
--  樱花小镇 · 金币经济系统迁移（可重复执行）
--  数据库：springboot_test
-- ------------------------------------------------------------
--  改动内容：
--    1. user   增加钱包与体力：money / energy / energy_max / energy_at / last_sleep_date
--    2. article 增加售价 price（0 表示免费试读本）
--    3. 新建 purchase（已购书目）与 coin_log（金币流水）两张表
--
--  规则约定：
--    · 金币只由服务端结算，前端传来的分数会被夹到合法区间，改不了收益
--    · 体力随时间自然恢复（ENERGY_REGEN_SECONDS 秒 1 点），打工 / 训练消耗
--    · 买书是一次性永久解锁，重复购买会被唯一索引挡住
-- ============================================================

CREATE DATABASE IF NOT EXISTS `springboot_test`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE `springboot_test`;

-- ------------------------------------------------------------
--  1. user.money —— 金币余额
-- ------------------------------------------------------------
SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'money');
SET @ddl := IF(@has = 0,
  'ALTER TABLE `user` ADD COLUMN `money` INT NOT NULL DEFAULT 120 COMMENT ''金币余额'' AFTER `permission`',
  'SELECT ''money 字段已存在，跳过'' AS info');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
--  2. user.energy —— 当前体力（便利店打工 / 健身房训练消耗）
-- ------------------------------------------------------------
SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'energy');
SET @ddl := IF(@has = 0,
  'ALTER TABLE `user` ADD COLUMN `energy` INT NOT NULL DEFAULT 60 COMMENT ''当前体力'' AFTER `money`',
  'SELECT ''energy 字段已存在，跳过'' AS info');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
--  3. user.energy_max —— 体力上限（健身房训练可以练高）
-- ------------------------------------------------------------
SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'energy_max');
SET @ddl := IF(@has = 0,
  'ALTER TABLE `user` ADD COLUMN `energy_max` INT NOT NULL DEFAULT 100 COMMENT ''体力上限'' AFTER `energy`',
  'SELECT ''energy_max 字段已存在，跳过'' AS info');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
--  4. user.energy_at —— 体力恢复的结算锚点（懒计算：读的时候补上这段时间的自然恢复）
-- ------------------------------------------------------------
SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'energy_at');
SET @ddl := IF(@has = 0,
  'ALTER TABLE `user` ADD COLUMN `energy_at` DATETIME NULL DEFAULT NULL COMMENT ''体力恢复结算时间'' AFTER `energy_max`',
  'SELECT ''energy_at 字段已存在，跳过'' AS info');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
--  5. user.last_sleep_date —— 上次睡觉的日期（每天只能回满一次）
-- ------------------------------------------------------------
SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'last_sleep_date');
SET @ddl := IF(@has = 0,
  'ALTER TABLE `user` ADD COLUMN `last_sleep_date` DATE NULL DEFAULT NULL COMMENT ''上次睡觉日期'' AFTER `energy_at`',
  'SELECT ''last_sleep_date 字段已存在，跳过'' AS info');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
--  6. article.price —— 书店售价（0 = 免费试读本）
-- ------------------------------------------------------------
SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'article' AND COLUMN_NAME = 'price');
SET @ddl := IF(@has = 0,
  'ALTER TABLE `article` ADD COLUMN `price` INT NOT NULL DEFAULT 20 COMMENT ''书店售价，0 为免费'' AFTER `views`',
  'SELECT ''price 字段已存在，跳过'' AS info');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
--  7. 已购书目
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `purchase` (
  `id`         BIGINT   NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT   NOT NULL COMMENT '买家',
  `article_id` BIGINT   NOT NULL COMMENT '书目',
  `price`      INT      NOT NULL DEFAULT 0 COMMENT '成交价快照（后续调价不影响历史）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_article` (`user_id`, `article_id`),
  KEY `idx_purchase_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='书店已购书目';

-- ------------------------------------------------------------
--  8. 金币流水（便利店工资、买书、训练、游戏奖励都记一笔）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `coin_log` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT       NOT NULL,
  `delta`      INT          NOT NULL COMMENT '正数入账，负数出账',
  `balance`    INT          NOT NULL COMMENT '这笔之后余额',
  `reason`     VARCHAR(32)  NOT NULL COMMENT 'book/store/gym/game/sleep',
  `detail`     VARCHAR(128) NULL COMMENT '可读说明',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_coin_user_time` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='金币流水';

-- ------------------------------------------------------------
--  9. 给已有书目定价（按分类，已购买过的不受影响）
--     小说 36 / 设计 26 / 技术类 20
-- ------------------------------------------------------------
UPDATE `article`
   SET `price` = CASE `category`
                   WHEN '小说' THEN 36
                   WHEN '设计' THEN 26
                   WHEN '前端' THEN 20
                   WHEN '后端' THEN 20
                   WHEN '数据库' THEN 20
                   WHEN '工程' THEN 20
                   ELSE 18
                 END
 WHERE `price` = 20 OR `price` IS NULL;

-- 三本免费试读本：让新来的旅人不花一分钱也能进店坐下
UPDATE `article` SET `price` = 0 WHERE `id` IN (1, 5, 16);

-- ------------------------------------------------------------
-- 10. 核对结果
-- ------------------------------------------------------------
SELECT (SELECT COUNT(*) FROM `article` WHERE `price` = 0)  AS `免费本数`,
       (SELECT COUNT(*) FROM `article` WHERE `price` > 0)  AS `售卖本数`,
       (SELECT MIN(`price`) FROM `article` WHERE `price` > 0) AS `最低价`,
       (SELECT MAX(`price`) FROM `article` WHERE `price` > 0) AS `最高价`;

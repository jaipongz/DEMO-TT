DROP TABLE IF EXISTS `demo_jp_test`;
CREATE TABLE `demo_jp_test` (
  `demo_jp_test_id` BIGINT,
  `title` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NULL,
  `age` INT NULL,
  `brand_color` VARCHAR(255) NULL,
  `published_date` VARCHAR(255) NULL,
  `published_at` VARCHAR(255) NULL,
  `category` VARCHAR(255) NOT NULL,
  `province` VARCHAR(255) NOT NULL,
  `article` VARCHAR(255) NULL,
  `home_banner_tags` VARCHAR(255) NULL,
  `status` VARCHAR(255) NULL,
  `flags` VARCHAR(255) NULL,
  `is_active` VARCHAR(255) NULL,
  `summary` MEDIUMTEXT NULL,
  `content` TEXT NULL,
  `content_plain` TEXT NULL,
  `thumbnail` VARCHAR(255) NULL,
  `thumbnail_gen` VARCHAR(10) NULL,
  `thumbnail_alt` VARCHAR(255) NULL,
  `intro_video` VARCHAR(255) NULL,
  `intro_video_gen` VARCHAR(10) NULL,
  `attachment` VARCHAR(255) NULL,
  `attachment_gen` VARCHAR(10) NULL,
  obj_lang VARCHAR(10) NOT NULL,
  obj_content_id BIGINT NOT NULL,
  obj_created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  obj_created_by INT NOT NULL,
  obj_published_date DATETIME  NULL DEFAULT NULL,
  obj_published_by INT DEFAULT NULL,
  
  PRIMARY KEY (demo_jp_test_id, obj_lang),
  INDEX idx_demo_jp_test_lang (obj_lang),
  INDEX idx_demo_jp_test_content (obj_content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `demo_jp_test_draft`;
CREATE TABLE `demo_jp_test_draft` (
  `demo_jp_test_id` BIGINT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NULL,
  `age` INT NULL,
  `brand_color` VARCHAR(255) NULL,
  `published_date` VARCHAR(255) NULL,
  `published_at` VARCHAR(255) NULL,
  `category` VARCHAR(255) NOT NULL,
  `province` VARCHAR(255) NOT NULL,
  `article` VARCHAR(255) NULL,
  `home_banner_tags` VARCHAR(255) NULL,
  `status` VARCHAR(255) NULL,
  `flags` VARCHAR(255) NULL,
  `is_active` VARCHAR(255) NULL,
  `summary` MEDIUMTEXT NULL,
  `content` TEXT NULL,
  `content_plain` TEXT NULL,
  `thumbnail` VARCHAR(255) NULL,
  `thumbnail_gen` VARCHAR(10) NULL,
  `thumbnail_alt` VARCHAR(255) NULL,
  `intro_video` VARCHAR(255) NULL,
  `intro_video_gen` VARCHAR(10) NULL,
  `attachment` VARCHAR(255) NULL,
  `attachment_gen` VARCHAR(10) NULL,
  obj_status VARCHAR(10) NOT NULL,
  obj_state VARCHAR(10) NOT NULL,
  obj_lang VARCHAR(10) NOT NULL,
  obj_rev INT NOT NULL,
  obj_content_id BIGINT NOT NULL,
  obj_created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  obj_created_by INT NOT NULL,
  obj_modified_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  obj_modified_by INT NOT NULL,
  obj_published_date DATETIME NULL DEFAULT NULL,
  obj_published_by INT DEFAULT NULL,

  PRIMARY KEY (demo_jp_test_id, obj_lang, obj_rev),
  INDEX idx_demo_jp_test_draft_status (obj_status),
  INDEX idx_demo_jp_test_draft_state (obj_state),
  INDEX idx_demo_jp_test_draft_lang (obj_lang),
  INDEX idx_demo_jp_test_draft_content (obj_content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `demo_jp_gallery`;
CREATE TABLE `demo_jp_gallery` (
    `demo_jp_gallery_id` BIGINT PRIMARY KEY,
    obj_parent_id BIGINT NOT NULL,
    obj_file VARCHAR(255) NOT NULL,
    obj_file_gen VARCHAR(10) NOT NULL,
    obj_priority INT NOT NULL DEFAULT 0,
    obj_lang VARCHAR(10) NOT NULL,
    obj_created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    obj_created_by INT NOT NULL,
    
    INDEX idx_demo_jp_gallery_parent (obj_parent_id),
    INDEX idx_demo_jp_gallery_priority (obj_priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `demo_jp_gallery_draft`;
CREATE TABLE `demo_jp_gallery_draft` (
    `demo_jp_gallery_id` BIGINT NOT NULL,
    obj_parent_id BIGINT NOT NULL,
    obj_file VARCHAR(255) NOT NULL,
    obj_file_gen VARCHAR(10) NOT NULL,
    obj_priority INT NOT NULL DEFAULT 0,
    obj_lang VARCHAR(10) NOT NULL,
    obj_rev INT NOT NULL,
    obj_created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    obj_created_by INT NOT NULL,

    PRIMARY KEY (demo_jp_gallery_id, obj_lang, obj_rev),
    INDEX idx_demo_jp_gallery_draft_parent (obj_parent_id),
    INDEX idx_demo_jp_gallery_draft_priority (obj_priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `korea_gallery`;
CREATE TABLE `korea_gallery` (
    `korea_gallery_id` BIGINT PRIMARY KEY,
    obj_parent_id BIGINT NOT NULL,
    obj_file VARCHAR(255) NOT NULL,
    obj_file_gen VARCHAR(10) NOT NULL,
    obj_priority INT NOT NULL DEFAULT 0,
    obj_lang VARCHAR(10) NOT NULL,
    obj_created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    obj_created_by INT NOT NULL,
    
    INDEX idx_korea_gallery_parent (obj_parent_id),
    INDEX idx_korea_gallery_priority (obj_priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `korea_gallery_draft`;
CREATE TABLE `korea_gallery_draft` (
    `korea_gallery_id` BIGINT NOT NULL,
    obj_parent_id BIGINT NOT NULL,
    obj_file VARCHAR(255) NOT NULL,
    obj_file_gen VARCHAR(10) NOT NULL,
    obj_priority INT NOT NULL DEFAULT 0,
    obj_lang VARCHAR(10) NOT NULL,
    obj_rev INT NOT NULL,
    obj_created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    obj_created_by INT NOT NULL,

    PRIMARY KEY (korea_gallery_id, obj_lang, obj_rev),
    INDEX idx_korea_gallery_draft_parent (obj_parent_id),
    INDEX idx_korea_gallery_draft_priority (obj_priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `demo_jp_child`;
CREATE TABLE `demo_jp_child` (
    `demo_jp_child_id` BIGINT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `file` VARCHAR(255) NULL,
  `file_gen` VARCHAR(10) NULL,
  `detail` TEXT NULL,
  `detail_plain` TEXT NULL,
  obj_parent_id BIGINT NOT NULL,
    obj_lang VARCHAR(10) NOT NULL,
    obj_content_id BIGINT NOT NULL,
    obj_created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    obj_created_by INT NOT NULL,
    obj_published_date DATETIME NULL DEFAULT NULL,
    obj_published_by INT DEFAULT NULL,

    INDEX idx_demo_jp_child_parent (obj_parent_id),
    INDEX idx_demo_jp_child_lang (obj_lang),
    INDEX idx_demo_jp_child_content (obj_content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `demo_jp_child_draft`;
CREATE TABLE `demo_jp_child_draft` (
    `demo_jp_child_id` BIGINT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `file` VARCHAR(255) NULL,
  `file_gen` VARCHAR(10) NULL,
  `detail` TEXT NULL,
  `detail_plain` TEXT NULL,
  obj_parent_id BIGINT NOT NULL,
    obj_status VARCHAR(10) NOT NULL,
    obj_state VARCHAR(10) NOT NULL,
    obj_lang VARCHAR(10) NOT NULL,
    obj_rev INT NOT NULL,
    obj_content_id BIGINT NOT NULL,
    obj_created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    obj_created_by INT NOT NULL,
    obj_modified_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    obj_modified_by INT NOT NULL,
    obj_published_date DATETIME NULL DEFAULT NULL,
    obj_published_by INT DEFAULT NULL,
    
    PRIMARY KEY (demo_jp_child_id, obj_lang, obj_rev),
    INDEX idx_demo_jp_child_draft_parent (obj_parent_id),
    INDEX idx_demo_jp_child_draft_status (obj_status),
    INDEX idx_demo_jp_child_draft_state (obj_state),
    INDEX idx_demo_jp_child_draft_lang (obj_lang),
    INDEX idx_demo_jp_child_draft_content (obj_content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Module permissions: demo_jp_test
DELETE rp
FROM `wcm_role_permissions` rp
INNER JOIN `wcm_permissions` p ON p.id = rp.permission_id
WHERE p.`module` = 'demo_jp_test';

DELETE FROM `wcm_permissions` WHERE `module` = 'demo_jp_test';
INSERT IGNORE INTO `wcm_permissions` (`name`, `description`, `module`, `module_name`, `action`) VALUES
('demo_jp_test.create', 'Can create demo_jp_test', 'demo_jp_test', 'Demo JP Test', 'create'),
('demo_jp_test.read', 'Can read demo_jp_test', 'demo_jp_test', 'Demo JP Test', 'read'),
('demo_jp_test.update', 'Can update demo_jp_test', 'demo_jp_test', 'Demo JP Test', 'update'),
('demo_jp_test.delete', 'Can delete demo_jp_test', 'demo_jp_test', 'Demo JP Test', 'delete'),
('demo_jp_test.export', 'Can export demo_jp_test', 'demo_jp_test', 'Demo JP Test', 'export'),
('demo_jp_test.publish', 'Can publish demo_jp_test', 'demo_jp_test', 'Demo JP Test', 'publish');

INSERT IGNORE INTO `wcm_role_permissions` (`role_id`, `permission_id`)
SELECT 1, p.id
FROM `wcm_permissions` p
WHERE p.name IN ('demo_jp_test.create', 'demo_jp_test.read', 'demo_jp_test.update', 'demo_jp_test.delete', 'demo_jp_test.export', 'demo_jp_test.publish');
DROP TABLE IF EXISTS `home_banner`;
CREATE TABLE `home_banner` (
  `home_banner_id` BIGINT,
  `title` VARCHAR(255) NOT NULL,
  `banner` VARCHAR(255) NULL,
  `banner_gen` VARCHAR(10) NULL,
  `banner_alt` VARCHAR(255) NULL,
  `banner_video` VARCHAR(255) NULL,
  `banner_video_gen` VARCHAR(10) NULL,
  `mode` VARCHAR(255) NOT NULL,
  obj_lang VARCHAR(10) NOT NULL,
  obj_content_id BIGINT NOT NULL,
  obj_created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  obj_created_by INT NOT NULL,
  obj_published_date DATETIME  NULL DEFAULT NULL,
  obj_published_by INT DEFAULT NULL,
  
  PRIMARY KEY (home_banner_id, obj_lang),
  INDEX idx_home_banner_lang (obj_lang),
  INDEX idx_home_banner_content (obj_content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `home_banner_draft`;
CREATE TABLE `home_banner_draft` (
  `home_banner_id` BIGINT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `banner` VARCHAR(255) NULL,
  `banner_gen` VARCHAR(10) NULL,
  `banner_alt` VARCHAR(255) NULL,
  `banner_video` VARCHAR(255) NULL,
  `banner_video_gen` VARCHAR(10) NULL,
  `mode` VARCHAR(255) NOT NULL,
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

  PRIMARY KEY (home_banner_id, obj_lang, obj_rev),
  INDEX idx_home_banner_draft_status (obj_status),
  INDEX idx_home_banner_draft_state (obj_state),
  INDEX idx_home_banner_draft_lang (obj_lang),
  INDEX idx_home_banner_draft_content (obj_content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `home_banner_gallery`;
CREATE TABLE `home_banner_gallery` (
    `home_banner_gallery_id` BIGINT PRIMARY KEY,
    obj_parent_id BIGINT NOT NULL,
    obj_file VARCHAR(255) NOT NULL,
    obj_file_gen VARCHAR(10) NOT NULL,
    obj_priority INT NOT NULL DEFAULT 0,
    obj_lang VARCHAR(10) NOT NULL,
    obj_created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    obj_created_by INT NOT NULL,
    
    INDEX idx_home_banner_gallery_parent (obj_parent_id),
    INDEX idx_home_banner_gallery_priority (obj_priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `home_banner_gallery_draft`;
CREATE TABLE `home_banner_gallery_draft` (
    `home_banner_gallery_id` BIGINT NOT NULL,
    obj_parent_id BIGINT NOT NULL,
    obj_file VARCHAR(255) NOT NULL,
    obj_file_gen VARCHAR(10) NOT NULL,
    obj_priority INT NOT NULL DEFAULT 0,
    obj_lang VARCHAR(10) NOT NULL,
    obj_rev INT NOT NULL,
    obj_created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    obj_created_by INT NOT NULL,

    PRIMARY KEY (home_banner_gallery_id, obj_lang, obj_rev),
    INDEX idx_home_banner_gallery_draft_parent (obj_parent_id),
    INDEX idx_home_banner_gallery_draft_priority (obj_priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `home_banner_detail`;
CREATE TABLE `home_banner_detail` (
    `home_banner_detail_id` BIGINT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `file` VARCHAR(255) NULL,
  `file_gen` VARCHAR(10) NULL,
  `description` TEXT NULL,
  `description_plain` TEXT NULL,
  obj_parent_id BIGINT NOT NULL,
    obj_lang VARCHAR(10) NOT NULL,
    obj_content_id BIGINT NOT NULL,
    obj_created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    obj_created_by INT NOT NULL,
    obj_published_date DATETIME NULL DEFAULT NULL,
    obj_published_by INT DEFAULT NULL,

    INDEX idx_home_banner_detail_parent (obj_parent_id),
    INDEX idx_home_banner_detail_lang (obj_lang),
    INDEX idx_home_banner_detail_content (obj_content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `home_banner_detail_draft`;
CREATE TABLE `home_banner_detail_draft` (
    `home_banner_detail_id` BIGINT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `file` VARCHAR(255) NULL,
  `file_gen` VARCHAR(10) NULL,
  `description` TEXT NULL,
  `description_plain` TEXT NULL,
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
    
    PRIMARY KEY (home_banner_detail_id, obj_lang, obj_rev),
    INDEX idx_home_banner_detail_draft_parent (obj_parent_id),
    INDEX idx_home_banner_detail_draft_status (obj_status),
    INDEX idx_home_banner_detail_draft_state (obj_state),
    INDEX idx_home_banner_detail_draft_lang (obj_lang),
    INDEX idx_home_banner_detail_draft_content (obj_content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Module permissions: home_banner
DELETE rp
FROM `wcm_role_permissions` rp
INNER JOIN `wcm_permissions` p ON p.id = rp.permission_id
WHERE p.`module` = 'home_banner';

DELETE FROM `wcm_permissions` WHERE `module` = 'home_banner';
INSERT IGNORE INTO `wcm_permissions` (`name`, `description`, `module`, `module_name`, `action`) VALUES
('home_banner.create', 'Can create home_banner', 'home_banner', 'Home Banner', 'create'),
('home_banner.read', 'Can read home_banner', 'home_banner', 'Home Banner', 'read'),
('home_banner.update', 'Can update home_banner', 'home_banner', 'Home Banner', 'update'),
('home_banner.delete', 'Can delete home_banner', 'home_banner', 'Home Banner', 'delete'),
('home_banner.export', 'Can export home_banner', 'home_banner', 'Home Banner', 'export'),
('home_banner.publish', 'Can publish home_banner', 'home_banner', 'Home Banner', 'publish');

INSERT IGNORE INTO `wcm_role_permissions` (`role_id`, `permission_id`)
SELECT 1, p.id
FROM `wcm_permissions` p
WHERE p.name IN ('home_banner.create', 'home_banner.read', 'home_banner.update', 'home_banner.delete', 'home_banner.export', 'home_banner.publish');
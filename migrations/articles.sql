DROP TABLE IF EXISTS `articles`;
CREATE TABLE `articles` (
  `articles_id` BIGINT,
  `thumbnail` VARCHAR(255) NOT NULL,
  `thumbnail_gen` VARCHAR(10) NOT NULL,
  `thumbnail_alt` VARCHAR(255) NULL,
  `video` VARCHAR(255) NULL,
  `video_gen` VARCHAR(10) NULL,
  `file` VARCHAR(255) NULL,
  `file_gen` VARCHAR(10) NULL,
  `title` VARCHAR(500) NOT NULL,
  `author` VARCHAR(255) NOT NULL,
  `date` VARCHAR(255) NOT NULL,
  `content` MEDIUMTEXT NOT NULL,
  `content-wysiwyg` TEXT NOT NULL,
  `content-wysiwyg_plain` TEXT NOT NULL,
  `brandColor` VARCHAR(255) NULL,
  obj_lang VARCHAR(10) NOT NULL,
  obj_content_id BIGINT NOT NULL,
  obj_created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  obj_created_by INT NOT NULL,
  obj_published_date DATETIME  NULL DEFAULT NULL,
  obj_published_by INT DEFAULT NULL,
  
  PRIMARY KEY (articles_id, obj_lang),
  INDEX idx_articles_lang (obj_lang),
  INDEX idx_articles_content (obj_content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `articles_draft`;
CREATE TABLE `articles_draft` (
  `articles_id` BIGINT NOT NULL,
  `thumbnail` VARCHAR(255) NOT NULL,
  `thumbnail_gen` VARCHAR(10) NOT NULL,
  `thumbnail_alt` VARCHAR(255) NULL,
  `video` VARCHAR(255) NULL,
  `video_gen` VARCHAR(10) NULL,
  `file` VARCHAR(255) NULL,
  `file_gen` VARCHAR(10) NULL,
  `title` VARCHAR(500) NOT NULL,
  `author` VARCHAR(255) NOT NULL,
  `date` VARCHAR(255) NOT NULL,
  `content` MEDIUMTEXT NOT NULL,
  `content-wysiwyg` TEXT NOT NULL,
  `content-wysiwyg_plain` TEXT NOT NULL,
  `brandColor` VARCHAR(255) NULL,
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

  PRIMARY KEY (articles_id, obj_lang, obj_rev),
  INDEX idx_articles_draft_status (obj_status),
  INDEX idx_articles_draft_state (obj_state),
  INDEX idx_articles_draft_lang (obj_lang),
  INDEX idx_articles_draft_content (obj_content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `articles_gallery`;
CREATE TABLE `articles_gallery` (
    `articles_gallery_id` BIGINT PRIMARY KEY,
    obj_parent_id BIGINT NOT NULL,
    obj_file VARCHAR(255) NOT NULL,
    obj_file_gen VARCHAR(10) NOT NULL,
    obj_priority INT NOT NULL DEFAULT 0,
    obj_lang VARCHAR(10) NOT NULL,
    obj_created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    obj_created_by INT NOT NULL,
    
    INDEX idx_articles_gallery_parent (obj_parent_id),
    INDEX idx_articles_gallery_priority (obj_priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `articles_gallery_draft`;
CREATE TABLE `articles_gallery_draft` (
    `articles_gallery_id` BIGINT NOT NULL,
    obj_parent_id BIGINT NOT NULL,
    obj_file VARCHAR(255) NOT NULL,
    obj_file_gen VARCHAR(10) NOT NULL,
    obj_priority INT NOT NULL DEFAULT 0,
    obj_lang VARCHAR(10) NOT NULL,
    obj_rev INT NOT NULL,
    obj_created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    obj_created_by INT NOT NULL,

    PRIMARY KEY (articles_gallery_id, obj_lang, obj_rev),
    INDEX idx_articles_gallery_draft_parent (obj_parent_id),
    INDEX idx_articles_gallery_draft_priority (obj_priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `articles_detail`;
CREATE TABLE `articles_detail` (
    `articles_detail_id` BIGINT PRIMARY KEY,
  `file` VARCHAR(255) NULL,
  `file_gen` VARCHAR(10) NULL,
  `description` VARCHAR(255) NULL,
  obj_parent_id BIGINT NOT NULL,
    obj_lang VARCHAR(10) NOT NULL,
    obj_content_id BIGINT NOT NULL,
    obj_created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    obj_created_by INT NOT NULL,
    obj_published_date DATETIME NULL DEFAULT NULL,
    obj_published_by INT DEFAULT NULL,

    INDEX idx_articles_detail_parent (obj_parent_id),
    INDEX idx_articles_detail_lang (obj_lang),
    INDEX idx_articles_detail_content (obj_content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `articles_detail_draft`;
CREATE TABLE `articles_detail_draft` (
    `articles_detail_id` BIGINT NOT NULL,
  `file` VARCHAR(255) NULL,
  `file_gen` VARCHAR(10) NULL,
  `description` VARCHAR(255) NULL,
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
    
    PRIMARY KEY (articles_detail_id, obj_lang, obj_rev),
    INDEX idx_articles_detail_draft_parent (obj_parent_id),
    INDEX idx_articles_detail_draft_status (obj_status),
    INDEX idx_articles_detail_draft_state (obj_state),
    INDEX idx_articles_detail_draft_lang (obj_lang),
    INDEX idx_articles_detail_draft_content (obj_content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Module permissions: articles
DELETE rp
FROM `wcm_role_permissions` rp
INNER JOIN `wcm_permissions` p ON p.id = rp.permission_id
WHERE p.`module` = 'articles';

DELETE FROM `wcm_permissions` WHERE `module` = 'articles';
INSERT IGNORE INTO `wcm_permissions` (`name`, `description`, `module`, `module_name`, `action`) VALUES
('articles.create', 'Can create articles', 'articles', 'Articles', 'create'),
('articles.read', 'Can read articles', 'articles', 'Articles', 'read'),
('articles.update', 'Can update articles', 'articles', 'Articles', 'update'),
('articles.delete', 'Can delete articles', 'articles', 'Articles', 'delete'),
('articles.export', 'Can export articles', 'articles', 'Articles', 'export'),
('articles.publish', 'Can publish articles', 'articles', 'Articles', 'publish');

INSERT IGNORE INTO `wcm_role_permissions` (`role_id`, `permission_id`)
SELECT 1, p.id
FROM `wcm_permissions` p
WHERE p.name IN ('articles.create', 'articles.read', 'articles.update', 'articles.delete', 'articles.export', 'articles.publish');
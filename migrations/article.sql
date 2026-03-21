DROP TABLE IF EXISTS `article`;
CREATE TABLE `article` (
  `article_id` BIGINT,
  `title` VARCHAR(255) NOT NULL,
  `short_description` MEDIUMTEXT NULL,
  `thumbnail` VARCHAR(255) NULL,
  `thumbnail_gen` VARCHAR(10) NULL,
  `thumbnail_alt` VARCHAR(255) NULL,
  obj_lang VARCHAR(10) NOT NULL,
  obj_content_id BIGINT NOT NULL,
  obj_created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  obj_created_by INT NOT NULL,
  obj_published_date DATETIME  NULL DEFAULT NULL,
  obj_published_by INT DEFAULT NULL,
  
  PRIMARY KEY (article_id, obj_lang),
  INDEX idx_article_lang (obj_lang),
  INDEX idx_article_content (obj_content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `article_draft`;
CREATE TABLE `article_draft` (
  `article_id` BIGINT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `short_description` MEDIUMTEXT NULL,
  `thumbnail` VARCHAR(255) NULL,
  `thumbnail_gen` VARCHAR(10) NULL,
  `thumbnail_alt` VARCHAR(255) NULL,
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

  PRIMARY KEY (article_id, obj_lang, obj_rev),
  INDEX idx_article_draft_status (obj_status),
  INDEX idx_article_draft_state (obj_state),
  INDEX idx_article_draft_lang (obj_lang),
  INDEX idx_article_draft_content (obj_content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Module permissions: article
DELETE rp
FROM `wcm_role_permissions` rp
INNER JOIN `wcm_permissions` p ON p.id = rp.permission_id
WHERE p.`module` = 'article';

DELETE FROM `wcm_permissions` WHERE `module` = 'article';
INSERT IGNORE INTO `wcm_permissions` (`name`, `description`, `module`, `module_name`, `action`) VALUES
('article.create', 'Can create article', 'article', 'Article', 'create'),
('article.read', 'Can read article', 'article', 'Article', 'read'),
('article.update', 'Can update article', 'article', 'Article', 'update'),
('article.delete', 'Can delete article', 'article', 'Article', 'delete'),
('article.export', 'Can export article', 'article', 'Article', 'export'),
('article.publish', 'Can publish article', 'article', 'Article', 'publish');

INSERT IGNORE INTO `wcm_role_permissions` (`role_id`, `permission_id`)
SELECT 1, p.id
FROM `wcm_permissions` p
WHERE p.name IN ('article.create', 'article.read', 'article.update', 'article.delete', 'article.export', 'article.publish');
-- Create tables
DROP TABLE IF EXISTS `wcm_user_roles`;
DROP TABLE IF EXISTS `wcm_role_permissions`;
DROP TABLE IF EXISTS `wcm_user_permissions`;
DROP TABLE IF EXISTS `wcm_permissions`;
DROP TABLE IF EXISTS `wcm_roles`;
DROP TABLE IF EXISTS `wcm_users`;

CREATE TABLE IF NOT EXISTS `wcm_users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `firstname` VARCHAR(120) NOT NULL DEFAULT '',
  `lastname` VARCHAR(120) NOT NULL DEFAULT '',
  `name` VARCHAR(255) NOT NULL,
  `timezone` VARCHAR(100) NOT NULL DEFAULT 'Asia/Bangkok',
  `password` VARCHAR(255) NOT NULL,
  `isActive` BOOLEAN DEFAULT true,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wcm_roles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wcm_permissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `module` VARCHAR(100) NOT NULL,
  `module_name` VARCHAR(150) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wcm_user_roles` (
  `user_id` INT UNSIGNED NOT NULL,
  `role_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`user_id`, `role_id`),
  FOREIGN KEY (`user_id`) REFERENCES `wcm_users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`role_id`) REFERENCES `wcm_roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wcm_role_permissions` (
  `role_id` INT UNSIGNED NOT NULL,
  `permission_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  FOREIGN KEY (`role_id`) REFERENCES `wcm_roles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `wcm_permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wcm_user_permissions` (
  `user_id` INT UNSIGNED NOT NULL,
  `permission_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`user_id`, `permission_id`),
  FOREIGN KEY (`user_id`) REFERENCES `wcm_users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `wcm_permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Sample Permissions
INSERT INTO `wcm_permissions` (`name`, `description`, `module`, `module_name`, `action`) VALUES
('user.create', 'Can create users', 'user', 'CMS User', 'create'),
('user.read', 'Can read users', 'user', 'CMS User', 'read'),
('user.update', 'Can update users', 'user', 'CMS User', 'update'),
('user.delete', 'Can delete users', 'user', 'CMS User', 'delete'),
('role.create', 'Can create roles', 'role', 'Role', 'create'),
('role.read', 'Can read roles', 'role', 'Role', 'read'),
('role.update', 'Can update roles', 'role', 'Role', 'update'),
('role.delete', 'Can delete roles', 'role', 'Role', 'delete');

-- Insert Sample Roles
INSERT INTO `wcm_roles` (`name`, `description`) VALUES
('Admin', 'Administrator with full access');

-- Assign Permissions to Admin (all permissions)
INSERT INTO `wcm_role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4),
(1, 5), (1, 6), (1, 7), (1, 8);

-- Insert Sample Users
-- Password: P@ssw0rd123 (hashed with bcrypt round 10)
INSERT INTO `wcm_users` (`email`, `firstname`, `lastname`, `name`, `timezone`, `password`, `isActive`) VALUES
('admin@jaipongz.com', 'Admin', 'User', 'Admin User', 'Asia/Bangkok', '$2b$10$42SQK5PxGkWSczuEfhVIgexs2EY.Rujzk7DDW14xk/6evrOQjhKmS', true);

-- Assign Roles to Users
INSERT INTO `wcm_user_roles` (`user_id`, `role_id`) VALUES
(1, 1);
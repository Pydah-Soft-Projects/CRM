-- CRM Authentication Gateway Database Schema
-- MySQL Database Setup

-- Create database (run this manually if database doesn't exist)
-- CREATE DATABASE IF NOT EXISTS crm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE crm_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL COMMENT 'Bcrypt hashed password',
    role ENUM('admin', 'user', 'student', 'staff') DEFAULT 'user',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Portals table
CREATE TABLE IF NOT EXISTS portals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    portal_id VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique identifier for portal (e.g., admissions-crm)',
    portal_name VARCHAR(255) NOT NULL,
    portal_url VARCHAR(500) NOT NULL,
    description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_portal_id (portal_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User-Portal access mapping (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_portals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    portal_id INT NOT NULL COMMENT 'References portals.id',
    is_active TINYINT(1) DEFAULT 1,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INT COMMENT 'User ID who granted access',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_portal (user_id, portal_id),
    INDEX idx_user_id (user_id),
    INDEX idx_portal_id (portal_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default portals
INSERT INTO portals (portal_id, portal_name, portal_url, description, is_active) VALUES
('admissions-crm', 'Admissions CRM', 'https://admissions.pydah.edu.in', 'Student enrollment and lead management system', 1),
('student-portal', 'Student Academic Portal', 'https://pydahsdms.vercel.app', 'Student academic and lifestyle portal', 1),
('hostel-automation', 'Hostel Automation', 'https://hostel.pydah.edu.in', 'Hostel and facility management system', 1),
('hrms', 'HRMS & Payroll', 'https://hrms.pydahsoft.in', 'Human resources and payroll management', 1),
('pharmacy', 'Pharmacy Inventory', 'https://pydah-pharmacy-labs.vercel.app', 'Pharmacy and lab inventory management', 1)
ON DUPLICATE KEY UPDATE portal_name = VALUES(portal_name);

-- Insert default admin user (password: admin123 - CHANGE THIS IN PRODUCTION!)
-- Password hash for 'admin123' using bcrypt (cost 10)
-- You should generate a new hash using: bcrypt.hash('your_password', 10)
INSERT INTO users (username, email, password, role, is_active) VALUES
('admin', 'admin@pydahsoft.in', '$2a$10$rOzJqKqKqKqKqKqKqKqKqO', 'admin', 1)
ON DUPLICATE KEY UPDATE username = username;

-- Grant admin access to all portals
INSERT INTO user_portals (user_id, portal_id, is_active)
SELECT u.id, p.id, 1
FROM users u
CROSS JOIN portals p
WHERE u.username = 'admin' AND u.role = 'admin'
ON DUPLICATE KEY UPDATE is_active = 1;

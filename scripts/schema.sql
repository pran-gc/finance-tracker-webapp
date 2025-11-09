-- Finance Tracker Database Schema
-- Run this script to set up the database tables

-- Users table to store Google OAuth user information
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  picture TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_google_id (google_id),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table for secure session management
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Currencies table
CREATE TABLE IF NOT EXISTS currencies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories table (global categories shared by all users)
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_is_active (is_active),
  UNIQUE KEY unique_category (name, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- App settings table (per-user settings)
CREATE TABLE IF NOT EXISTS app_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  default_currency_id INT NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  last_backup_time TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (default_currency_id) REFERENCES currencies(id) ON DELETE RESTRICT,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transactions table (per-user transactions)
CREATE TABLE IF NOT EXISTS transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  category_id INT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_user_id (user_id),
  INDEX idx_category_id (category_id),
  INDEX idx_transaction_date (transaction_date),
  INDEX idx_type (type),
  INDEX idx_user_date (user_id, transaction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default currencies
INSERT IGNORE INTO currencies (code, name, symbol, is_active) VALUES
  ('USD', 'US Dollar', '$', TRUE),
  ('EUR', 'Euro', '€', TRUE),
  ('GBP', 'British Pound', '£', TRUE),
  ('JPY', 'Japanese Yen', '¥', TRUE),
  ('CAD', 'Canadian Dollar', 'C$', TRUE),
  ('AUD', 'Australian Dollar', 'A$', TRUE),
  ('CHF', 'Swiss Franc', 'CHF', TRUE),
  ('CNY', 'Chinese Yuan', '¥', TRUE),
  ('INR', 'Indian Rupee', '₹', TRUE),
  ('MUR', 'Mauritian Rupee', 'Rs', TRUE);

-- Insert default categories (global - shared by all users)
INSERT IGNORE INTO categories (name, type, is_active) VALUES
  -- Expense Categories
  -- Bills
  ('Bills - Electricity', 'expense', TRUE),
  ('Bills - Water', 'expense', TRUE),
  ('Bills - Gas', 'expense', TRUE),
  ('Bills - Internet', 'expense', TRUE),
  ('Bills - Phone', 'expense', TRUE),
  -- Food
  ('Food - Groceries', 'expense', TRUE),
  ('Food - Dining Out', 'expense', TRUE),
  ('Food - Snacks', 'expense', TRUE),
  ('Food - Takeaway', 'expense', TRUE),
  -- Car Stuff
  ('Car - Insurance', 'expense', TRUE),
  ('Car - Parking', 'expense', TRUE),
  ('Car - Fuel', 'expense', TRUE),
  ('Car - Repairs', 'expense', TRUE),
  -- Health and Fitness
  ('Health - Medical Visit', 'expense', TRUE),
  ('Health - Pharmacy', 'expense', TRUE),
  ('Health - Insurance', 'expense', TRUE),
  ('Health - Gym', 'expense', TRUE),
  ('Health - Supplements', 'expense', TRUE),
  -- Personal & Shopping
  ('Shopping - Clothing', 'expense', TRUE),
  ('Shopping - Beauty', 'expense', TRUE),
  ('Shopping - Electronics', 'expense', TRUE),
  ('Shopping - Home Supplies', 'expense', TRUE),
  -- Education
  ('Education - Courses', 'expense', TRUE),
  ('Education - Books', 'expense', TRUE),
  -- Entertainment & Subscription
  ('Entertainment - Streaming', 'expense', TRUE),
  ('Entertainment - Apps', 'expense', TRUE),
  ('Entertainment - Movies', 'expense', TRUE),
  ('Entertainment - Games', 'expense', TRUE),
  -- Travel
  ('Travel - Flights', 'expense', TRUE),
  ('Travel - Accommodation', 'expense', TRUE),
  -- Gifts & Donation
  ('Gifts - Gifts', 'expense', TRUE),
  ('Gifts - Donation', 'expense', TRUE),
  -- Financial & Administrative
  ('Financial - Loan Payments', 'expense', TRUE),
  ('Financial - Taxes', 'expense', TRUE),
  ('Financial - Fees', 'expense', TRUE),
  -- Miscellaneous
  ('Miscellaneous', 'expense', TRUE),

  -- Income Categories
  ('Opening Balance', 'income', TRUE),
  ('Salary', 'income', TRUE),
  ('Bonus', 'income', TRUE),
  ('Freelance', 'income', TRUE),
  ('Business Income', 'income', TRUE),
  ('Interest Income', 'income', TRUE),
  ('Dividends', 'income', TRUE),
  ('Refunds', 'income', TRUE),
  ('Gifts', 'income', TRUE),
  ('Sale of Assets', 'income', TRUE),
  ('Other Income', 'income', TRUE);

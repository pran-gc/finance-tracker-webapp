-- Drop all tables in reverse order of dependencies
-- Run this before running schema.sql to recreate the database from scratch

-- Drop tables with foreign keys first
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS app_settings;
DROP TABLE IF EXISTS sessions;

-- Drop tables without foreign keys
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS currencies;
DROP TABLE IF EXISTS users;

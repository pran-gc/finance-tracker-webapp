-- Migration: Add is_hidden column to app_settings table
-- Run this on your production database

ALTER TABLE app_settings
ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE AFTER default_currency_id;

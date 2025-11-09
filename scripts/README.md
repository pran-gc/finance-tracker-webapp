# Database Setup Instructions

## Prerequisites

1. Access to your Hostinger MySQL database
2. Database credentials:
   - Database name: `u547572765_financetracker`
   - Username: `u547572765_financetracker`
   - Password: `^vO@9cF1`
   - Host: Your Hostinger database host (typically provided in cPanel)

## Setup Steps

### 1. Update Environment Variables

The `.env.local` file has been configured with your database credentials. **Update the `DB_HOST` value** with the actual database host provided by Hostinger (found in cPanel under MySQL Databases or phpMyAdmin).

```bash
DB_HOST=your-hostinger-database-host.com  # Update this!
DB_USER=u547572765_financetracker
DB_PASSWORD=^vO@9cF1
DB_NAME=u547572765_financetracker
```

### 2. Run Database Schema

Connect to your MySQL database using one of the following methods:

#### Option A: Using phpMyAdmin (Recommended for Hostinger)
1. Log in to your Hostinger cPanel
2. Open phpMyAdmin
3. Select the database `u547572765_financetracker`
4. Click on the "SQL" tab
5. Copy and paste the contents of `scripts/schema.sql`
6. Click "Go" to execute

#### Option B: Using MySQL Command Line
```bash
mysql -h your-host -u u547572765_financetracker -p u547572765_financetracker < scripts/schema.sql
```
Enter the password when prompted: `^vO@9cF1`

### 3. Verify Setup

After running the schema script, verify that the following tables have been created:
- `users`
- `sessions`
- `currencies`
- `categories`
- `app_settings`
- `transactions`

The `currencies` table should also be pre-populated with 10 default currencies.

## Migration from Google Drive

If you have existing data in Google Drive that you want to migrate:

1. **Export your data** from the old Google Drive implementation (if available)
2. Use the data to manually insert records into the new database, or
3. The application will seed default categories automatically when users first sign in

## Security Notes

- **NEVER** commit the `.env.local` file to version control
- The database password and credentials are sensitive information
- In production, consider using environment variables from your hosting provider
- The session cookie is HTTP-only and secure in production mode
- All database queries use parameterized statements to prevent SQL injection

## Application Architecture

### Authentication Flow
1. User signs in with Google OAuth (client-side)
2. Frontend receives Google access token
3. Token is sent to `/api/auth/callback` endpoint
4. Backend verifies token with Google
5. User is created/updated in database
6. Session is created and secure cookie is set
7. First-time users get default categories automatically

### Data Storage
- All user data is stored in MySQL database
- Each user's data is isolated by `user_id` foreign key
- Categories and transactions are per-user
- Currencies are global (shared across all users)
- Settings are per-user

### API Endpoints

#### Authentication
- `POST /api/auth/callback` - Exchange Google token for session
- `POST /api/auth/signout` - Sign out and destroy session
- `GET /api/auth/me` - Get current user info

#### Data Operations
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/[id]` - Update transaction
- `DELETE /api/transactions/[id]` - Delete transaction
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category (soft delete)
- `GET /api/currencies` - List active currencies
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings
- `GET /api/analytics` - Get analytics data

## Troubleshooting

### Connection Issues
- Verify `DB_HOST` is correct (check Hostinger cPanel)
- Ensure database user has proper permissions
- Check if your IP is whitelisted (if Hostinger requires it)
- Verify the database exists and credentials are correct

### Schema Issues
- If tables already exist, you may need to drop them first
- Check phpMyAdmin for error messages
- Ensure you're using MySQL 5.7+ or MariaDB 10.2+

### Application Issues
- Check browser console for API errors
- Verify session cookie is being set (check DevTools > Application > Cookies)
- Check server logs for database connection errors
- Ensure all environment variables are loaded (restart dev server)

## Clean Code Principles Applied

1. **DRY (Don't Repeat Yourself)**
   - Shared database connection pool
   - Reusable data service layer
   - Common API response patterns

2. **SOLID Principles**
   - Single Responsibility: Each module has one clear purpose
   - Open/Closed: Extensible through interfaces
   - Dependency Inversion: High-level modules don't depend on low-level details

3. **Security Best Practices**
   - Parameterized queries (SQL injection prevention)
   - HTTP-only cookies (XSS prevention)
   - Secure session management
   - Password stored as environment variable
   - User data isolation via foreign keys

4. **Maintainability**
   - Clear separation of concerns
   - Type-safe TypeScript throughout
   - Comprehensive error handling
   - Connection pooling for performance

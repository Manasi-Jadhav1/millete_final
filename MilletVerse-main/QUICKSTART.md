# MilletVerse - Quick Start Guide

## Prerequisites Checklist
- [ ] Node.js installed (v16+)
- [ ] MySQL installed and running
- [ ] Git installed

## Installation Steps (5 minutes)

### Step 1: Setup Database (2 minutes)

```bash
# Open MySQL command line or Workbench
mysql -u root -p

# Run these commands:
CREATE DATABASE milletverse;
USE milletverse;
SOURCE C:/Users/nidhi/OneDrive/Desktop/Minor_Project (MilletVerse)/milletverse/database/schema.sql;
SOURCE C:/Users/nidhi/OneDrive/Desktop/Minor_Project (MilletVerse)/milletverse/database/sample_data.sql;
EXIT;
```

### Step 2: Setup Backend (1 minute)

```bash
cd backend
npm install
npm run dev
```

Wait for: "✅ Database connected successfully!"

### Step 3: Setup Frontend (2 minutes)

```bash
# Open NEW terminal
cd frontend
npm install
npm run dev
```

Wait for: "Local: http://localhost:5173/"

### Step 4: Open Browser

Navigate to: **http://localhost:5173**

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@milletverse.com | admin123 |
| Seller | seller1@milletverse.com | seller123 |
| User | user1@milletverse.com | user123 |

## Quick Test

1. **Login as User** → Browse products → Add to cart
2. **Login as Seller** → Go to Dashboard → Add product
3. **Login as Admin** → Go to Admin Dashboard → View stats

## Common Issues

**Database connection failed?**
- Check MySQL is running
- Update `DB_PASSWORD` in `backend/.env`

**Port already in use?**
- Change PORT in `backend/.env`
- Change port in `frontend/vite.config.js`

**Module not found?**
- Run `npm install` in both folders

## Project Structure

```
milletverse/
├── backend/          # Node.js + Express API
├── frontend/         # React + Vite UI
├── database/         # MySQL schema & data
└── README.md         # Full documentation
```

## API Endpoints

Base URL: `http://localhost:5000/api`

- `GET /products` - Get all products
- `GET /learning/millet-types` - Get millet info
- `POST /auth/login` - User login
- `GET /health/recommendations` - Health tips

## Next Steps

1. Explore the Home page
2. Check Products marketplace
3. Try Health Guidance quiz
4. View Learning Center
5. Test Seller Dashboard
6. Explore Admin Panel

---

Need help? Check README.md for full documentation.

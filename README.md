# 🌾 MilletVerse - The Smart Millet Biscuit Ecosystem

A comprehensive full-stack web application that promotes healthy millet-based foods through education, marketplace, and personalized health guidance.

![MilletVerse](https://img.shields.io/badge/MilletVerse-v1.0.0-green)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MySQL](https://img.shields.io/badge/Database-MySQL-orange)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Default Credentials](#default-credentials)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### For Users
- 🛒 **Online Marketplace** - Browse and purchase millet-based biscuits
- 🔍 **Product Search & Filters** - Filter by millet type, price range
- 📚 **Learning Center** - Learn about different millet types, recipes, and health benefits
- 💪 **Health Guidance** - Get personalized recommendations based on health goals
- 📦 **Order Tracking** - Track order status in real-time
- 👤 **User Profile** - Manage account and view order history

### For Sellers
- 📊 **Dashboard** - View sales statistics and order overview
- 📦 **Product Management** - Add, edit, and delete products
- 📋 **Order Management** - Process and update order status
- 🏷️ **Inventory Tracking** - Manage stock levels

### For Admins
- 📈 **Analytics Dashboard** - Comprehensive platform statistics
- 👥 **User Management** - Manage users and approve sellers
- 📦 **Product Oversight** - Monitor and manage all products
- 📋 **Order Management** - View and manage all orders
- 📚 **Content Management** - Manage learning content

## 🛠️ Tech Stack

### Frontend
- **React 18.2** - UI Library
- **Vite** - Build Tool
- **React Router v6** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP Client
- **Context API** - State Management

### Backend
- **Node.js** - Runtime
- **Express.js** - Web Framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password Hashing
- **Multer** - File Upload

## 📁 Project Structure

```
milletverse/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── learningController.js
│   │   ├── healthController.js
│   │   ├── cartController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── LearningContent.js
│   │   ├── HealthProfile.js
│   │   └── Cart.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── learningRoutes.js
│   │   ├── healthRoutes.js
│   │   ├── cartRoutes.js
│   │   └── adminRoutes.js
│   ├── utils/
│   │   ├── authUtils.js
│   │   ├── fileUpload.js
│   │   └── apiResponse.js
│   ├── uploads/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── Alert.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── PrivateRoute.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── CartContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── Learning.jsx
│   │   │   ├── LearningDetail.jsx
│   │   │   ├── HealthGuidance.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── SellerDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── NotFound.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── postcss.config.js
├── database/
│   ├── schema.sql
│   └── sample_data.sql
└── README.md
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Package manager
- **MySQL** (v8 or higher) - [Download](https://dev.mysql.com/downloads/)
- **Git** - Version control

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd milletverse
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file from example
copy .env.example .env
# On Mac/Linux use: cp .env.example .env

# Edit .env and update your database credentials
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=milletverse
# JWT_SECRET=your_secret_key
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from root)
cd ../frontend

# Install dependencies
npm install
```

## 🗄️ Database Setup

### 1. Create Database

```sql
-- Open MySQL command line or Workbench
mysql -u root -p

-- Create database
CREATE DATABASE milletverse;
```

### 2. Import Schema

```bash
# From the project root directory
mysql -u root -p milletverse < database/schema.sql
```

### 3. Import Sample Data

```bash
# Import sample data for testing
mysql -u root -p milletverse < database/sample_data.sql
```

### 4. Verify Database

```sql
-- Connect to database
USE milletverse;

-- Check tables
SHOW TABLES;

-- Verify sample data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM learning_content;
```

## ▶️ Running the Application

### 1. Start Backend Server

```bash
# From backend directory
cd backend
npm run dev

# Server will start on http://localhost:5000
```

You should see:
```
╔════════════════════════════════════════════════════════╗
║           🌾 MilletVerse API Server                    ║
╠════════════════════════════════════════════════════════╣
║  Server running on port: 5000
║  Environment: development
║  API Base URL: http://localhost:5000/api
║  Database: Connected
╚════════════════════════════════════════════════════════╝
```

### 2. Start Frontend Development Server

```bash
# Open a new terminal, from frontend directory
cd frontend
npm run dev

# Frontend will start on http://localhost:5173
```

### 3. Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Product Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get product by ID |
| GET | `/api/products/featured` | Get featured products |
| GET | `/api/products/search?q=query` | Search products |
| POST | `/api/products` | Create product (Seller) |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders |
| GET | `/api/orders/my-orders` | Get user's orders |
| POST | `/api/orders` | Place new order |
| POST | `/api/orders/checkout` | Checkout cart |
| PATCH | `/api/orders/:id/status` | Update order status |
| PATCH | `/api/orders/:id/cancel` | Cancel order |

### Learning Content Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/learning` | Get all content |
| GET | `/api/learning/millet-types` | Get millet types |
| GET | `/api/learning/recipes` | Get recipes |
| GET | `/api/learning/tutorials` | Get tutorials |
| GET | `/api/learning/:id` | Get content by ID |

### Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health/profile` | Get health profile |
| POST | `/api/health/profile` | Create health profile |
| GET | `/api/health/recommendations` | Get recommendations |
| POST | `/api/health/bmi` | Calculate BMI |

### Cart Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get cart |
| POST | `/api/cart/add` | Add to cart |
| PUT | `/api/cart/update` | Update cart |
| DELETE | `/api/cart/remove/:id` | Remove from cart |
| DELETE | `/api/cart/clear` | Clear cart |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Get dashboard stats |
| GET | `/api/admin/users` | Get all users |
| GET | `/api/admin/sellers/pending` | Get pending sellers |
| PATCH | `/api/admin/sellers/:id/approve` | Approve seller |
| GET | `/api/admin/orders` | Get all orders |
| PATCH | `/api/admin/orders/:id/status` | Update order |

## 🔐 Default Credentials

### Admin Account
- **Email:** admin@milletverse.com
- **Password:** admin123

### Seller Account
- **Email:** seller1@milletverse.com
- **Password:** seller123

### User Account
- **Email:** user1@milletverse.com
- **Password:** user123

## 📱 Features Walkthrough

### User Flow
1. **Register/Login** - Create account or login with existing credentials
2. **Browse Products** - Explore millet products with filters
3. **Add to Cart** - Select products and add to shopping cart
4. **Checkout** - Complete order with delivery details
5. **Track Orders** - View order history and status
6. **Health Guidance** - Get personalized recommendations

### Seller Flow
1. **Register as Seller** - Create seller account
2. **Wait for Approval** - Admin approves seller account
3. **Add Products** - List millet products for sale
4. **Manage Orders** - Process and ship orders
5. **View Analytics** - Track sales performance

### Admin Flow
1. **Login** - Access admin dashboard
2. **Approve Sellers** - Review and approve seller applications
3. **Manage Users** - Oversee user accounts
4. **Monitor Orders** - Track all platform orders
5. **View Analytics** - Platform-wide statistics

## 🎨 UI Components

The application includes reusable components:
- **ProductCard** - Product display with image, price, rating
- **Alert** - Success/Error/Warning/Info notifications
- **LoadingSpinner** - Loading states
- **PrivateRoute** - Protected route wrapper
- **Navbar** - Responsive navigation
- **Footer** - Site footer with links

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=milletverse
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

#### Frontend
The frontend uses the Vite proxy configuration in `vite.config.js` to connect to the backend during development.

## 🐛 Troubleshooting

### Database Connection Error
```
Error: Database connection failed
```
**Solution:** Ensure MySQL is running and credentials in `.env` are correct.

### Port Already in Use
```
Error: Port 5000 is already in use
```
**Solution:** Change PORT in backend `.env` or kill the process using port 5000.

### Module Not Found
```
Error: Cannot find module 'xxx'
```
**Solution:** Run `npm install` in both backend and frontend directories.

### CORS Error
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution:** Ensure backend server is running and FRONTEND_URL in `.env` matches your frontend URL.

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Credits

Developed as part of the MilletVerse - The Smart Millet Biscuit Ecosystem project.

## 📞 Support

For support, email support@milletverse.com or create an issue in the repository.

---

Made with ❤️ for healthy eating and sustainable agriculture

-- ============================================
-- MilletVerse Database Schema
-- The Smart Millet Biscuit Ecosystem
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS milletverse;
USE milletverse;

-- ============================================
-- Table: users
-- Stores user information with role-based access
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'seller', 'admin') DEFAULT 'user',
    phone VARCHAR(20),
    address TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: health_profiles
-- Stores user health information for recommendations
-- ============================================
CREATE TABLE IF NOT EXISTS health_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    age INT NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    height DECIMAL(5,2),
    health_goal ENUM('weight_loss', 'diabetes_friendly', 'fitness', 'general') DEFAULT 'general',
    dietary_preferences TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_health_goal (health_goal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: learning_content
-- Stores educational content about millets, recipes, tutorials
-- ============================================
CREATE TABLE IF NOT EXISTS learning_content (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('millet_type', 'recipe', 'tutorial', 'health_benefit', 'article') NOT NULL,
    subcategory VARCHAR(100),
    image_url VARCHAR(500),
    content TEXT,
    author_id INT,
    views INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_subcategory (subcategory)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: products
-- Stores millet biscuit products for marketplace
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    ingredients TEXT NOT NULL,
    nutrition_info TEXT,
    price DECIMAL(10,2) NOT NULL,
    millet_type ENUM('ragi', 'jowar', 'bajra', 'foxtail', 'mixed', 'other') NOT NULL,
    seller_id INT NOT NULL,
    image_url VARCHAR(500),
    stock_quantity INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_millet_type (millet_type),
    INDEX idx_seller_id (seller_id),
    INDEX idx_price (price),
    INDEX idx_featured (is_featured),
    INDEX idx_available (is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: orders
-- Stores customer orders
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    order_status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    delivery_address TEXT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id),
    INDEX idx_order_status (order_status),
    INDEX idx_order_date (order_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: reviews
-- Stores product reviews and ratings
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    order_id INT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_product_id (product_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: cart
-- Stores user shopping cart items
-- ============================================
CREATE TABLE IF NOT EXISTS cart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: admin_logs
-- Stores admin activity logs for auditing
-- ============================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert Admin User (password: admin123)
INSERT INTO users (name, email, password, role, is_approved) VALUES
('Admin', 'admin@milletverse.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', TRUE);

-- Insert Sample Sellers (password: seller123)
INSERT INTO users (name, email, password, role, phone, address, is_approved) VALUES
('Green Valley Foods', 'seller1@milletverse.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'seller', '9876543210', '123 Food Street, Bangalore', TRUE),
('Healthy Bites', 'seller2@milletverse.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'seller', '9876543211', '456 Health Road, Mumbai', TRUE),
('Millet Magic', 'seller3@milletverse.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'seller', '9876543212', '789 Organic Lane, Delhi', TRUE);

-- Insert Sample Users (password: user123)
INSERT INTO users (name, email, password, role, phone, address) VALUES
('John Doe', 'user1@milletverse.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '9123456789', '12 Main Street, Bangalore'),
('Jane Smith', 'user2@milletverse.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '9123456788', '34 Park Avenue, Mumbai'),
('Mike Johnson', 'user3@milletverse.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '9123456787', '56 Garden Road, Delhi');

-- Insert Sample Health Profiles
INSERT INTO health_profiles (user_id, age, weight, height, health_goal, dietary_preferences) VALUES
(2, 30, 75.5, 170.0, 'weight_loss', 'Low carb, high fiber'),
(3, 45, 68.0, 165.0, 'diabetes_friendly', 'Low sugar, organic'),
(4, 25, 70.0, 175.0, 'fitness', 'High protein, gluten-free');

-- Insert Sample Learning Content (Millet Types)
INSERT INTO learning_content (title, description, category, subcategory, image_url, content) VALUES
('Ragi (Finger Millet) - The Calcium Powerhouse', 'Ragi is one of the most nutritious millets, rich in calcium, iron, and fiber. Perfect for bone health and diabetes management.', 'millet_type', 'ragi', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', 'Ragi contains 344mg of calcium per 100g, making it excellent for bone health. It has a low glycemic index, making it ideal for diabetics.'),
('Jowar (Sorghum) - The Heart Healthy Grain', 'Jowar is gluten-free and packed with antioxidants. Great for heart health and weight management.', 'millet_type', 'jowar', 'https://images.unsplash.com/photo-1628102491629-778571d893a3?w=400', 'Jowar is rich in potassium which helps regulate blood pressure. It contains antioxidants that fight free radicals.'),
('Bajra (Pearl Millet) - The Iron Rich Superfood', 'Bajra is excellent for fighting anemia and provides sustained energy throughout the day.', 'millet_type', 'bajra', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', 'Bajra contains 8mg of iron per 100g. It is also rich in magnesium which helps in managing diabetes.'),
('Foxtail Millet - The Brain Food', 'Foxtail millet is known to improve brain function and is excellent for memory enhancement.', 'millet_type', 'foxtail', 'https://images.unsplash.com/photo-1628102491629-778571d893a3?w=400', 'Rich in complex carbohydrates, foxtail millet provides slow-release energy. It contains thiamine which supports brain function.');

-- Insert Sample Recipes
INSERT INTO learning_content (title, description, category, subcategory, image_url, content) VALUES
('Ragi Chocolate Chip Cookies', 'Healthy chocolate chip cookies made with ragi flour. Perfect guilt-free treat!', 'recipe', 'cookies', 'https://images.unsplash.com/photo-1499636138143-bd630f5cf38b?w=400', 'Ingredients: 1 cup ragi flour, 1/2 cup jaggery, 1/4 cup coconut oil, 2 tbsp cocoa powder, dark chocolate chips. Mix dry ingredients, add wet ingredients, bake at 180°C for 15 minutes.'),
('Jowar Banana Bread', 'Moist and delicious banana bread made with jowar flour. No refined sugar!', 'recipe', 'bread', 'https://images.unsplash.com/photo-1509456592530-5d38e33f5e6b?w=400', 'Ingredients: 2 cups jowar flour, 3 ripe bananas, 1/4 cup honey, 2 eggs, 1/4 cup yogurt. Mash bananas, mix all ingredients, bake at 175°C for 45 minutes.'),
('Bajra Mathri (Healthy Snack)', 'Crispy and healthy mathri made with bajra flour. Perfect tea-time snack!', 'recipe', 'snack', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', 'Ingredients: 2 cups bajra flour, 1/4 cup ghee, cumin seeds, salt. Mix ingredients, make dough, roll and cut, bake at 160°C for 20 minutes.');

-- Insert Sample Products
INSERT INTO products (name, description, ingredients, nutrition_info, price, millet_type, seller_id, image_url, stock_quantity, rating, is_featured, is_available) VALUES
('Ragi Chocolate Biscuits (250g)', 'Delicious chocolate-flavored biscuits made with organic ragi flour. No maida, no preservatives.', 'Ragi flour, cocoa powder, jaggery, coconut oil, vanilla extract, baking soda', 'Per 100g: Calories 420, Protein 8g, Carbs 65g, Fat 12g, Fiber 10g, Calcium 150mg', 149.00, 'ragi', 2, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 100, 4.5, TRUE, TRUE),
('Jowar Oats Cookies (200g)', 'Crunchy cookies combining jowar and oats. Perfect for breakfast or snacking.', 'Jowar flour, rolled oats, honey, almond butter, cinnamon, sea salt', 'Per 100g: Calories 380, Protein 10g, Carbs 58g, Fat 11g, Fiber 8g, Iron 3mg', 129.00, 'jowar', 2, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 85, 4.3, TRUE, TRUE),
('Bajra Jeera Crackers (150g)', 'Savory crackers with cumin and black pepper. Low GI, perfect for diabetics.', 'Bajra flour, cumin seeds, black pepper, rock salt, olive oil', 'Per 100g: Calories 350, Protein 9g, Carbs 52g, Fat 10g, Fiber 12g, Magnesium 80mg', 99.00, 'bajra', 3, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 120, 4.2, FALSE, TRUE),
('Foxtail Millet Khakhra (300g)', 'Traditional Gujarati khakhra made with foxtail millet. Light and crispy.', 'Foxtail millet flour, whole wheat flour, sesame seeds, turmeric, oil', 'Per 100g: Calories 400, Protein 11g, Carbs 68g, Fat 8g, Fiber 9g, Thiamine 0.4mg', 119.00, 'foxtail', 3, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 75, 4.4, FALSE, TRUE),
('Mixed Millet Assortment Box (500g)', 'Gift box with 5 varieties of millet biscuits. Perfect for trying all flavors!', 'Ragi, jowar, bajra, foxtail, barnyard millet, jaggery, nuts, seeds', 'Per 100g: Calories 390, Protein 10g, Carbs 60g, Fat 11g, Fiber 10g, Mixed nutrients', 299.00, 'mixed', 4, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 50, 4.7, TRUE, TRUE),
('Ragi Muesli Biscuits (250g)', 'Nutritious biscuits with ragi, nuts, and dried fruits. Great for fitness enthusiasts.', 'Ragi flour, almonds, walnuts, raisins, dates, honey, ghee', 'Per 100g: Calories 450, Protein 12g, Carbs 55g, Fat 18g, Fiber 8g, Protein 12g', 179.00, 'ragi', 4, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 60, 4.6, TRUE, TRUE);

-- Insert Sample Reviews
INSERT INTO reviews (product_id, user_id, rating, comment) VALUES
(1, 3, 5, 'Amazing taste! My kids love these chocolate biscuits. So happy to find a healthy option.'),
(1, 4, 4, 'Good product but slightly sweet for my taste. Overall great quality.'),
(2, 3, 5, 'Perfect for my morning coffee. Love the crunch and the health benefits.'),
(5, 4, 5, 'Bought this as a gift for my parents. They absolutely loved the variety!'),
(6, 2, 4, 'Great for post-workout snack. High protein and tasty.');

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- View: Product Sales Summary
CREATE OR REPLACE VIEW product_sales_summary AS
SELECT 
    p.id,
    p.name,
    p.millet_type,
    p.price,
    COUNT(o.id) as total_orders,
    SUM(o.quantity) as total_quantity_sold,
    SUM(o.total_price) as total_revenue,
    p.rating,
    p.review_count
FROM products p
LEFT JOIN orders o ON p.id = o.product_id
WHERE o.order_status != 'cancelled'
GROUP BY p.id;

-- View: User Order Summary
CREATE OR REPLACE VIEW user_order_summary AS
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(o.id) as total_orders,
    SUM(o.total_price) as total_spent,
    MAX(o.order_date) as last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.role = 'user'
GROUP BY u.id;

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Procedure: Update Product Rating
DELIMITER //
CREATE PROCEDURE update_product_rating(IN product_id INT, IN new_rating INT)
BEGIN
    DECLARE avg_rating DECIMAL(3,2);
    DECLARE review_count INT;
    
    SELECT AVG(rating), COUNT(*) INTO avg_rating, review_count
    FROM reviews
    WHERE product_id = product_id;
    
    UPDATE products
    SET rating = avg_rating, review_count = review_count
    WHERE id = product_id;
END //
DELIMITER ;

-- Procedure: Get Health Recommendations
DELIMITER //
CREATE PROCEDURE get_health_recommendations(IN user_health_goal VARCHAR(50))
BEGIN
    CASE user_health_goal
        WHEN 'weight_loss' THEN
            SELECT * FROM products 
            WHERE millet_type IN ('ragi', 'jowar') 
            AND is_available = TRUE
            ORDER BY rating DESC;
        WHEN 'diabetes_friendly' THEN
            SELECT * FROM products 
            WHERE millet_type IN ('bajra', 'foxtail') 
            AND is_available = TRUE
            ORDER BY rating DESC;
        WHEN 'fitness' THEN
            SELECT * FROM products 
            WHERE millet_type IN ('ragi', 'mixed') 
            AND is_available = TRUE
            ORDER BY rating DESC;
        ELSE
            SELECT * FROM products 
            WHERE is_available = TRUE 
            AND is_featured = TRUE
            ORDER BY rating DESC;
    END CASE;
END //
DELIMITER ;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Auto-update product rating on new review
DELIMITER //
CREATE TRIGGER after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    CALL update_product_rating(NEW.product_id, NEW.rating);
END //
DELIMITER ;

-- ============================================
-- End of Schema
-- ============================================

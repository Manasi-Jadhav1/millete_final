-- ============================================
-- MilletVerse Sample Data
-- Run this after schema.sql to populate database
-- ============================================

USE milletverse;

-- ============================================
-- Default Passwords for Testing:
-- Admin: admin123
-- Sellers: seller123
-- Users: user123
-- ============================================

-- Insert Admin User (password: admin123)
-- The hash below is bcrypt hash of 'admin123'
INSERT INTO users (name, email, password, role, is_approved) VALUES
('Admin User', 'admin@milletverse.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', TRUE);

-- Insert Sample Sellers (password: seller123)
INSERT INTO users (name, email, password, role, phone, address, is_approved) VALUES
('Green Valley Foods', 'seller1@milletverse.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'seller', '9876543210', '123 Food Street, Koramangala, Bangalore, Karnataka', TRUE),
('Healthy Bites Co.', 'seller2@milletverse.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'seller', '9876543211', '456 Health Road, Andheri, Mumbai, Maharashtra', TRUE),
('Millet Magic Organics', 'seller3@milletverse.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'seller', '9876543212', '789 Organic Lane, Connaught Place, Delhi', TRUE),
('Nature\'s Basket', 'seller4@milletverse.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'seller', '9876543213', '321 Green Street, Indiranagar, Bangalore, Karnataka', TRUE);

-- Insert Sample Users (password: user123)
INSERT INTO users (name, email, password, role, phone, address) VALUES
('Rahul Sharma', 'user1@milletverse.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '9123456789', '12 Main Street, Jayanagar, Bangalore, Karnataka'),
('Priya Patel', 'user2@milletverse.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '9123456788', '34 Park Avenue, Bandra, Mumbai, Maharashtra'),
('Amit Kumar', 'user3@milletverse.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '9123456787', '56 Garden Road, Vasant Kunj, Delhi'),
('Sneha Reddy', 'user4@milletverse.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '9123456786', '78 Lake View, HSR Layout, Bangalore, Karnataka'),
('Vikram Singh', 'user5@milletverse.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '9123456785', '90 River Side, Dwarka, Delhi');

-- Insert Sample Health Profiles
INSERT INTO health_profiles (user_id, age, weight, height, health_goal, dietary_preferences) VALUES
(2, 30, 75.50, 170.00, 'weight_loss', 'Low carb, high fiber, vegetarian'),
(3, 45, 68.00, 165.00, 'diabetes_friendly', 'Low sugar, organic, no preservatives'),
(4, 25, 70.00, 175.00, 'fitness', 'High protein, gluten-free, vegan'),
(5, 35, 62.00, 160.00, 'general', 'Balanced diet, home-cooked'),
(6, 28, 80.00, 178.00, 'weight_loss', 'Keto-friendly, low calorie');

-- ============================================
-- Learning Content - Millet Types
-- ============================================
INSERT INTO learning_content (title, description, category, subcategory, image_url, content) VALUES
('Ragi (Finger Millet) - The Calcium Powerhouse', 'Ragi is one of the most nutritious millets, rich in calcium, iron, and fiber. Perfect for bone health and diabetes management.', 'millet_type', 'ragi', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600', 'Ragi contains 344mg of calcium per 100g...'),
('Jowar (Sorghum) - The Heart Healthy Grain', 'Jowar is gluten-free and packed with antioxidants. Great for heart health and weight management.', 'millet_type', 'jowar', 'https://images.unsplash.com/photo-1628102491629-778571d893a3?w=600', 'Jowar is rich in potassium which helps regulate blood pressure...'),
('Bajra (Pearl Millet) - The Iron Rich Superfood', 'Bajra is excellent for fighting anemia and provides sustained energy throughout the day.', 'millet_type', 'bajra', 'https://images.unsplash.com/photo-1596450519634-8b2c0f2d0a73?w=600', 'Bajra contains 8mg of iron per 100g...'),
('Foxtail Millet - The Brain Food', 'Foxtail millet is known to improve brain function and is excellent for memory enhancement.', 'millet_type', 'foxtail', 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600', 'Rich in complex carbohydrates, provides slow-release energy...'),
('Little Millet - The Nutrient Dense Grain', 'Little millet is packed with B-vitamins and minerals. Quick cooking and versatile in recipes.', 'millet_type', 'little', 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=600', 'Rich in B-vitamins especially niacin and thiamine...'),
('Barnyard Millet - The Fiber Champion', 'Barnyard millet has the highest fiber content among all millets. Excellent for weight management.', 'millet_type', 'barnyard', 'https://images.unsplash.com/photo-1509482560494-4126f8225994?w=600', 'Contains 9.8g of fiber per 100g, highest among millets...');

-- ============================================
-- Learning Content - Recipes
-- ============================================
INSERT INTO learning_content (title, description, category, subcategory, image_url, content) VALUES
('Ragi Chocolate Chip Cookies', 'Delicious chocolate chip cookies made with ragi flour. A perfect guilt-free treat for chocolate lovers!', 'recipe', 'cookies', 'https://images.unsplash.com/photo-1499636138143-bd630f5cf38b?w=600', 'Ingredients:\n- 1 cup ragi flour\n- 1/2 cup jaggery powder\n- 1/4 cup coconut oil\n- 2 tbsp cocoa powder\n- 1/4 cup dark chocolate chips\n- 1/2 tsp vanilla extract\n- 1/4 tsp baking soda\n- Pinch of salt\n\nInstructions:\n1. Preheat oven to 180°C\n2. Mix ragi flour, cocoa powder, baking soda, and salt\n3. In another bowl, cream coconut oil and jaggery\n4. Add vanilla extract to wet ingredients\n5. Combine wet and dry ingredients\n6. Fold in chocolate chips\n7. Drop spoonfuls on baking tray\n8. Bake for 12-15 minutes\n9. Cool before serving'),
('Jowar Banana Bread', 'Moist and delicious banana bread made with jowar flour. No refined sugar, naturally sweetened!', 'recipe', 'bread', 'https://images.unsplash.com/photo-1509456592530-5d38e33f5e6b?w=600', 'Ingredients:\n- 2 cups jowar flour\n- 3 ripe bananas (mashed)\n- 1/4 cup honey\n- 2 eggs (or flax eggs for vegan)\n- 1/4 cup Greek yogurt\n- 1/4 cup melted ghee\n- 1 tsp baking powder\n- 1/2 tsp cinnamon\n- 1/4 tsp nutmeg\n- Pinch of salt\n\nInstructions:\n1. Preheat oven to 175°C\n2. Mash bananas in a large bowl\n3. Add honey, eggs, yogurt, and ghee\n4. Mix jowar flour, baking powder, cinnamon, nutmeg, salt\n5. Combine wet and dry ingredients\n6. Pour into greased loaf pan\n7. Bake for 45-50 minutes\n8. Check with toothpick for doneness\n9. Cool for 10 minutes before slicing'),
('Bajra Mathri (Healthy Snack)', 'Crispy and healthy mathri made with bajra flour. Perfect tea-time snack that is actually good for you!', 'recipe', 'snack', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600', 'Ingredients:\n- 2 cups bajra flour\n- 1/4 cup ghee\n- 1 tsp cumin seeds\n- 1/2 tsp ajwain (carom seeds)\n- 1/2 tsp black pepper (crushed)\n- 1 tsp rock salt\n- Water for kneading\n\nInstructions:\n1. Mix bajra flour, cumin, ajwain, pepper, salt\n2. Add ghee and rub into flour\n3. Knead with water to make stiff dough\n4. Rest for 15 minutes\n5. Roll small portions into thin circles\n6. Prick with fork\n7. Bake at 160°C for 18-20 minutes\n8. Cool to room temperature\n9. Store in airtight container'),
('Foxtail Millet Upma', 'A healthy twist on the classic South Indian breakfast. Quick, easy, and nutritious!', 'recipe', 'breakfast', 'https://images.unsplash.com/photo-1589302168068-9646f405a6b0?w=600', 'Ingredients:\n- 1 cup foxtail millet\n- 2 cups water\n- 1 onion (chopped)\n- 1 green chili\n- 1 inch ginger (grated)\n- Curry leaves\n- Mustard seeds\n- Urad dal\n- Chana dal\n- Vegetables of choice\n- Salt to taste\n- Lemon juice\n- Coriander leaves\n\nInstructions:\n1. Dry roast foxtail millet until aromatic\n2. Heat oil, add mustard seeds\n3. Add dals, fry until golden\n4. Add onions, ginger, chili, curry leaves\n5. Sauté until onions turn translucent\n6. Add vegetables, cook for 2 minutes\n7. Add roasted millet, water, salt\n8. Cook covered for 15 minutes\n9. Garnish with coriander and lemon'),
('Mixed Millet Energy Balls', 'No-bake energy balls perfect for pre-workout or mid-day snack. Packed with nutrition!', 'recipe', 'snack', 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600', 'Ingredients:\n- 1/2 cup mixed millet flour (roasted)\n- 1 cup dates (pitted)\n- 1/4 cup almonds\n- 1/4 cup walnuts\n- 2 tbsp chia seeds\n- 2 tbsp cocoa powder\n- 1 tbsp ghee\n- Pinch of cardamom\n\nInstructions:\n1. Roast millet flour until aromatic\n2. Blend nuts coarsely\n3. Blend dates to form paste\n4. Mix all ingredients in a bowl\n5. Add ghee if mixture is dry\n6. Roll into small balls\n7. Refrigerate for 30 minutes\n8. Store in refrigerator');

-- ============================================
-- Learning Content - Health Benefits
-- ============================================
INSERT INTO learning_content (title, description, category, subcategory, image_url, content) VALUES
('Millets for Diabetes Management', 'How millets can help manage blood sugar levels naturally with their low glycemic index and high fiber content.', 'health_benefit', 'diabetes', 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600', 'Millets have a low glycemic index (50-55), which means they release glucose slowly into the bloodstream. The high fiber content (8-12g per 100g) slows down digestion and prevents blood sugar spikes. Studies show that replacing rice with millets can reduce diabetes risk by 35%. Best millets for diabetics: Foxtail, Little, and Barnyard millet.'),
('Millets for Weight Loss', 'Discover how millets can be your perfect companion in your weight loss journey with high fiber and protein content.', 'health_benefit', 'weight_loss', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600', 'Millets are excellent for weight loss due to their high fiber content which keeps you full longer. They contain complex carbohydrates that provide sustained energy without calorie spikes. The protein content (8-12g per 100g) helps build lean muscle. Low fat content makes them ideal for calorie-controlled diets. Best millets for weight loss: Jowar, Bajra, and Foxtail millet.'),
('Millets for Heart Health', 'Learn how millets support cardiovascular health with their rich magnesium and potassium content.', 'health_benefit', 'heart', 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600', 'Millets are rich in magnesium which helps relax blood vessels and reduce blood pressure. The potassium content helps regulate heart rhythm. Soluble fiber helps reduce LDL (bad) cholesterol. Antioxidants protect against oxidative stress. Regular consumption can reduce heart disease risk by 20-30%. Best millets for heart: Jowar, Ragi, and Bajra.'),
('Millets for Bone Health', 'Ragi and other millets are excellent sources of calcium for strong bones and teeth.', 'health_benefit', 'bones', 'https://images.unsplash.com/photo-1544367563-12123d8965cd?w=600', 'Ragi contains 344mg calcium per 100g, which is 10 times more than wheat or rice. Also rich in phosphorus which works with calcium for bone formation. Contains vitamin D precursors that aid calcium absorption. Excellent for preventing osteoporosis, especially in post-menopausal women. Best millets for bones: Ragi (Finger Millet) is the clear winner.');

-- ============================================
-- Learning Content - Tutorials
-- ============================================
INSERT INTO learning_content (title, description, category, subcategory, image_url, content) VALUES
('How to Cook Perfect Millet Roti', 'Step-by-step guide to making soft and delicious rotis with millet flour.', 'tutorial', 'cooking', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600', 'Step 1: Choose the right flour - Freshly ground millet flour works best\nStep 2: Use warm water - Helps in better binding\nStep 3: Knead well - Knead for 5-7 minutes until smooth\nStep 4: Rest the dough - Cover and rest for 15-20 minutes\nStep 5: Roll evenly - Use dry flour for rolling\nStep 6: Cook on medium heat - Too hot will make it hard\nStep 7: Flip at right time - When bubbles appear\nStep 8: Press edges - Use cloth to press for even cooking\nPro tip: Mix 20% wheat flour initially if you are new to millets'),
('Storing Millets - Best Practices', 'Learn how to store millets properly to maintain freshness and prevent pest infestation.', 'tutorial', 'storage', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600', '1. Buy in small quantities - Use within 2-3 months\n2. Store in airtight containers - Glass or food-grade plastic\n3. Keep in cool, dry place - Away from sunlight\n4. Add natural repellents - Bay leaves, dried neem leaves\n5. Freeze before storing - Kills any existing eggs\n6. Check regularly - Look for signs of moisture or pests\n7. Label containers - Note purchase date\n8. Rotate stock - Use old stock first\nShelf life: Whole millets 6-12 months, Millet flour 2-3 months');

-- ============================================
-- Products
-- ============================================
-- ============================================
-- Products
-- ============================================
INSERT INTO products (name, description, ingredients, nutrition_info, price, millet_type, seller_id, image_url, stock_quantity, rating, review_count, is_featured, is_available) VALUES
('Ragi Chocolate Delight Biscuits (250g)', 'Indulge in these delicious chocolate-flavored biscuits made with organic ragi flour. No maida, no preservatives, pure goodness!', 'Ragi flour (60%), cocoa powder (10%), jaggery (15%), coconut oil (10%), vanilla extract, baking soda, sea salt', 'Per 100g: Energy 420 Kcal, Protein 8g, Carbohydrates 65g, Fat 12g, Dietary Fiber 10g, Calcium 150mg, Iron 3.5mg', 149.00, 'ragi', 2, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600', 100, 4.5, 24, TRUE, TRUE),
('Jowar Oats Crunchy Cookies (200g)', 'Perfect blend of jowar and oats for a crunchy, healthy cookie. Great for breakfast or evening snacking.', 'Jowar flour (50%), rolled oats (25%), honey (12%), almond butter (8%), cinnamon, sea salt, baking powder', 'Per 100g: Energy 380 Kcal, Protein 10g, Carbohydrates 58g, Fat 11g, Dietary Fiber 8g, Iron 3mg, Magnesium 65mg', 129.00, 'jowar', 2, 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600', 85, 4.3, 18, TRUE, TRUE),
('Bajra Jeera Crackers (150g)', 'Savory crackers with cumin and black pepper. Low GI, perfect for diabetics and health-conscious individuals.', 'Bajra flour (70%), cumin seeds (5%), black pepper (2%), rock salt, olive oil (15%), ajwain', 'Per 100g: Energy 350 Kcal, Protein 9g, Carbohydrates 52g, Fat 10g, Dietary Fiber 12g, Magnesium 80mg, Iron 4mg', 99.00, 'bajra', 3, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600', 120, 4.2, 15, FALSE, TRUE),
('Foxtail Millet Khakhra (300g)', 'Traditional Gujarati khakhra made with foxtail millet. Light, crispy, and perfect with tea or as a light snack.', 'Foxtail millet flour (65%), whole wheat flour (20%), sesame seeds (5%), turmeric, oil (8%), salt, ajwain', 'Per 100g: Energy 400 Kcal, Protein 11g, Carbohydrates 68g, Fat 8g, Dietary Fiber 9g, Thiamine 0.4mg, Niacin 2mg', 119.00, 'foxtail', 3, 'https://images.unsplash.com/photo-1628102491629-778571d893a3?w=600', 75, 4.4, 21, FALSE, TRUE),
('Mixed Millet Gift Assortment (500g)', 'Premium gift box with 5 varieties of millet biscuits. Perfect for trying all flavors or gifting to loved ones!', 'Ragi (20%), Jowar (20%), Bajra (20%), Foxtail (20%), Little Millet (20%), jaggery, nuts, seeds, ghee', 'Per 100g: Energy 390 Kcal, Protein 10g, Carbohydrates 60g, Fat 11g, Dietary Fiber 10g, Mixed minerals and vitamins', 299.00, 'mixed', 4, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600', 50, 4.7, 32, TRUE, TRUE),
('Ragi Muesli Power Biscuits (250g)', 'Nutritious biscuits loaded with ragi, nuts, and dried fruits. Perfect for fitness enthusiasts and active individuals.', 'Ragi flour (50%), almonds (10%), walnuts (8%), raisins (10%), dates (10%), honey (8%), ghee (4%)', 'Per 100g: Energy 450 Kcal, Protein 12g, Carbohydrates 55g, Fat 18g, Dietary Fiber 8g, Calcium 120mg, Potassium 280mg', 179.00, 'ragi', 4, 'https://images.unsplash.com/photo-1509482560494-4126f8225994?w=600', 60, 4.6, 28, TRUE, TRUE),
('Jowar Sesame Thins (180g)', 'Thin, crispy crackers with sesame seeds. Light snack that does not compromise on nutrition.', 'Jowar flour (60%), sesame seeds (15%), rice flour (10%), olive oil (12%), rock salt, herbs', 'Per 100g: Energy 365 Kcal, Protein 9g, Carbohydrates 54g, Fat 12g, Dietary Fiber 7g, Calcium 180mg, Zinc 2mg', 109.00, 'jowar', 2, 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600', 95, 4.1, 12, FALSE, TRUE),
('Bajra Nankhatai (220g)', 'Traditional Indian nankhatai made healthier with bajra flour. Melts in your mouth!', 'Bajra flour (55%), ghee (20%), jaggery powder (15%), cardamom, almonds, baking powder', 'Per 100g: Energy 480 Kcal, Protein 8g, Carbohydrates 62g, Fat 20g, Dietary Fiber 9g, Iron 3.8mg', 139.00, 'bajra', 3, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600', 70, 4.5, 19, TRUE, TRUE),
('Foxtail Millet Butter Cookies (200g)', 'Classic butter cookies made healthier with foxtail millet. Perfect with evening tea.', 'Foxtail millet flour (50%), butter (25%), powdered jaggery (15%), vanilla, baking powder, salt', 'Per 100g: Energy 460 Kcal, Protein 7g, Carbohydrates 58g, Fat 22g, Dietary Fiber 6g, Vitamin A 180mcg', 159.00, 'foxtail', 4, 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600', 55, 4.3, 16, FALSE, TRUE),
('Little Millet Spice Cookies (180g)', 'Aromatic spice cookies with little millet, cinnamon, and cardamom. Festive favorite!', 'Little millet flour (55%), ghee (18%), jaggery (15%), cinnamon, cardamom, cloves, nutmeg', 'Per 100g: Energy 410 Kcal, Protein 9g, Carbohydrates 60g, Fat 14g, Dietary Fiber 8g, B-Vitamins complex', 129.00, 'little', 4, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600', 65, 4.4, 14, FALSE, TRUE),
('Barnyard Millet Mathri (200g)', 'Crispy mathri made with barnyard millet. Highest fiber content for digestive health.', 'Barnyard millet flour (65%), ghee (15%), cumin seeds, ajwain, black pepper, rock salt', 'Per 100g: Energy 340 Kcal, Protein 8g, Carbohydrates 50g, Fat 11g, Dietary Fiber 11g, Iron 5mg', 109.00, 'barnyard', 3, 'https://images.unsplash.com/photo-1582170083046-1304e28236d3?w=600', 80, 4.2, 11, FALSE, TRUE),
('Premium Millet Combo Pack (1kg)', 'Ultimate millet experience with all 12 products. Best value for money!', 'Assorted millet products - Ragi, Jowar, Bajra, Foxtail, Little, Barnyard varieties', 'Varies by product - See individual product labels', 899.00, 'mixed', 4, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600', 30, 4.8, 45, TRUE, TRUE);

-- ============================================
-- Sample Orders
-- ============================================
INSERT INTO orders (user_id, product_id, quantity, total_price, order_status, payment_status, delivery_address) VALUES
(2, 1, 2, 298.00, 'delivered', 'paid', '12 Main Street, Jayanagar, Bangalore, Karnataka - 560041'),
(2, 5, 1, 299.00, 'delivered', 'paid', '12 Main Street, Jayanagar, Bangalore, Karnataka - 560041'),
(3, 3, 3, 297.00, 'delivered', 'paid', '34 Park Avenue, Bandra, Mumbai, Maharashtra - 400050'),
(3, 1, 1, 149.00, 'shipped', 'paid', '34 Park Avenue, Bandra, Mumbai, Maharashtra - 400050'),
(4, 6, 2, 358.00, 'processing', 'paid', '56 Garden Road, Vasant Kunj, Delhi - 110070'),
(4, 2, 1, 129.00, 'pending', 'pending', '56 Garden Road, Vasant Kunj, Delhi - 110070'),
(5, 12, 1, 899.00, 'confirmed', 'paid', '78 Lake View, HSR Layout, Bangalore, Karnataka - 560102'),
(5, 4, 2, 238.00, 'pending', 'pending', '78 Lake View, HSR Layout, Bangalore, Karnataka - 560102'),
(6, 7, 1, 109.00, 'delivered', 'paid', '90 River Side, Dwarka, Delhi - 110075'),
(6, 8, 2, 278.00, 'delivered', 'paid', '90 River Side, Dwarka, Delhi - 110075');

-- ============================================
-- Sample Reviews
-- ============================================
INSERT INTO reviews (product_id, user_id, order_id, rating, comment) VALUES
(1, 2, 1, 5, 'Amazing taste! My kids love these chocolate biscuits. So happy to find a healthy option without maida.'),
(1, 3, 4, 4, 'Good product but slightly sweet for my taste. Overall great quality and packaging.'),
(2, 2, 2, 5, 'Perfect for my morning coffee. Love the crunch and the health benefits. Will order again!'),
(5, 2, 2, 5, 'Bought this as a gift for my parents. They absolutely loved the variety! Great concept.'),
(6, 4, 5, 4, 'Great for post-workout snack. High protein and tasty. Slightly expensive but worth it.'),
(3, 3, 3, 5, 'Best jeera crackers I have had! Not oily and very crispy. Perfect for diabetics like me.'),
(12, 5, 7, 5, 'Excellent combo pack! Got to try all varieties. My family is now hooked on millets.'),
(4, 5, 8, 4, 'Traditional taste with healthy twist. Khakhra was very fresh and crispy.'),
(8, 6, 10, 5, 'Nankhatai melts in mouth! Can not believe it is made with bajra. Excellent product.'),
(7, 6, 9, 4, 'Light and crispy. Good for evening snacks. Packaging could be better.');

-- ============================================
-- Sample Cart Items
-- ============================================
INSERT INTO cart (user_id, product_id, quantity) VALUES
(2, 1, 1),
(2, 6, 2),
(3, 5, 1),
(4, 2, 1),
(4, 8, 1),
(5, 12, 1);

-- ============================================
-- Admin Logs (Sample)
-- ============================================
INSERT INTO admin_logs (admin_id, action, description, ip_address) VALUES
(1, 'USER_APPROVED', 'Approved seller account: Green Valley Foods', '127.0.0.1'),
(1, 'PRODUCT_VERIFIED', 'Verified product listing: Ragi Chocolate Delight', '127.0.0.1'),
(1, 'CONTENT_ADDED', 'Added new learning content about Ragi benefits', '127.0.0.1'),
(1, 'ORDER_REVIEWED', 'Reviewed order #1 for quality assurance', '127.0.0.1');

-- ============================================
-- Update Product Ratings based on reviews
-- ============================================
CALL update_product_rating(1, 5);
CALL update_product_rating(2, 5);
CALL update_product_rating(3, 5);
CALL update_product_rating(4, 4);
CALL update_product_rating(5, 5);
CALL update_product_rating(6, 4);
CALL update_product_rating(7, 4);
CALL update_product_rating(8, 5);
CALL update_product_rating(9, 4);
CALL update_product_rating(10, 4);
CALL update_product_rating(11, 4);
CALL update_product_rating(12, 5);

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify data insertion:
-- SELECT COUNT(*) FROM users;
-- SELECT COUNT(*) FROM products;
-- SELECT COUNT(*) FROM learning_content;
-- SELECT COUNT(*) FROM orders;
-- SELECT * FROM product_sales_summary;

-- ============================================
-- End of Sample Data
-- ============================================

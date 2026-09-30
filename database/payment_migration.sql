-- ============================================================
-- MilletVerse Payment Splitting Migration
-- Run this ONCE against the milletverse database
-- ============================================================

USE milletverse;

-- ============================================================
-- STEP 4A: Add 'farmer' to users.role ENUM (if not already present)
-- ============================================================
ALTER TABLE users
  MODIFY COLUMN role ENUM('user', 'seller', 'farmer', 'admin') DEFAULT 'user';

-- ============================================================
-- STEP 4B: platform_config — admin-configurable commission %
-- Single-row table (id always = 1)
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_config (
  id              INT         PRIMARY KEY DEFAULT 1,
  commission_pct  DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  updated_by      INT         NULL,
  updated_at      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_commission_range CHECK (commission_pct >= 0 AND commission_pct <= 100),
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default 10% commission
INSERT INTO platform_config (id, commission_pct)
  VALUES (1, 10.00)
  ON DUPLICATE KEY UPDATE id = id;

-- ============================================================
-- STEP 4C: payment_transactions — one row per checkout session
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id                    INT           PRIMARY KEY AUTO_INCREMENT,
  consumer_id           INT           NOT NULL,
  razorpay_order_id     VARCHAR(100)  NULL UNIQUE,
  razorpay_payment_id   VARCHAR(100)  NULL,
  razorpay_signature    VARCHAR(500)  NULL,
  total_amount          DECIMAL(10,2) NOT NULL,
  currency              CHAR(3)       NOT NULL DEFAULT 'INR',
  payment_status        ENUM(
                          'pending',
                          'payment_initiated',
                          'payment_success',
                          'payment_failed',
                          'refund_pending',
                          'refunded'
                        )             NOT NULL DEFAULT 'pending',
  failure_reason        VARCHAR(500)  NULL,
  webhook_processed     TINYINT(1)    NOT NULL DEFAULT 0,
  created_at            TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (consumer_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_pt_consumer    (consumer_id),
  INDEX idx_pt_rz_order    (razorpay_order_id),
  INDEX idx_pt_rz_payment  (razorpay_payment_id),
  INDEX idx_pt_status      (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- STEP 4D: payment_splits — one row per order-item (per seller)
-- Records exact commission split for each seller in the checkout
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_splits (
  id                      INT           PRIMARY KEY AUTO_INCREMENT,
  payment_transaction_id  INT           NOT NULL,
  order_id                INT           NOT NULL,
  seller_id               INT           NOT NULL,
  product_id              INT           NOT NULL,
  quantity                INT           NOT NULL DEFAULT 1,
  product_amount          DECIMAL(10,2) NOT NULL,    -- price × qty (full sale amount)
  commission_pct          DECIMAL(5,2)  NOT NULL,    -- snapshot of % at time of sale
  admin_commission        DECIMAL(10,2) NOT NULL,    -- product_amount × commission_pct / 100
  seller_amount           DECIMAL(10,2) NOT NULL,    -- product_amount − admin_commission
  razorpay_transfer_id    VARCHAR(100)  NULL,
  payout_status           ENUM(
                            'payout_pending',
                            'payout_processing',
                            'payout_completed',
                            'payout_failed',
                            'refund_pending',
                            'refunded'
                          )             NOT NULL DEFAULT 'payout_pending',
  payout_notes            VARCHAR(500)  NULL,
  payout_processed_at     TIMESTAMP     NULL,
  created_at              TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id) ON DELETE RESTRICT,
  FOREIGN KEY (order_id)              REFERENCES orders(id)               ON DELETE RESTRICT,
  FOREIGN KEY (seller_id)             REFERENCES users(id)                ON DELETE RESTRICT,
  FOREIGN KEY (product_id)            REFERENCES products(id)             ON DELETE RESTRICT,
  INDEX idx_ps_txn       (payment_transaction_id),
  INDEX idx_ps_order     (order_id),
  INDEX idx_ps_seller    (seller_id),
  INDEX idx_ps_status    (payout_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- STEP 4E: Add payment_transaction_id FK to existing orders table
-- ============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_transaction_id INT NULL AFTER payment_status,
  ADD CONSTRAINT fk_order_payment
    FOREIGN KEY (payment_transaction_id)
    REFERENCES payment_transactions(id)
    ON DELETE SET NULL;

-- ============================================================
-- Verify migration
-- ============================================================
SELECT 'platform_config'       AS tbl, COUNT(*) AS rows FROM platform_config
UNION ALL
SELECT 'payment_transactions'  AS tbl, COUNT(*) AS rows FROM payment_transactions
UNION ALL
SELECT 'payment_splits'        AS tbl, COUNT(*) AS rows FROM payment_splits;

-- ============================================================
-- End of Payment Migration
-- ============================================================

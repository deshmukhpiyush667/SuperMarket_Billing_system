# 🛒 Supermarket Billing and Inventory Management System

A complete, enterprise-grade, modern full-stack web application designed for supermarkets and retail stores. Built with **React.js (Vite)** on the frontend, **Java Spring Boot 3** on the backend, and **PostgreSQL** as the production relational database.

---

## 🌟 Key Features

### 1. 🔐 Role-Based Access Control & Security
- **Authentication**: Stateless JSON Web Token (JWT) using `io.jsonwebtoken` (JJWT 0.12.x) with HMAC-SHA256 signatures.
- **Roles**:
  - `ROLE_ADMIN`: Full administrative control over products, inventory adjustments, categories, sales ledger, cancellations, and executive reports.
  - `ROLE_CASHIER`: Dedicated, streamlined Point of Sale (POS) register access for lightning-fast checkout.
- **Password Hashing**: Industry-standard `BCryptPasswordEncoder`.
- **Preloaded Demo Accounts**:
  - **Admin**: Username: `admin` | Password: `Admin@123` (Sakshi Lad)
  - **Cashier**: Username: `cashier` | Password: `Cashier@123`
  - One-click *Quick Test Login* buttons on the staff login screen.

### 2. ⚡ High-Speed Point of Sale (POS) & Billing Register
- **Rapid Item Scanning**: Support for hardware/virtual barcode scanners (EAN-13, UPC) with hotkey autofocus (`F2`).
- **Real-Time Product Search**: Instant lookup by product name, SKU, or barcode with category tab filters.
- **Cart Management**:
  - Dynamic quantity stepper (+ / -) with automatic validation against available inventory.
  - Line-level discount and overall bill discount.
  - Server-enforced Indian Rupee (₹) currency formatting.
- **Strict Server-Side Arithmetic**: All calculations (subtotals, taxable amounts, GST tax rates, discounts, change returned, and net totals) are calculated and validated strictly using Java **`BigDecimal`** on the backend rather than trusting frontend numbers.
- **Multiple Payment Modes**: Cash (with tendered cash input & automatic change calculation), Card / POS Terminal, and UPI QR Code.
- **Concurrency & Stock Protection**: Atomic database transactions (`@Transactional(isolation = Isolation.REPEATABLE_READ)`) preventing negative inventory or overselling under high concurrency.
- **Unique Invoice Numbering**: Automated format `INV-YYYYMMDD-XXXX`.

### 3. 🧾 Professional Invoicing, Print & PDF
- **Detailed Tax Invoice**: Store details, GSTIN number, cashier name, customer details, itemized breakdown with GST %, discount, subtotal, and grand total.
- **Thermal Receipt & A4 Print**: Print-ready styling with dedicated print stylesheet.
- **PDF Export**: Instant vector PDF invoice download powered by `jspdf` and `jspdf-autotable`.

### 4. 📦 Product & Category Management
- **Product Fields**: Name, SKU, Barcode, Category, Cost Price, Selling (Unit) Price, Stock Quantity, Minimum Alert Level, Measurement Unit (`pcs`, `kg`, `g`, `litre`, `pack`, `bottle`, `can`, `box`), GST Tax Rate % (`0%`, `5%`, `12%`, `18%`, `28%`), and Active toggle.
- **Search & Filters**: Multi-criteria search, category filtering, active/inactive status filter, and pagination.
- **Category Master**: Add, edit, and organize product departments with active counters.

### 5. 📊 Inventory Audit & Low-Stock Alerts
- **Stock Movement Ledger**: Complete audit history tracking `PURCHASE_RESTOCK`, `SALE`, `SALE_RETURN`, `DAMAGE`, and `MANUAL_ADJUSTMENT`.
- **Low Stock Matrix**: Real-time alerts highlighting products whose stock has dipped below their configured minimum threshold.
- **Quick Restock Modal**: Allows recording supplier PO deliveries or damage write-offs with audit notes.

### 6. 📜 Sales History & Returns / Refunds
- **Transaction Ledger**: Search historical invoices, filter by date range or payment status.
- **Re-print Invoices**: View or reprint any prior receipt at any time.
- **Safe Returns & Cancellation**: Admin can cancel a sale or process returns; the backend atomically restores the inventory levels and logs a `SALE_RETURN` audit movement.

### 7. 📈 Executive Dashboard & Analytics
- **Live KPI Cards**: Today's revenue, weekly revenue, monthly revenue, total completed sales count, and low-stock count.
- **Interactive Charts**: 7-day revenue area chart and transaction velocity trend using `Recharts`.
- **Top 5 Best-Sellers**: Automated leaderboard showing top-selling products by volume and revenue generated over the past 30 days.

---

## 🏗️ Architecture & Technology Stack

```
superMarket_billingSystem/
├── backend/                  # Java Spring Boot 3 + Maven Application
│   ├── src/main/java/com/supermarket/billing/
│   │   ├── config/           # SecurityConfig, JwtAuthFilter, DataInitializer
│   │   ├── controller/       # Auth, Product, Category, Inventory, Sale, Report
│   │   ├── dto/              # Request / Response DTOs
│   │   ├── entity/           # User, Category, Product, Sale, SaleItem, StockMovement
│   │   ├── exception/        # GlobalExceptionHandler, Custom Exceptions
│   │   ├── repository/       # Spring Data JPA Repositories
│   │   ├── service/          # Business logic, Transactional Sale & Stock Engine
│   │   └── util/             # JwtUtil, InvoiceNumberGenerator
│   ├── src/main/resources/   # application.properties (PostgreSQL & dev profiles)
│   ├── src/test/java/        # JUnit 5 & Mockito test suite
│   ├── schema-postgres.sql   # Complete PostgreSQL schema
│   ├── pom.xml
│   └── mvnw.cmd              # Maven wrapper
│
├── frontend/                 # React.js 18 + Vite SPA
│   ├── src/
│   │   ├── api/              # Axios instance & REST endpoints
│   │   ├── components/       # Layout, Navbar, Sidebar, InvoiceModal, ProtectedRoute
│   │   ├── context/          # AuthContext, NotificationContext
│   │   ├── pages/            # Login, Dashboard, POSBilling, Products, Categories, Inventory, SalesHistory, Reports
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── docker-compose.yml        # 1-Click PostgreSQL container
```

---

## 🗄️ Database Design (PostgreSQL)

### Tables & Relationships
1. **`users`**: User credentials, BCrypt hashed passwords, full names, and role (`ROLE_ADMIN`, `ROLE_CASHIER`).
2. **`categories`**: Product classifications with unique names and active status.
3. **`products`**: Inventory records with unique `sku` and `barcode`, FK to `categories`, optimistic lock `version`, unit price, cost price, stock quantity, min stock alert level, and GST rate.
4. **`sales`**: Completed transactions with unique `invoice_number`, FK to `users` (cashier), timestamps, subtotal, tax amount, discount, total amount, payment method, payment status, and tendered amount.
5. **`sale_items`**: Line items within an invoice, with snapshots of unit price, cost price, GST rate, tax amount, and quantity at the time of purchase.
6. **`stock_movements`**: Immutable audit log of every stock alteration, old quantity, new quantity, movement type, reason, and user ID.

---

## 🚀 Getting Started

### Prerequisites
- **Java**: JDK 21 (or 17+)
- **Node.js**: v18+ (tested on v24) and `npm`
- **Database**: PostgreSQL 14+ (or Docker)

---

### Step 1: Database Setup

#### Option A: Using Docker (Recommended)
Launch PostgreSQL in the background:
```bash
docker compose up -d
```
This starts PostgreSQL 16 on port `5432` with database `supermarket_db`, username `postgres`, password `postgres`.

#### Option B: Standalone Zero-Configuration Mode
The application includes a built-in `dev` profile with an in-memory PostgreSQL-compatible database. It starts out-of-the-box with all sample data preloaded without needing an external database installed!

---

### Step 2: Running the Spring Boot Backend

From the project root:
```bash
cd backend
```

#### Run with PostgreSQL (Default):
```powershell
.\mvnw.cmd spring-boot:run
```
*(You can customize database connection via environment variables: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`)*

#### Run in Zero-Config Dev Mode (Instant Local Demo):
```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```
Or execute the packaged jar directly:
```powershell
java -jar target/billing-system-1.0.0.jar --spring.profiles.active=dev
```
Backend will start on: **`http://localhost:8080`**

---

### Step 3: Running the React Frontend

Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Frontend development server will start on: **`http://localhost:5173`**

---

## 🧪 Running Automated Tests

Run the backend JUnit test suite verifying billing calculations, stock validation, and cancellation rules:
```powershell
cd backend
.\mvnw.cmd test
```

### Verified Test Cases:
- **`BillingCalculationTest`**:
  - Verifies exact tax breakdown (GST 5%, 12%, 18%) using `BigDecimal`.
  - Verifies discount application before tax calculation.
  - Verifies rejection of insufficient cash tendered during POS checkout.
- **`StockValidationTest`**:
  - Verifies `InsufficientStockException` is thrown when checkout quantity exceeds current stock.
  - Verifies prevention of negative stock adjustments.
  - Verifies stock is restored and audit movement logged upon sale cancellation / return.

---

## 📡 REST API Reference

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/health` | Application health status | Public |
| `POST` | `/api/auth/login` | Staff authentication & JWT issuance | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Authenticated |
| `GET` | `/api/products` | Paginated product list with search & category filters | Cashier, Admin |
| `GET` | `/api/products/search?keyword=...` | POS fast search by name, SKU, or barcode | Cashier, Admin |
| `GET` | `/api/products/barcode/{barcode}` | Barcode lookup | Cashier, Admin |
| `GET` | `/api/products/low-stock` | Low stock products list | Cashier, Admin |
| `POST` | `/api/products` | Create new product | Admin |
| `PUT` | `/api/products/{id}` | Update product details | Admin |
| `PATCH` | `/api/products/{id}/toggle-status` | Activate / deactivate product | Admin |
| `GET` | `/api/categories` | Retrieve categories list | Cashier, Admin |
| `POST` | `/api/categories` | Create new category | Admin |
| `POST` | `/api/sales` | Complete a new POS sale transaction & issue invoice | Cashier, Admin |
| `GET` | `/api/sales` | Sales ledger with date range & invoice filters | Cashier, Admin |
| `GET` | `/api/sales/invoice/{invoiceNumber}` | Look up sale by invoice number | Cashier, Admin |
| `POST` | `/api/sales/{id}/cancel` | Cancel sale, restock items & record return | Admin |
| `POST` | `/api/inventory/adjust` | Record stock restock or damage adjustment | Cashier, Admin |
| `GET` | `/api/inventory/movements` | Stock movement audit history | Cashier, Admin |
| `GET` | `/api/reports/dashboard` | Dashboard metrics, 7-day trend, best-sellers | Admin |

---

## 💡 Troubleshooting & FAQs

1. **Port 8080 or 5173 is already in use:**
   - To change backend port, add `--server.port=8081` when starting Spring Boot.
   - Vite automatically falls back to port 5174 if 5173 is busy.
2. **Database connection failed:**
   - Verify PostgreSQL service is running or use `docker compose up -d`.
   - Alternatively, pass `--spring.profiles.active=dev` to use the embedded PostgreSQL-compatible mode.
3. **CORS errors in browser:**
   - The Vite frontend has a proxy configured in `vite.config.js` forwarding `/api` requests to `http://localhost:8080`, and Spring Security is configured with global CORS mappings.

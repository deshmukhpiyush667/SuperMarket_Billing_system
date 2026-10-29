package com.supermarket.billing.config;

import com.supermarket.billing.entity.*;
import com.supermarket.billing.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;
    private final StockMovementRepository stockMovementRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           CategoryRepository categoryRepository,
                           ProductRepository productRepository,
                           SaleRepository saleRepository,
                           StockMovementRepository stockMovementRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.saleRepository = saleRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return; // Data already seeded
        }

        System.out.println(">>> Initializing Supermarket DB sample data...");

        // 1. Seed Users
        User admin = new User("admin", passwordEncoder.encode("Admin@123"), "Sakshi Lad (Admin)", "admin@supermarket.com", Role.ROLE_ADMIN);
        User cashier = new User("cashier", passwordEncoder.encode("Cashier@123"), "Priya Patel (Cashier)", "cashier@supermarket.com", Role.ROLE_CASHIER);
        userRepository.save(admin);
        userRepository.save(cashier);

        // 2. Seed Categories
        Category dairy = categoryRepository.save(new Category("Dairy & Bakery", "Milk, cheese, butter, fresh breads and bakery treats"));
        Category staples = categoryRepository.save(new Category("Staples & Grains", "Rice, flour, lentils, spices, and cooking oils"));
        Category snacks = categoryRepository.save(new Category("Snacks & Beverages", "Chips, cookies, sodas, fruit juices, and teas"));
        Category produce = categoryRepository.save(new Category("Fruits & Vegetables", "Farm-fresh organic fruits and seasonal vegetables"));
        Category personalCare = categoryRepository.save(new Category("Personal Care", "Soaps, shampoos, oral care, and skin care"));
        Category household = categoryRepository.save(new Category("Household & Cleaning", "Detergents, floor cleaners, and kitchen utilities"));

        // 3. Seed Products
        List<Product> products = new ArrayList<>();

        products.add(createProd("Amul Taaza Homogenised Toned Milk 1L", "AMUL-MK-1L", "8901262010015", dairy, new BigDecimal("64.00"), new BigDecimal("72.00"), 45, 15, "litre", new BigDecimal("5.00")));
        products.add(createProd("Amul Salted Butter 500g", "AMUL-BT-500", "8901262010022", dairy, new BigDecimal("240.00"), new BigDecimal("275.00"), 28, 10, "pack", new BigDecimal("12.00")));
        products.add(createProd("Britannia Brown Bread 400g", "BRIT-BB-400", "8901063141113", dairy, new BigDecimal("40.00"), new BigDecimal("50.00"), 8, 10, "pack", new BigDecimal("0.00"))); // Low stock!

        products.add(createProd("India Gate Basmati Rice Rozzana 5kg", "IG-RICE-5KG", "8901725181056", staples, new BigDecimal("380.00"), new BigDecimal("465.00"), 35, 10, "pack", new BigDecimal("5.00")));
        products.add(createProd("Aashirvaad Shudh Chakki Atta 10kg", "AASH-ATTA-10", "8901725191017", staples, new BigDecimal("420.00"), new BigDecimal("490.00"), 22, 10, "pack", new BigDecimal("5.00")));
        products.add(createProd("Fortune Sunlite Refined Sunflower Oil 1L", "FORT-OIL-1L", "8906007280018", staples, new BigDecimal("125.00"), new BigDecimal("155.00"), 4, 10, "litre", new BigDecimal("5.00"))); // Low stock!
        products.add(createProd("Tata Salt Vacuum Evaporated 1kg", "TATA-SALT-1K", "8904004400010", staples, new BigDecimal("20.00"), new BigDecimal("28.00"), 80, 20, "pack", new BigDecimal("0.00")));
        products.add(createProd("Tata Sampann Toor Dal 1kg", "TATA-TOOR-1K", "8904004402120", staples, new BigDecimal("145.00"), new BigDecimal("185.00"), 18, 10, "kg", new BigDecimal("5.00")));

        products.add(createProd("Lay's Classic Salted Potato Chips 50g", "LAYS-CLS-50G", "8901491101837", snacks, new BigDecimal("15.00"), new BigDecimal("20.00"), 120, 25, "pack", new BigDecimal("12.00")));
        products.add(createProd("Coca-Cola Original Taste Can 300ml", "COKE-CAN-300", "8901764012236", snacks, new BigDecimal("30.00"), new BigDecimal("40.00"), 60, 20, "can", new BigDecimal("18.00")));
        products.add(createProd("Parle-G Glucose Biscuits 250g", "PARLE-G-250G", "8901719101015", snacks, new BigDecimal("22.00"), new BigDecimal("30.00"), 5, 15, "pack", new BigDecimal("18.00"))); // Low stock!
        products.add(createProd("Nescafe Classic Instant Coffee Jar 100g", "NESC-COF-100", "8901058852710", snacks, new BigDecimal("280.00"), new BigDecimal("345.00"), 25, 8, "jar", new BigDecimal("18.00")));

        products.add(createProd("Fresh Shimla Apple 1kg", "F-APL-SHM-1K", "8909990001011", produce, new BigDecimal("120.00"), new BigDecimal("160.00"), 30, 10, "kg", new BigDecimal("0.00")));
        products.add(createProd("Fresh Red Onions 1kg", "F-ONION-1KG", "8909990001028", produce, new BigDecimal("28.00"), new BigDecimal("42.00"), 50, 15, "kg", new BigDecimal("0.00")));

        products.add(createProd("Dettol Original Germ Protection Soap 125g", "DETT-SOP-125", "8901396111116", personalCare, new BigDecimal("45.00"), new BigDecimal("60.00"), 40, 15, "pcs", new BigDecimal("18.00")));
        products.add(createProd("Colgate Total Dental Cream 120g", "COLG-TOT-120", "8901314010514", personalCare, new BigDecimal("85.00"), new BigDecimal("115.00"), 35, 10, "pcs", new BigDecimal("18.00")));

        products.add(createProd("Surf Excel Matic Top Load Detergent Powder 2kg", "SURF-MAT-2KG", "8901030381016", household, new BigDecimal("380.00"), new BigDecimal("460.00"), 18, 5, "pack", new BigDecimal("18.00")));
        products.add(createProd("Vim Dishwash Liquid Lemon 750ml", "VIM-LIQ-750", "8901030421019", household, new BigDecimal("140.00"), new BigDecimal("180.00"), 3, 10, "bottle", new BigDecimal("18.00"))); // Low stock!

        List<Product> savedProducts = productRepository.saveAll(products);

        // Record Initial Stock Movements
        for (Product prod : savedProducts) {
            StockMovement movement = new StockMovement(
                    prod,
                    MovementType.PURCHASE_RESTOCK,
                    prod.getStockQuantity(),
                    0,
                    prod.getStockQuantity(),
                    "INITIAL_INVENTORY",
                    "Opening balance stock",
                    admin
            );
            stockMovementRepository.save(movement);
        }

        // 4. Seed a few realistic recent sales for Dashboard metrics
        seedSampleSale(cashier, savedProducts.get(0), 2, savedProducts.get(3), 1, "INV-20261028-1001", PaymentMethod.UPI, "Rahul Verma", "9876543210", LocalDateTime.now().minusDays(1).withHour(11).withMinute(30));
        seedSampleSale(cashier, savedProducts.get(8), 3, savedProducts.get(9), 2, "INV-20261028-1002", PaymentMethod.CASH, "Sunita Devi", "9812345678", LocalDateTime.now().minusDays(1).withHour(16).withMinute(45));
        seedSampleSale(cashier, savedProducts.get(1), 1, savedProducts.get(4), 1, "INV-20261029-1003", PaymentMethod.CARD, "Amitabh Sen", "9900112233", LocalDateTime.now().minusHours(3));
        seedSampleSale(cashier, savedProducts.get(10), 4, savedProducts.get(14), 2, "INV-20261029-1004", PaymentMethod.UPI, "Neha Gupta", "9845098450", LocalDateTime.now().minusMinutes(45));

        System.out.println(">>> Supermarket DB sample data initialized successfully!");
    }

    private Product createProd(String name, String sku, String barcode, Category category,
                               BigDecimal cost, BigDecimal price, int stock, int minStock,
                               String unit, BigDecimal taxRate) {
        Product p = new Product();
        p.setName(name);
        p.setSku(sku);
        p.setBarcode(barcode);
        p.setCategory(category);
        p.setCostPrice(cost);
        p.setUnitPrice(price);
        p.setStockQuantity(stock);
        p.setMinStockLevel(minStock);
        p.setMeasurementUnit(unit);
        p.setTaxRate(taxRate);
        p.setActive(true);
        return p;
    }

    private void seedSampleSale(User cashier, Product p1, int q1, Product p2, int q2,
                                String invoiceNum, PaymentMethod method, String custName, String phone, LocalDateTime saleTime) {
        Sale sale = new Sale();
        sale.setInvoiceNumber(invoiceNum);
        sale.setSaleDate(saleTime);
        sale.setCashier(cashier);
        sale.setCustomerName(custName);
        sale.setCustomerPhone(phone);
        sale.setPaymentMethod(method);
        sale.setPaymentStatus(SaleStatus.COMPLETED);

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal tax = BigDecimal.ZERO;

        SaleItem item1 = buildItem(sale, p1, q1);
        SaleItem item2 = buildItem(sale, p2, q2);

        sale.addItem(item1);
        sale.addItem(item2);

        subtotal = item1.getUnitPrice().multiply(BigDecimal.valueOf(q1)).add(item2.getUnitPrice().multiply(BigDecimal.valueOf(q2)));
        tax = item1.getTaxAmount().add(item2.getTaxAmount());

        sale.setSubtotal(subtotal);
        sale.setDiscountAmount(BigDecimal.ZERO);
        sale.setTaxAmount(tax);
        sale.setTotalAmount(subtotal.add(tax));
        sale.setAmountTendered(subtotal.add(tax));
        sale.setChangeAmount(BigDecimal.ZERO);

        saleRepository.save(sale);
    }

    private SaleItem buildItem(Sale sale, Product p, int qty) {
        SaleItem item = new SaleItem();
        item.setSale(sale);
        item.setProduct(p);
        item.setProductName(p.getName());
        item.setProductSku(p.getSku());
        item.setQuantity(qty);
        item.setUnitPrice(p.getUnitPrice());
        item.setCostPrice(p.getCostPrice());
        item.setDiscountAmount(BigDecimal.ZERO);
        item.setTaxRate(p.getTaxRate());
        BigDecimal taxable = p.getUnitPrice().multiply(BigDecimal.valueOf(qty));
        BigDecimal itemTax = taxable.multiply(p.getTaxRate()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        item.setTaxAmount(itemTax);
        item.setTotalPrice(taxable.add(itemTax));
        return item;
    }
}

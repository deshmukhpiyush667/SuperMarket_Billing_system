package com.supermarket.billing;

import com.supermarket.billing.dto.SaleItemRequestDTO;
import com.supermarket.billing.dto.SaleRequestDTO;
import com.supermarket.billing.dto.SaleResponseDTO;
import com.supermarket.billing.entity.*;
import com.supermarket.billing.exception.BadRequestException;
import com.supermarket.billing.exception.InsufficientStockException;
import com.supermarket.billing.repository.ProductRepository;
import com.supermarket.billing.repository.SaleRepository;
import com.supermarket.billing.repository.StockMovementRepository;
import com.supermarket.billing.service.AuthService;
import com.supermarket.billing.service.SaleService;
import com.supermarket.billing.util.InvoiceNumberGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BillingCalculationTest {

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private AuthService authService;

    @Mock
    private InvoiceNumberGenerator invoiceNumberGenerator;

    private SaleService saleService;
    private User testCashier;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        saleService = new SaleService(saleRepository, productRepository, stockMovementRepository, authService, invoiceNumberGenerator);

        testCashier = new User("cashier1", "encodedPass", "Test Cashier", "cashier@test.com", Role.ROLE_CASHIER);
        testCashier.setId(10L);

        Category category = new Category("Groceries", "Food items");
        category.setId(1L);

        testProduct = new Product();
        testProduct.setId(100L);
        testProduct.setName("Basmati Rice 5kg");
        testProduct.setSku("RICE-5KG");
        testProduct.setBarcode("8901234567890");
        testProduct.setCategory(category);
        testProduct.setCostPrice(new BigDecimal("350.00"));
        testProduct.setUnitPrice(new BigDecimal("450.00"));
        testProduct.setStockQuantity(50);
        testProduct.setMinStockLevel(10);
        testProduct.setTaxRate(new BigDecimal("5.00")); // 5% GST
        testProduct.setActive(true);
    }

    @Test
    @DisplayName("Should accurately calculate subtotal, 5% tax, and total using BigDecimal")
    void testAccurateTaxAndTotalCalculation() {
        when(authService.getCurrentAuthenticatedUser()).thenReturn(testCashier);
        when(invoiceNumberGenerator.generate()).thenReturn("INV-TEST-0001");
        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));
        when(saleRepository.save(any(Sale.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SaleRequestDTO request = new SaleRequestDTO();
        request.setPaymentMethod(PaymentMethod.UPI);
        request.setCustomerName("Sunita Rao");

        // 2 units of Basmati Rice @ 450.00 each = 900.00
        // 5% tax on 900.00 = 45.00
        // Total = 945.00
        SaleItemRequestDTO item = new SaleItemRequestDTO(100L, 2, BigDecimal.ZERO);
        request.setItems(List.of(item));

        SaleResponseDTO response = saleService.createSale(request);

        assertNotNull(response);
        assertEquals(0, new BigDecimal("900.00").compareTo(response.getSubtotal()), "Subtotal should be exactly 900.00");
        assertEquals(0, new BigDecimal("45.00").compareTo(response.getTaxAmount()), "Tax amount should be 45.00 (5% GST)");
        assertEquals(0, new BigDecimal("945.00").compareTo(response.getTotalAmount()), "Total payable should be exactly 945.00");
        assertEquals(48, testProduct.getStockQuantity(), "Stock should be decremented by 2 units (50 -> 48)");

        verify(stockMovementRepository, times(1)).saveAll(any());
        verify(saleRepository, times(1)).save(any(Sale.class));
    }

    @Test
    @DisplayName("Should apply item discount correctly before tax calculation")
    void testDiscountCalculation() {
        when(authService.getCurrentAuthenticatedUser()).thenReturn(testCashier);
        when(invoiceNumberGenerator.generate()).thenReturn("INV-TEST-0002");
        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));
        when(saleRepository.save(any(Sale.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SaleRequestDTO request = new SaleRequestDTO();
        request.setPaymentMethod(PaymentMethod.CASH);
        request.setAmountTendered(new BigDecimal("1000.00"));

        // 2 units @ 450 = 900 gross. Discount = 50.00. Taxable = 850.00.
        // 5% tax on 850.00 = 42.50.
        // Total = 892.50. Change from 1000.00 = 107.50.
        SaleItemRequestDTO item = new SaleItemRequestDTO(100L, 2, new BigDecimal("50.00"));
        request.setItems(List.of(item));

        SaleResponseDTO response = saleService.createSale(request);

        assertNotNull(response);
        assertEquals(0, new BigDecimal("850.00").compareTo(response.getSubtotal()));
        assertEquals(0, new BigDecimal("42.50").compareTo(response.getTaxAmount()));
        assertEquals(0, new BigDecimal("892.50").compareTo(response.getTotalAmount()));
        assertEquals(0, new BigDecimal("107.50").compareTo(response.getChangeAmount()), "Change returned should be 107.50");
    }

    @Test
    @DisplayName("Should reject sale if amount tendered in CASH is less than payable amount")
    void testInsufficientCashTendered() {
        when(authService.getCurrentAuthenticatedUser()).thenReturn(testCashier);
        when(invoiceNumberGenerator.generate()).thenReturn("INV-TEST-0003");
        when(productRepository.findById(100L)).thenReturn(Optional.of(testProduct));

        SaleRequestDTO request = new SaleRequestDTO();
        request.setPaymentMethod(PaymentMethod.CASH);
        request.setAmountTendered(new BigDecimal("500.00")); // Required is 945.00

        SaleItemRequestDTO item = new SaleItemRequestDTO(100L, 2, BigDecimal.ZERO);
        request.setItems(List.of(item));

        assertThrows(BadRequestException.class, () -> saleService.createSale(request));
    }
}

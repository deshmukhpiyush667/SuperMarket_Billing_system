package com.supermarket.billing;

import com.supermarket.billing.dto.SaleItemRequestDTO;
import com.supermarket.billing.dto.SaleRequestDTO;
import com.supermarket.billing.dto.StockAdjustmentRequestDTO;
import com.supermarket.billing.entity.*;
import com.supermarket.billing.exception.BadRequestException;
import com.supermarket.billing.exception.InsufficientStockException;
import com.supermarket.billing.repository.ProductRepository;
import com.supermarket.billing.repository.SaleRepository;
import com.supermarket.billing.repository.StockMovementRepository;
import com.supermarket.billing.service.AuthService;
import com.supermarket.billing.service.InventoryService;
import com.supermarket.billing.service.SaleService;
import com.supermarket.billing.util.InvoiceNumberGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StockValidationTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private AuthService authService;

    @Mock
    private InvoiceNumberGenerator invoiceNumberGenerator;

    private SaleService saleService;
    private InventoryService inventoryService;
    private Product product;
    private User testUser;

    @BeforeEach
    void setUp() {
        saleService = new SaleService(saleRepository, productRepository, stockMovementRepository, authService, invoiceNumberGenerator);
        inventoryService = new InventoryService(productRepository, stockMovementRepository, authService);

        testUser = new User("admin", "pass", "Administrator", "admin@test.com", Role.ROLE_ADMIN);
        testUser.setId(1L);

        product = new Product();
        product.setId(50L);
        product.setName("Amul Butter 500g");
        product.setSku("BUTTER-500G");
        product.setBarcode("8901234000001");
        product.setUnitPrice(new BigDecimal("275.00"));
        product.setCostPrice(new BigDecimal("240.00"));
        product.setTaxRate(new BigDecimal("12.00"));
        product.setStockQuantity(5); // Only 5 in stock
        product.setMinStockLevel(10);
        product.setActive(true);
    }

    @Test
    @DisplayName("Should throw InsufficientStockException when requested sale quantity exceeds available stock")
    void testPreventOverselling() {
        when(authService.getCurrentAuthenticatedUser()).thenReturn(testUser);
        when(productRepository.findById(50L)).thenReturn(Optional.of(product));

        SaleRequestDTO request = new SaleRequestDTO();
        request.setPaymentMethod(PaymentMethod.UPI);

        // Requested 10 units, but only 5 available
        SaleItemRequestDTO item = new SaleItemRequestDTO(50L, 10, BigDecimal.ZERO);
        request.setItems(List.of(item));

        InsufficientStockException ex = assertThrows(InsufficientStockException.class, () -> saleService.createSale(request));
        assertTrue(ex.getMessage().contains("Insufficient stock for product 'Amul Butter 500g'"));
        assertEquals(5, product.getStockQuantity(), "Stock should remain unmodified");
    }

    @Test
    @DisplayName("Should prevent manual stock adjustment below zero")
    void testPreventNegativeStockAdjustment() {
        when(productRepository.findById(50L)).thenReturn(Optional.of(product));

        StockAdjustmentRequestDTO request = new StockAdjustmentRequestDTO();
        request.setProductId(50L);
        request.setMovementType(MovementType.DAMAGE);
        request.setQuantityChanged(10); // Current is 5, removing 10 would result in -5
        request.setReason("Expired packages damaged");

        assertThrows(BadRequestException.class, () -> inventoryService.adjustStock(request));
        assertEquals(5, product.getStockQuantity());
    }

    @Test
    @DisplayName("Should correctly restock inventory when a sale is cancelled")
    void testSaleCancellationRestock() {
        when(authService.getCurrentAuthenticatedUser()).thenReturn(testUser);

        Sale sale = new Sale();
        sale.setId(77L);
        sale.setInvoiceNumber("INV-TEST-77");
        sale.setPaymentStatus(SaleStatus.COMPLETED);

        SaleItem saleItem = new SaleItem();
        saleItem.setProduct(product);
        saleItem.setQuantity(4);
        sale.addItem(saleItem);

        when(saleRepository.findById(77L)).thenReturn(Optional.of(sale));
        when(saleRepository.save(any(Sale.class))).thenAnswer(inv -> inv.getArgument(0));

        // Before cancellation: stock is 5
        saleService.cancelSale(77L, "Customer requested return");

        // After cancellation: stock should be 5 + 4 = 9
        assertEquals(9, product.getStockQuantity());
        assertEquals(SaleStatus.CANCELLED, sale.getPaymentStatus());
        verify(stockMovementRepository, times(1)).save(any(StockMovement.class));
    }
}

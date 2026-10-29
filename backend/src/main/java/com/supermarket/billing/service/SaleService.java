package com.supermarket.billing.service;

import com.supermarket.billing.dto.*;
import com.supermarket.billing.entity.*;
import com.supermarket.billing.exception.BadRequestException;
import com.supermarket.billing.exception.InsufficientStockException;
import com.supermarket.billing.exception.ResourceNotFoundException;
import com.supermarket.billing.repository.ProductRepository;
import com.supermarket.billing.repository.SaleRepository;
import com.supermarket.billing.repository.StockMovementRepository;
import com.supermarket.billing.util.InvoiceNumberGenerator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final AuthService authService;
    private final InvoiceNumberGenerator invoiceNumberGenerator;

    public SaleService(SaleRepository saleRepository,
                       ProductRepository productRepository,
                       StockMovementRepository stockMovementRepository,
                       AuthService authService,
                       InvoiceNumberGenerator invoiceNumberGenerator) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.authService = authService;
        this.invoiceNumberGenerator = invoiceNumberGenerator;
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public SaleResponseDTO createSale(SaleRequestDTO request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Sale must have at least one product item");
        }

        User cashier = authService.getCurrentAuthenticatedUser();
        if (cashier == null) {
            throw new BadRequestException("Unable to determine authenticated cashier for transaction");
        }

        String invoiceNumber = invoiceNumberGenerator.generate();

        Sale sale = new Sale();
        sale.setInvoiceNumber(invoiceNumber);
        sale.setSaleDate(LocalDateTime.now());
        sale.setCashier(cashier);
        sale.setCustomerName((request.getCustomerName() != null && !request.getCustomerName().trim().isEmpty())
                ? request.getCustomerName().trim() : "Walk-in Customer");
        sale.setCustomerPhone(request.getCustomerPhone());
        sale.setPaymentMethod(request.getPaymentMethod());
        sale.setPaymentStatus(SaleStatus.COMPLETED);
        sale.setNotes(request.getNotes());

        BigDecimal runningSubtotal = BigDecimal.ZERO;
        BigDecimal runningTax = BigDecimal.ZERO;
        BigDecimal runningItemsDiscount = BigDecimal.ZERO;

        List<StockMovement> stockMovements = new ArrayList<>();

        for (SaleItemRequestDTO itemReq : request.getItems()) {
            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                throw new BadRequestException("Invalid quantity for product ID: " + itemReq.getProductId());
            }

            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + itemReq.getProductId()));

            if (!product.isActive()) {
                throw new BadRequestException("Product '" + product.getName() + "' is inactive and cannot be sold");
            }

            if (product.getStockQuantity() < itemReq.getQuantity()) {
                throw new InsufficientStockException("Insufficient stock for product '" + product.getName() +
                        "'. Available: " + product.getStockQuantity() + ", requested: " + itemReq.getQuantity());
            }

            // Calculate with strict server-side BigDecimal arithmetic
            BigDecimal unitPrice = product.getUnitPrice().setScale(2, RoundingMode.HALF_UP);
            BigDecimal costPrice = product.getCostPrice().setScale(2, RoundingMode.HALF_UP);
            BigDecimal taxRate = product.getTaxRate().setScale(2, RoundingMode.HALF_UP);

            BigDecimal lineGross = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity())).setScale(2, RoundingMode.HALF_UP);
            BigDecimal itemDiscount = (itemReq.getDiscountAmount() != null)
                    ? itemReq.getDiscountAmount().setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

            if (itemDiscount.compareTo(lineGross) > 0) {
                throw new BadRequestException("Discount cannot exceed line total for product: " + product.getName());
            }

            BigDecimal taxableAmount = lineGross.subtract(itemDiscount).setScale(2, RoundingMode.HALF_UP);
            BigDecimal itemTax = taxableAmount.multiply(taxRate)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = taxableAmount.add(itemTax).setScale(2, RoundingMode.HALF_UP);

            runningSubtotal = runningSubtotal.add(taxableAmount);
            runningTax = runningTax.add(itemTax);
            runningItemsDiscount = runningItemsDiscount.add(itemDiscount);

            SaleItem saleItem = new SaleItem();
            saleItem.setProduct(product);
            saleItem.setProductName(product.getName());
            saleItem.setProductSku(product.getSku());
            saleItem.setQuantity(itemReq.getQuantity());
            saleItem.setUnitPrice(unitPrice);
            saleItem.setCostPrice(costPrice);
            saleItem.setDiscountAmount(itemDiscount);
            saleItem.setTaxRate(taxRate);
            saleItem.setTaxAmount(itemTax);
            saleItem.setTotalPrice(lineTotal);

            sale.addItem(saleItem);

            // Deduct stock
            int stockBefore = product.getStockQuantity();
            int stockAfter = stockBefore - itemReq.getQuantity();
            product.setStockQuantity(stockAfter);
            productRepository.save(product);

            StockMovement movement = new StockMovement(
                    product,
                    MovementType.SALE,
                    -itemReq.getQuantity(),
                    stockBefore,
                    stockAfter,
                    invoiceNumber,
                    "Sale invoice: " + invoiceNumber,
                    cashier
            );
            stockMovements.add(movement);
        }

        BigDecimal extraOrderDiscount = (request.getDiscountAmount() != null)
                ? request.getDiscountAmount().setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalDiscount = runningItemsDiscount.add(extraOrderDiscount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal netPayable = runningSubtotal.add(runningTax).subtract(extraOrderDiscount).setScale(2, RoundingMode.HALF_UP);
        if (netPayable.compareTo(BigDecimal.ZERO) < 0) {
            netPayable = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        sale.setSubtotal(runningSubtotal);
        sale.setTaxAmount(runningTax);
        sale.setDiscountAmount(totalDiscount);
        sale.setTotalAmount(netPayable);

        if (request.getPaymentMethod() == PaymentMethod.CASH && request.getAmountTendered() != null) {
            BigDecimal tendered = request.getAmountTendered().setScale(2, RoundingMode.HALF_UP);
            if (tendered.compareTo(netPayable) < 0) {
                throw new BadRequestException("Amount tendered (₹" + tendered + ") is less than total payable amount (₹" + netPayable + ")");
            }
            sale.setAmountTendered(tendered);
            sale.setChangeAmount(tendered.subtract(netPayable).setScale(2, RoundingMode.HALF_UP));
        } else {
            sale.setAmountTendered(netPayable);
            sale.setChangeAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        }

        Sale savedSale = saleRepository.save(sale);
        stockMovementRepository.saveAll(stockMovements);

        return mapToDTO(savedSale);
    }

    public Page<SaleResponseDTO> getSales(String invoiceNumber,
                                          LocalDateTime startDate,
                                          LocalDateTime endDate,
                                          SaleStatus status,
                                          int page,
                                          int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("saleDate").descending());
        return saleRepository.filterSales(
                (invoiceNumber != null && !invoiceNumber.trim().isEmpty()) ? invoiceNumber.trim() : null,
                startDate,
                endDate,
                status,
                pageRequest
        ).map(this::mapToDTO);
    }

    public SaleResponseDTO getSaleByInvoice(String invoiceNumber) {
        Sale sale = saleRepository.findByInvoiceNumber(invoiceNumber.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceNumber));
        return mapToDTO(sale);
    }

    public SaleResponseDTO getSaleById(Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with ID: " + id));
        return mapToDTO(sale);
    }

    @Transactional
    public SaleResponseDTO cancelSale(Long id, String reason) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with ID: " + id));

        if (sale.getPaymentStatus() == SaleStatus.CANCELLED || sale.getPaymentStatus() == SaleStatus.REFUNDED) {
            throw new BadRequestException("Sale is already marked as " + sale.getPaymentStatus());
        }

        sale.setPaymentStatus(SaleStatus.CANCELLED);
        sale.setNotes((sale.getNotes() != null ? sale.getNotes() + " | " : "") + "Cancelled: " + (reason != null ? reason : "Customer return"));

        User currentUser = authService.getCurrentAuthenticatedUser();

        // Restock products and log movement
        for (SaleItem item : sale.getItems()) {
            Product product = item.getProduct();
            int stockBefore = product.getStockQuantity();
            int stockAfter = stockBefore + item.getQuantity();
            product.setStockQuantity(stockAfter);
            productRepository.save(product);

            StockMovement movement = new StockMovement(
                    product,
                    MovementType.SALE_RETURN,
                    item.getQuantity(),
                    stockBefore,
                    stockAfter,
                    sale.getInvoiceNumber(),
                    "Sale return / cancellation: " + (reason != null ? reason : "Customer return"),
                    currentUser
            );
            stockMovementRepository.save(movement);
        }

        return mapToDTO(saleRepository.save(sale));
    }

    public SaleResponseDTO mapToDTO(Sale sale) {
        SaleResponseDTO dto = new SaleResponseDTO();
        dto.setId(sale.getId());
        dto.setInvoiceNumber(sale.getInvoiceNumber());
        dto.setSaleDate(sale.getSaleDate());
        if (sale.getCashier() != null) {
            dto.setCashierId(sale.getCashier().getId());
            dto.setCashierName(sale.getCashier().getFullName());
        }
        dto.setCustomerName(sale.getCustomerName());
        dto.setCustomerPhone(sale.getCustomerPhone());
        dto.setSubtotal(sale.getSubtotal());
        dto.setDiscountAmount(sale.getDiscountAmount());
        dto.setTaxAmount(sale.getTaxAmount());
        dto.setTotalAmount(sale.getTotalAmount());
        dto.setPaymentMethod(sale.getPaymentMethod());
        dto.setPaymentStatus(sale.getPaymentStatus());
        dto.setAmountTendered(sale.getAmountTendered());
        dto.setChangeAmount(sale.getChangeAmount());
        dto.setNotes(sale.getNotes());

        if (sale.getItems() != null) {
            List<SaleItemResponseDTO> itemDTOs = sale.getItems().stream().map(item -> {
                SaleItemResponseDTO itemDTO = new SaleItemResponseDTO();
                itemDTO.setId(item.getId());
                if (item.getProduct() != null) {
                    itemDTO.setProductId(item.getProduct().getId());
                }
                itemDTO.setProductName(item.getProductName());
                itemDTO.setProductSku(item.getProductSku());
                itemDTO.setQuantity(item.getQuantity());
                itemDTO.setUnitPrice(item.getUnitPrice());
                itemDTO.setDiscountAmount(item.getDiscountAmount());
                itemDTO.setTaxRate(item.getTaxRate());
                itemDTO.setTaxAmount(item.getTaxAmount());
                itemDTO.setTotalPrice(item.getTotalPrice());
                return itemDTO;
            }).collect(Collectors.toList());
            dto.setItems(itemDTOs);
        }

        return dto;
    }
}

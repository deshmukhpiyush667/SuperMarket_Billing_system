package com.supermarket.billing.service;

import com.supermarket.billing.dto.StockAdjustmentRequestDTO;
import com.supermarket.billing.dto.StockMovementResponseDTO;
import com.supermarket.billing.entity.MovementType;
import com.supermarket.billing.entity.Product;
import com.supermarket.billing.entity.StockMovement;
import com.supermarket.billing.entity.User;
import com.supermarket.billing.exception.BadRequestException;
import com.supermarket.billing.exception.ResourceNotFoundException;
import com.supermarket.billing.repository.ProductRepository;
import com.supermarket.billing.repository.StockMovementRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final AuthService authService;

    public InventoryService(ProductRepository productRepository,
                            StockMovementRepository stockMovementRepository,
                            AuthService authService) {
        this.productRepository = productRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.authService = authService;
    }

    @Transactional
    public StockMovementResponseDTO adjustStock(StockAdjustmentRequestDTO request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + request.getProductId()));

        int oldStock = product.getStockQuantity();
        int change = request.getQuantityChanged();

        if (request.getMovementType() == MovementType.DAMAGE && change > 0) {
            change = -change; // damages reduce stock
        }

        int newStock = oldStock + change;
        if (newStock < 0) {
            throw new BadRequestException("Cannot reduce stock below zero. Current stock: " + oldStock + ", reduction: " + Math.abs(change));
        }

        product.setStockQuantity(newStock);
        productRepository.save(product);

        User currentUser = authService.getCurrentAuthenticatedUser();
        StockMovement movement = new StockMovement(
                product,
                request.getMovementType(),
                change,
                oldStock,
                newStock,
                request.getReferenceNumber() != null ? request.getReferenceNumber() : "MANUAL_ADJ",
                request.getReason(),
                currentUser
        );

        return mapToDTO(stockMovementRepository.save(movement));
    }

    public Page<StockMovementResponseDTO> getStockMovements(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("timestamp").descending());
        return stockMovementRepository.findAllByOrderByTimestampDesc(pageRequest).map(this::mapToDTO);
    }

    public List<StockMovementResponseDTO> getRecentMovements() {
        return stockMovementRepository.findTop50ByOrderByTimestampDesc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<StockMovementResponseDTO> getProductMovements(Long productId) {
        return stockMovementRepository.findByProductIdOrderByTimestampDesc(productId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private StockMovementResponseDTO mapToDTO(StockMovement movement) {
        StockMovementResponseDTO dto = new StockMovementResponseDTO();
        dto.setId(movement.getId());
        if (movement.getProduct() != null) {
            dto.setProductId(movement.getProduct().getId());
            dto.setProductName(movement.getProduct().getName());
            dto.setProductSku(movement.getProduct().getSku());
        }
        dto.setMovementType(movement.getMovementType());
        dto.setQuantityChanged(movement.getQuantityChanged());
        dto.setStockBefore(movement.getStockBefore());
        dto.setStockAfter(movement.getStockAfter());
        dto.setReferenceNumber(movement.getReferenceNumber());
        dto.setReason(movement.getReason());
        if (movement.getPerformedBy() != null) {
            dto.setPerformedByName(movement.getPerformedBy().getFullName());
        } else {
            dto.setPerformedByName("System");
        }
        dto.setTimestamp(movement.getTimestamp());
        return dto;
    }
}

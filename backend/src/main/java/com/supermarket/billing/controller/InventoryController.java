package com.supermarket.billing.controller;

import com.supermarket.billing.dto.ApiResponse;
import com.supermarket.billing.dto.StockAdjustmentRequestDTO;
import com.supermarket.billing.dto.StockMovementResponseDTO;
import com.supermarket.billing.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/adjust")
    public ResponseEntity<ApiResponse<StockMovementResponseDTO>> adjustStock(
            @Valid @RequestBody StockAdjustmentRequestDTO request) {
        StockMovementResponseDTO result = inventoryService.adjustStock(request);
        return ResponseEntity.ok(ApiResponse.success("Stock adjusted successfully", result));
    }

    @GetMapping("/movements")
    public ResponseEntity<ApiResponse<Page<StockMovementResponseDTO>>> getStockMovements(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Page<StockMovementResponseDTO> movements = inventoryService.getStockMovements(page, size);
        return ResponseEntity.ok(ApiResponse.success("Stock movements retrieved", movements));
    }

    @GetMapping("/movements/recent")
    public ResponseEntity<ApiResponse<List<StockMovementResponseDTO>>> getRecentMovements() {
        List<StockMovementResponseDTO> movements = inventoryService.getRecentMovements();
        return ResponseEntity.ok(ApiResponse.success("Recent movements", movements));
    }

    @GetMapping("/movements/product/{productId}")
    public ResponseEntity<ApiResponse<List<StockMovementResponseDTO>>> getProductMovements(@PathVariable Long productId) {
        List<StockMovementResponseDTO> movements = inventoryService.getProductMovements(productId);
        return ResponseEntity.ok(ApiResponse.success("Product stock movements", movements));
    }
}

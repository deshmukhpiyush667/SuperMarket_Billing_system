package com.supermarket.billing.controller;

import com.supermarket.billing.dto.ApiResponse;
import com.supermarket.billing.dto.SaleRequestDTO;
import com.supermarket.billing.dto.SaleResponseDTO;
import com.supermarket.billing.entity.SaleStatus;
import com.supermarket.billing.service.SaleService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    private final SaleService saleService;

    public SaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SaleResponseDTO>> processSale(@Valid @RequestBody SaleRequestDTO request) {
        SaleResponseDTO saleResponse = saleService.createSale(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Sale completed successfully", saleResponse));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<SaleResponseDTO>>> getSales(
            @RequestParam(required = false) String invoiceNumber,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) SaleStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        Page<SaleResponseDTO> sales = saleService.getSales(invoiceNumber, startDateTime, endDateTime, status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Sales retrieved", sales));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SaleResponseDTO>> getSaleById(@PathVariable Long id) {
        SaleResponseDTO sale = saleService.getSaleById(id);
        return ResponseEntity.ok(ApiResponse.success("Sale details", sale));
    }

    @GetMapping("/invoice/{invoiceNumber}")
    public ResponseEntity<ApiResponse<SaleResponseDTO>> getSaleByInvoice(@PathVariable String invoiceNumber) {
        SaleResponseDTO sale = saleService.getSaleByInvoice(invoiceNumber);
        return ResponseEntity.ok(ApiResponse.success("Invoice found", sale));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<SaleResponseDTO>> cancelSale(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        SaleResponseDTO cancelledSale = saleService.cancelSale(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Sale cancelled and inventory restocked successfully", cancelledSale));
    }
}

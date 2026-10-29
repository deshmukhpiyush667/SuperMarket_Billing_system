package com.supermarket.billing.controller;

import com.supermarket.billing.dto.ApiResponse;
import com.supermarket.billing.dto.DashboardSummaryDTO;
import com.supermarket.billing.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardSummaryDTO>> getDashboardSummary() {
        DashboardSummaryDTO summary = reportService.getDashboardSummary();
        return ResponseEntity.ok(ApiResponse.success("Dashboard metrics", summary));
    }
}

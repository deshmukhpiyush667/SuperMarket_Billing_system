package com.supermarket.billing.service;

import com.supermarket.billing.dto.*;
import com.supermarket.billing.entity.Sale;
import com.supermarket.billing.repository.ProductRepository;
import com.supermarket.billing.repository.SaleItemRepository;
import com.supermarket.billing.repository.SaleRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final SaleItemRepository saleItemRepository;
    private final SaleService saleService;

    public ReportService(SaleRepository saleRepository,
                         ProductRepository productRepository,
                         SaleItemRepository saleItemRepository,
                         SaleService saleService) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
        this.saleItemRepository = saleItemRepository;
        this.saleService = saleService;
    }

    public DashboardSummaryDTO getDashboardSummary() {
        DashboardSummaryDTO summary = new DashboardSummaryDTO();

        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime now = LocalDateTime.now();

        LocalDateTime weekStart = today.minusDays(6).atStartOfDay();
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();

        // Today metrics
        summary.setTodayRevenue(saleRepository.calculateRevenueBetween(todayStart, now));
        summary.setTodaySalesCount(saleRepository.countCompletedSalesBetween(todayStart, now));

        // Weekly metrics
        summary.setWeeklyRevenue(saleRepository.calculateRevenueBetween(weekStart, now));
        summary.setWeeklySalesCount(saleRepository.countCompletedSalesBetween(weekStart, now));

        // Monthly metrics
        summary.setMonthlyRevenue(saleRepository.calculateRevenueBetween(monthStart, now));
        summary.setMonthlySalesCount(saleRepository.countCompletedSalesBetween(monthStart, now));

        // Inventory counts
        summary.setLowStockCount(productRepository.countLowStockProducts());
        summary.setTotalActiveProducts(productRepository.countByActiveTrue());

        // Top 5 selling products (last 30 days)
        List<Object[]> topRows = saleItemRepository.findTopSellingProducts(today.minusDays(30).atStartOfDay(), PageRequest.of(0, 5));
        List<TopProductDTO> topProducts = new ArrayList<>();
        for (Object[] row : topRows) {
            Long prodId = ((Number) row[0]).longValue();
            String name = (String) row[1];
            String sku = (String) row[2];
            Long qty = ((Number) row[3]).longValue();
            BigDecimal rev = (BigDecimal) row[4];
            topProducts.add(new TopProductDTO(prodId, name, sku, qty, rev));
        }
        summary.setTopProducts(topProducts);

        // Weekly 7-day trend
        List<SalesTrendDTO> trend = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            LocalDateTime dayStart = d.atStartOfDay();
            LocalDateTime dayEnd = d.atTime(LocalTime.MAX);
            BigDecimal dayRev = saleRepository.calculateRevenueBetween(dayStart, dayEnd);
            long dayCount = saleRepository.countCompletedSalesBetween(dayStart, dayEnd);
            trend.add(new SalesTrendDTO(d.format(formatter), dayRev, dayCount));
        }
        summary.setWeeklyTrend(trend);

        // Recent 5 transactions
        List<Sale> recent = saleRepository.findRecentSales(today.minusDays(7).atStartOfDay());
        List<SaleResponseDTO> recentDTOs = recent.stream()
                .limit(5)
                .map(saleService::mapToDTO)
                .collect(Collectors.toList());
        summary.setRecentTransactions(recentDTOs);

        return summary;
    }
}

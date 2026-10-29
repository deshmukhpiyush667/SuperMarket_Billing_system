package com.supermarket.billing.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardSummaryDTO {
    private BigDecimal todayRevenue;
    private Long todaySalesCount;
    private BigDecimal weeklyRevenue;
    private Long weeklySalesCount;
    private BigDecimal monthlyRevenue;
    private Long monthlySalesCount;
    private Long lowStockCount;
    private Long totalActiveProducts;
    private List<TopProductDTO> topProducts;
    private List<SalesTrendDTO> weeklyTrend;
    private List<SaleResponseDTO> recentTransactions;

    public DashboardSummaryDTO() {}

    public BigDecimal getTodayRevenue() {
        return todayRevenue;
    }

    public void setTodayRevenue(BigDecimal todayRevenue) {
        this.todayRevenue = todayRevenue;
    }

    public Long getTodaySalesCount() {
        return todaySalesCount;
    }

    public void setTodaySalesCount(Long todaySalesCount) {
        this.todaySalesCount = todaySalesCount;
    }

    public BigDecimal getWeeklyRevenue() {
        return weeklyRevenue;
    }

    public void setWeeklyRevenue(BigDecimal weeklyRevenue) {
        this.weeklyRevenue = weeklyRevenue;
    }

    public Long getWeeklySalesCount() {
        return weeklySalesCount;
    }

    public void setWeeklySalesCount(Long weeklySalesCount) {
        this.weeklySalesCount = weeklySalesCount;
    }

    public BigDecimal getMonthlyRevenue() {
        return monthlyRevenue;
    }

    public void setMonthlyRevenue(BigDecimal monthlyRevenue) {
        this.monthlyRevenue = monthlyRevenue;
    }

    public Long getMonthlySalesCount() {
        return monthlySalesCount;
    }

    public void setMonthlySalesCount(Long monthlySalesCount) {
        this.monthlySalesCount = monthlySalesCount;
    }

    public Long getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(Long lowStockCount) {
        this.lowStockCount = lowStockCount;
    }

    public Long getTotalActiveProducts() {
        return totalActiveProducts;
    }

    public void setTotalActiveProducts(Long totalActiveProducts) {
        this.totalActiveProducts = totalActiveProducts;
    }

    public List<TopProductDTO> getTopProducts() {
        return topProducts;
    }

    public void setTopProducts(List<TopProductDTO> topProducts) {
        this.topProducts = topProducts;
    }

    public List<SalesTrendDTO> getWeeklyTrend() {
        return weeklyTrend;
    }

    public void setWeeklyTrend(List<SalesTrendDTO> weeklyTrend) {
        this.weeklyTrend = weeklyTrend;
    }

    public List<SaleResponseDTO> getRecentTransactions() {
        return recentTransactions;
    }

    public void setRecentTransactions(List<SaleResponseDTO> recentTransactions) {
        this.recentTransactions = recentTransactions;
    }
}

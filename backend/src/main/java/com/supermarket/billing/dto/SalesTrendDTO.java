package com.supermarket.billing.dto;

import java.math.BigDecimal;

public class SalesTrendDTO {
    private String date; // YYYY-MM-DD
    private BigDecimal revenue;
    private Long orderCount;

    public SalesTrendDTO() {}

    public SalesTrendDTO(String date, BigDecimal revenue, Long orderCount) {
        this.date = date;
        this.revenue = revenue;
        this.orderCount = orderCount;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public void setRevenue(BigDecimal revenue) {
        this.revenue = revenue;
    }

    public Long getOrderCount() {
        return orderCount;
    }

    public void setOrderCount(Long orderCount) {
        this.orderCount = orderCount;
    }
}

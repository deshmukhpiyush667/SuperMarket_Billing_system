package com.supermarket.billing.repository;

import com.supermarket.billing.entity.SaleItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {

    @Query("SELECT si.product.id AS productId, si.productName AS productName, si.productSku AS productSku, " +
           "SUM(si.quantity) AS totalQuantitySold, SUM(si.totalPrice) AS totalRevenue " +
           "FROM SaleItem si WHERE si.sale.paymentStatus = 'COMPLETED' " +
           "AND (:startDate IS NULL OR si.sale.saleDate >= :startDate) " +
           "GROUP BY si.product.id, si.productName, si.productSku " +
           "ORDER BY SUM(si.quantity) DESC")
    List<Object[]> findTopSellingProducts(@Param("startDate") LocalDateTime startDate, Pageable pageable);
}

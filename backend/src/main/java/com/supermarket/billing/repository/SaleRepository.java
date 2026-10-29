package com.supermarket.billing.repository;

import com.supermarket.billing.entity.Sale;
import com.supermarket.billing.entity.SaleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    Optional<Sale> findByInvoiceNumber(String invoiceNumber);

    boolean existsByInvoiceNumber(String invoiceNumber);

    @Query("SELECT s FROM Sale s WHERE " +
           "(:invoiceNumber IS NULL OR LOWER(s.invoiceNumber) LIKE LOWER(CONCAT('%', :invoiceNumber, '%'))) " +
           "AND (:startDate IS NULL OR s.saleDate >= :startDate) " +
           "AND (:endDate IS NULL OR s.saleDate <= :endDate) " +
           "AND (:status IS NULL OR s.paymentStatus = :status) " +
           "ORDER BY s.saleDate DESC")
    Page<Sale> filterSales(@Param("invoiceNumber") String invoiceNumber,
                           @Param("startDate") LocalDateTime startDate,
                           @Param("endDate") LocalDateTime endDate,
                           @Param("status") SaleStatus status,
                           Pageable pageable);

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s WHERE s.saleDate >= :startDate AND s.saleDate <= :endDate AND s.paymentStatus = 'COMPLETED'")
    BigDecimal calculateRevenueBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.saleDate >= :startDate AND s.saleDate <= :endDate AND s.paymentStatus = 'COMPLETED'")
    long countCompletedSalesBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT s FROM Sale s WHERE s.saleDate >= :startDate ORDER BY s.saleDate DESC")
    List<Sale> findRecentSales(@Param("startDate") LocalDateTime startDate);
}

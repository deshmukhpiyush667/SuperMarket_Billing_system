package com.supermarket.billing.repository;

import com.supermarket.billing.entity.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    Page<StockMovement> findAllByOrderByTimestampDesc(Pageable pageable);
    List<StockMovement> findTop50ByOrderByTimestampDesc();
    List<StockMovement> findByProductIdOrderByTimestampDesc(Long productId);
}

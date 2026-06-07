package com.lera.academy_service.repository;

import com.lera.academy_service.entity.BookstoreProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface BookstoreProductRepository extends JpaRepository<BookstoreProduct, UUID> {
    List<BookstoreProduct> findAllByOrderByNameAsc();
    List<BookstoreProduct> findByCategoryOrderByNameAsc(String category);
    List<BookstoreProduct> findByActiveTrueOrderByNameAsc();

    @Query("SELECT DISTINCT p.category FROM BookstoreProduct p WHERE p.category IS NOT NULL ORDER BY p.category")
    List<String> distinctCategories();

    long countByStockLessThan(int threshold);
}

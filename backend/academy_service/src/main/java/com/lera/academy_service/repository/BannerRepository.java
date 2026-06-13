package com.lera.academy_service.repository;

import com.lera.academy_service.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface BannerRepository extends JpaRepository<Banner, UUID> {
    
    List<Banner> findByIsActiveTrueOrderByDisplayOrderAsc();
    
    List<Banner> findByPositionAndIsActiveTrueOrderByDisplayOrderAsc(String position);
    
    List<Banner> findByPositionOrderByDisplayOrderAsc(String position);
}

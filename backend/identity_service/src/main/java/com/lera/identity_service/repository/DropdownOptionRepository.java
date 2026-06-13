package com.lera.identity_service.repository;

import com.lera.identity_service.entity.DropdownOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DropdownOptionRepository extends JpaRepository<DropdownOption, UUID> {
    List<DropdownOption> findByCategoryOrderBySortOrderAsc(String category);
    List<DropdownOption> findAllByOrderByCategoryAscSortOrderAsc();
}

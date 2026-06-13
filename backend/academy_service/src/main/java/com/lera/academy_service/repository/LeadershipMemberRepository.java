package com.lera.academy_service.repository;

import com.lera.academy_service.entity.LeadershipMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LeadershipMemberRepository extends JpaRepository<LeadershipMember, UUID> {
    
    List<LeadershipMember> findByIsActiveTrueOrderByDisplayOrderAsc();
    
    List<LeadershipMember> findAllByOrderByDisplayOrderAsc();
}

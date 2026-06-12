package com.lera.identity_service.repository;

import com.lera.identity_service.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    Optional<User> findByEmail(String email);

    /** Case-insensitive match — login emails often differ by casing from stored rows. */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(:email))")
    Optional<User> findByEmailWithRoleIgnoreCase(@Param("email") String email);
    
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role WHERE u.email = :email")
    Optional<User> findByEmailWithRole(String email);
    
    Optional<User> findByPhone(String phone);
    
    boolean existsByEmail(String email);
    
    List<User> findByCenterId(UUID centerId);
    
    List<User> findByRoleId(UUID roleId);
    
    long countByRoleId(UUID roleId);
    
    int countByReportsTo(UUID reportsTo);
    
    List<User> findByStatus(String status);
    
    @Query("SELECT u FROM User u WHERE u.centerId = :centerId AND u.roleId = :roleId")
    List<User> findByCenterAndRole(UUID centerId, UUID roleId);
    
    @Query("SELECT u FROM User u WHERE LOWER(u.fullname) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<User> searchUsers(String search);

    @Query("SELECT u FROM User u WHERE u.centerId = :centerId AND (LOWER(u.fullname) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<User> searchUsersInCenter(@Param("centerId") UUID centerId, @Param("search") String search);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role LEFT JOIN FETCH u.center LEFT JOIN FETCH u.department LEFT JOIN FETCH u.manager")
    List<User> findAllWithRelations();

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role LEFT JOIN FETCH u.center LEFT JOIN FETCH u.department LEFT JOIN FETCH u.manager WHERE u.centerId = :centerId")
    List<User> findByCenterIdWithRelations(UUID centerId);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role LEFT JOIN FETCH u.center LEFT JOIN FETCH u.department LEFT JOIN FETCH u.manager WHERE u.id = :id")
    Optional<User> findByIdWithRelations(UUID id);
    
    // Methods for center profile - queries by role name
    @Query("SELECT COUNT(u) FROM User u JOIN u.role r WHERE u.centerId = :centerId AND r.name = :roleName")
    long countByCenterIdAndRoleName(UUID centerId, String roleName);
    
    @Query("SELECT u FROM User u JOIN u.role r WHERE u.centerId = :centerId AND r.name = :roleName")
    List<User> findByCenterIdAndRoleName(UUID centerId, String roleName);

    List<User> findByApprovalStatus(String approvalStatus);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role LEFT JOIN FETCH u.center WHERE u.approvalStatus = :approvalStatus")
    List<User> findByApprovalStatusWithRelations(String approvalStatus);
}

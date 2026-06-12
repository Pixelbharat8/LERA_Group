package com.lera.academy_service.repository;

import com.lera.academy_service.entity.TransportRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransportRouteRepository extends JpaRepository<TransportRoute, String> {
    Optional<TransportRoute> findByRouteCode(String routeCode);
    List<TransportRoute> findByIsActive(Boolean isActive);
    List<TransportRoute> findByRouteType(String routeType);
}

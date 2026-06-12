package com.lera.academy_service.dto;

import java.util.UUID;

/** Minimal student row for service-to-service lookups (Connect → Academy). */
public record InternalStudentRef(UUID id, UUID userId, UUID centerId) {}

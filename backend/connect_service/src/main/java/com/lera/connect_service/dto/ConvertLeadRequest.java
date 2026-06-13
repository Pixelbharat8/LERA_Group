package com.lera.connect_service.dto;

import lombok.Data;

import java.util.UUID;

/** Optional body for {@code PUT /api/leads/{id}/convert} to link a new student and import placement. */
@Data
public class ConvertLeadRequest {
    private UUID studentId;
}

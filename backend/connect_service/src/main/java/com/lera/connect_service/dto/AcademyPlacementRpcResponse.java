package com.lera.connect_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * JSON body from Academy {@code POST /api/internal/student-skill-levels/placement-record}.
 * Other fields (e.g. skillLevel) are ignored.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class AcademyPlacementRpcResponse {

    private boolean updatedExisting;
}

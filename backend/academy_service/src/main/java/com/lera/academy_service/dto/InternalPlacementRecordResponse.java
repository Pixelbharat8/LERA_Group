package com.lera.academy_service.dto;

import com.lera.academy_service.entity.StudentSkillLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response for {@code POST /api/internal/student-skill-levels/placement-record}
 * so Connect can report whether an existing lead-import row was updated.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternalPlacementRecordResponse {

    private StudentSkillLevel skillLevel;

    /** True when a prior import for the same (student, sourceLeadId) was updated. */
    private boolean updatedExisting;
}

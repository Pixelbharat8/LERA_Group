package com.lera.attendance_service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class ClassSessionSyncRequest {

    @NotNull
    private UUID classSessionId;

    @NotNull
    private UUID classId;

    private UUID teacherId;

    private UUID centerId;

    @NotNull
    private LocalDate sessionDate;

    private LocalTime startTime;

    private LocalTime endTime;

    @Valid
    private List<StudentAttendanceSync> attendance;
}

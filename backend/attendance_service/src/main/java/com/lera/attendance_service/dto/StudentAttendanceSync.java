package com.lera.attendance_service.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Data;

@Data
public class StudentAttendanceSync {

    @NotNull
    private UUID studentId;

    @NotNull
    private String status;
}

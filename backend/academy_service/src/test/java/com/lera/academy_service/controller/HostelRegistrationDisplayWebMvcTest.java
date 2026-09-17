package com.lera.academy_service.controller;

import com.lera.academy_service.entity.HostelRegistration;
import com.lera.academy_service.entity.HostelRoom;
import com.lera.academy_service.model.GlobalExceptionHandler;
import com.lera.academy_service.repository.HostelRegistrationRepository;
import com.lera.academy_service.repository.HostelRoomRepository;
import com.lera.academy_service.testsupport.WebMvcMethodSecurityTestConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The student's hostel card shows a room number, a room type, a monthly fee and a check-in date.
 * A HostelRegistration row has none of them — it holds roomId and joinDate — so the card used to
 * render a blank room, "Invalid Date" out of new Date(undefined) and "NaN ₫" out of formatting a
 * missing number.
 *
 * The status mattered most: rows hold PENDING / APPROVED / REJECTED while the card compared
 * against "active", so an approved registration displayed as "Pending" and so did a rejected one.
 *
 * Exercised as TEACHER, not STUDENT: HostelController is annotated AcademyRoles.STAFF at class
 * level, which does not include STUDENT — so despite its name, /my-registration 403s for the
 * student whose registration it is. The hostel page is staff-only today, so nothing is broken by
 * it; widening that annotation is an authorization decision and is deliberately not made here.
 */
@WebMvcTest(controllers = HostelController.class)
@Import({ WebMvcMethodSecurityTestConfig.class, GlobalExceptionHandler.class })
class HostelRegistrationDisplayWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean private HostelRoomRepository rooms;
    @MockBean private HostelRegistrationRepository registrations;
    @MockBean private com.lera.academy_service.security.AcademyAuthorizationService authz;

    private static final UUID STUDENT_ID = UUID.randomUUID();
    private static final UUID ROOM_ID = UUID.randomUUID();

    private HostelRegistration registration(String storedStatus, LocalDate joinDate) {
        HostelRegistration reg = new HostelRegistration();
        reg.setId(UUID.randomUUID());
        reg.setStudentId(STUDENT_ID);
        reg.setRoomId(ROOM_ID);
        reg.setStatus(storedStatus);
        reg.setJoinDate(joinDate);
        return reg;
    }

    private void seedRoom() {
        HostelRoom room = new HostelRoom();
        room.setId(ROOM_ID);
        room.setRoomNumber("B2-104");
        room.setType("double");
        room.setMonthlyRent(new BigDecimal("2500000"));
        when(rooms.findById(ROOM_ID)).thenReturn(Optional.of(room));
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    void approvedRegistration_carriesTheRoomDetailsAndReadsAsActive() throws Exception {
        seedRoom();
        when(registrations.findByStudentIdOrderByCreatedAtDesc(STUDENT_ID))
                .thenReturn(List.of(registration("APPROVED", LocalDate.of(2026, 9, 1))));

        mockMvc.perform(get("/api/hostel/my-registration").param("studentId", STUDENT_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomNumber").value("B2-104"))
                .andExpect(jsonPath("$.roomType").value("double"))
                .andExpect(jsonPath("$.monthlyFee").value(2500000))
                .andExpect(jsonPath("$.checkInDate").value("2026-09-01"))
                .andExpect(jsonPath("$.status").value("active"))
                // the stored value stays available for anything that needs it
                .andExpect(jsonPath("$.rawStatus").value("APPROVED"));
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    void rejectedRegistration_doesNotMasqueradeAsPending() throws Exception {
        seedRoom();
        when(registrations.findByStudentIdOrderByCreatedAtDesc(STUDENT_ID))
                .thenReturn(List.of(registration("REJECTED", null)));

        mockMvc.perform(get("/api/hostel/my-registration").param("studentId", STUDENT_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("rejected"))
                // never approved, so there is no check-in date to show — and null must reach the
                // page, because new Date(null) is the epoch and renders as 1 Jan 1970.
                .andExpect(jsonPath("$.checkInDate").doesNotExist());
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    void pendingRegistration_readsAsPending() throws Exception {
        seedRoom();
        when(registrations.findByStudentIdOrderByCreatedAtDesc(STUDENT_ID))
                .thenReturn(List.of(registration("PENDING", null)));

        mockMvc.perform(get("/api/hostel/my-registration").param("studentId", STUDENT_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("pending"));
    }
}

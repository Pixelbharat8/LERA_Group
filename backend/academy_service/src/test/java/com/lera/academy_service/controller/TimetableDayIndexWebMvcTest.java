package com.lera.academy_service.controller;

import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.model.GlobalExceptionHandler;
import com.lera.academy_service.repository.ClassRepository;
import com.lera.academy_service.testsupport.WebMvcMethodSecurityTestConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * A class stores its days as the codes the class form writes: "MON,WED,FRI". The timetable grid
 * places each entry by a day INDEX (0 = Sunday ... 6 = Saturday) and compared that number against
 * the string, which never matched — so the entire week rendered empty, and so did "today's
 * classes" and the next-class banner, for a centre with a full schedule.
 */
@WebMvcTest(controllers = TimetableController.class)
@Import({ WebMvcMethodSecurityTestConfig.class, GlobalExceptionHandler.class })
class TimetableDayIndexWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean private ClassRepository classRepository;
    @MockBean private com.lera.academy_service.security.AcademyAuthorizationService authz;

    private ClassEntity scheduled(String days) {
        ClassEntity c = new ClassEntity();
        c.setId(UUID.randomUUID());
        c.setName("IELTS Foundation");
        c.setRoom("A201");
        c.setScheduleDays(days);
        c.setScheduleTimeStart(LocalTime.of(18, 0));
        c.setScheduleTimeEnd(LocalTime.of(19, 30));
        return c;
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    void storedDayCodes_becomeTheIndexTheGridPlacesBy() throws Exception {
        when(authz.effectiveListCenterId(null)).thenReturn(null);
        when(classRepository.findByStatus("OPEN")).thenReturn(List.of(scheduled("MON,WED,FRI")));

        mockMvc.perform(get("/api/timetable/my-schedule"))
                .andExpect(status().isOk())
                // one entry per scheduled day, each carrying its index
                .andExpect(jsonPath("$[0].day").value("MON"))
                .andExpect(jsonPath("$[0].dayIndex").value(1))
                .andExpect(jsonPath("$[1].dayIndex").value(3))
                .andExpect(jsonPath("$[2].dayIndex").value(5))
                .andExpect(jsonPath("$[0].startTime").value("18:00"));
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    void fullDayNames_resolveToo_andSundayIsZero() throws Exception {
        when(authz.effectiveListCenterId(null)).thenReturn(null);
        when(classRepository.findByStatus("OPEN")).thenReturn(List.of(scheduled("Sunday,Saturday")));

        mockMvc.perform(get("/api/timetable/my-schedule"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].dayIndex").value(0))
                .andExpect(jsonPath("$[1].dayIndex").value(6));
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    void anUnreadableDay_reportsNoIndexRatherThanGuessing() throws Exception {
        when(authz.effectiveListCenterId(null)).thenReturn(null);
        // a bare "T" could be Tuesday or Thursday; filing it under either would be a fabrication
        when(classRepository.findByStatus("OPEN")).thenReturn(List.of(scheduled("T")));

        mockMvc.perform(get("/api/timetable/my-schedule"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].dayIndex").doesNotExist());
    }
}

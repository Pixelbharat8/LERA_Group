package com.lera.academy_service.controller;

import com.lera.academy_service.entity.StudentTransport;
import com.lera.academy_service.entity.TransportDriver;
import com.lera.academy_service.entity.TransportRoute;
import com.lera.academy_service.entity.TransportSchedule;
import com.lera.academy_service.entity.Vehicle;
import com.lera.academy_service.model.GlobalExceptionHandler;
import com.lera.academy_service.repository.StudentTransportRepository;
import com.lera.academy_service.repository.TransportDriverRepository;
import com.lera.academy_service.repository.TransportRouteRepository;
import com.lera.academy_service.repository.TransportScheduleRepository;
import com.lera.academy_service.repository.VehicleRepository;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The routes page reads name / startPoint / endPoint / departureTime / arrivalTime / driver /
 * vehicle / capacity / enrolled off each route. A TransportRoute row has NONE of those: it holds
 * routeName, startLocation and endLocation, while the times sit on TransportSchedule, the driver
 * and vehicle on what that schedule assigns, and the seats taken are a count of StudentTransport.
 *
 * So the endpoint used to return the bare entity and every card rendered blank, with the seats
 * bar computing undefined/undefined = NaN% and the Register button never disabling because
 * `undefined >= undefined` is false. These assertions pin the resolved shape the page needs.
 */
@WebMvcTest(controllers = TransportController.class)
@Import({ WebMvcMethodSecurityTestConfig.class, GlobalExceptionHandler.class })
class TransportRouteDisplayWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean private TransportRouteRepository transportRouteRepository;
    @MockBean private VehicleRepository vehicleRepository;
    @MockBean private TransportDriverRepository transportDriverRepository;
    @MockBean private StudentTransportRepository studentTransportRepository;
    @MockBean private TransportScheduleRepository transportScheduleRepository;
    @MockBean private com.lera.academy_service.security.AcademyAuthorizationService authz;

    private static final UUID ROUTE_ID = UUID.randomUUID();
    private static final UUID VEHICLE_ID = UUID.randomUUID();
    private static final UUID DRIVER_ID = UUID.randomUUID();

    private void seedRoute() {
        TransportRoute route = new TransportRoute();
        route.setId(ROUTE_ID.toString());
        route.setRouteCode("R-01");
        route.setRouteName("Lê Chân — Ngô Quyền");
        route.setStartLocation("Lê Chân");
        route.setEndLocation("Ngô Quyền");
        route.setIsActive(true);

        TransportSchedule schedule = new TransportSchedule();
        schedule.setRouteId(ROUTE_ID);
        schedule.setVehicleId(VEHICLE_ID);
        schedule.setDriverId(DRIVER_ID);
        schedule.setStartTime(LocalTime.of(7, 30));
        schedule.setEndTime(LocalTime.of(8, 15));
        schedule.setIsActive(true);

        Vehicle vehicle = new Vehicle();
        vehicle.setId(VEHICLE_ID);
        vehicle.setVehicleNumber("15A-123.45");
        vehicle.setCapacity(30);

        TransportDriver driver = new TransportDriver();
        driver.setId(DRIVER_ID);
        driver.setFullname("Nguyễn Văn An");
        driver.setPhone("0912345678");

        when(transportRouteRepository.findByIsActive(true)).thenReturn(List.of(route));
        when(transportScheduleRepository.findAll()).thenReturn(List.of(schedule));
        when(vehicleRepository.findAllById(any())).thenReturn(List.of(vehicle));
        when(transportDriverRepository.findAllById(any())).thenReturn(List.of(driver));
    }

    /** Two ACTIVE registrations and one cancelled: only the live ones take a seat. */
    private void seedRegistrations() {
        StudentTransport active1 = new StudentTransport();
        active1.setRouteId(ROUTE_ID);
        active1.setStatus("ACTIVE");
        StudentTransport active2 = new StudentTransport();
        active2.setRouteId(ROUTE_ID);
        active2.setStatus("ACTIVE");
        StudentTransport cancelled = new StudentTransport();
        cancelled.setRouteId(ROUTE_ID);
        cancelled.setStatus("INACTIVE");
        when(studentTransportRepository.findAll()).thenReturn(List.of(active1, active2, cancelled));
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    void activeRoutes_carryEveryFieldThePageRenders() throws Exception {
        seedRoute();
        seedRegistrations();

        mockMvc.perform(get("/api/transport/routes/active"))
                .andExpect(status().isOk())
                // straight renames off the route row
                .andExpect(jsonPath("$[0].name").value("Lê Chân — Ngô Quyền"))
                .andExpect(jsonPath("$[0].startPoint").value("Lê Chân"))
                .andExpect(jsonPath("$[0].endPoint").value("Ngô Quyền"))
                .andExpect(jsonPath("$[0].status").value("active"))
                // resolved from the route's schedule
                .andExpect(jsonPath("$[0].departureTime").value("07:30:00"))
                .andExpect(jsonPath("$[0].arrivalTime").value("08:15:00"))
                // resolved from what that schedule assigns
                .andExpect(jsonPath("$[0].driver").value("Nguyễn Văn An"))
                .andExpect(jsonPath("$[0].vehicle").value("15A-123.45"))
                .andExpect(jsonPath("$[0].capacity").value(30))
                // counted, and only the live registrations count
                .andExpect(jsonPath("$[0].enrolled").value(2));
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    void routeWithNoSchedule_reportsNullsAndZero_notABlankEntity() throws Exception {
        TransportRoute orphan = new TransportRoute();
        orphan.setId(UUID.randomUUID().toString());
        orphan.setRouteName("Unassigned run");
        orphan.setStartLocation("Depot");
        orphan.setEndLocation("Depot");
        orphan.setIsActive(false);
        when(transportRouteRepository.findByIsActive(true)).thenReturn(List.of(orphan));
        when(transportScheduleRepository.findAll()).thenReturn(List.of());
        when(studentTransportRepository.findAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/transport/routes/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Unassigned run"))
                // no vehicle assigned means no capacity to compare against — the page must get a
                // real null here rather than a number it can divide by.
                .andExpect(jsonPath("$[0].capacity").doesNotExist())
                .andExpect(jsonPath("$[0].driver").doesNotExist())
                .andExpect(jsonPath("$[0].enrolled").value(0))
                .andExpect(jsonPath("$[0].status").value("inactive"));
    }
}

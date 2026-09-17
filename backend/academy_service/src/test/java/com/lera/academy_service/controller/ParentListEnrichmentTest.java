package com.lera.academy_service.controller;

import com.lera.academy_service.entity.ParentProfile;
import com.lera.academy_service.repository.ParentProfileRepository;
import com.lera.academy_service.repository.StudentParentRepository;
import com.lera.academy_service.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;

import java.sql.ResultSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * A ParentProfile holds occupation, company and notes, plus the userId linking it to the person.
 * The name, email and phone are on the USER record. The admin parents list rendered all of them
 * off the profile, so every parent showed as a blank row — no name, no email, no phone.
 */
@ExtendWith(MockitoExtension.class)
class ParentListEnrichmentTest {

    @Mock private ParentProfileRepository parentProfileRepository;
    @Mock private StudentParentRepository studentParentRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private JdbcTemplate jdbcTemplate;
    @InjectMocks private ParentProfileController controller;

    private static final UUID PROFILE_ID = UUID.randomUUID();
    private static final UUID USER_ID = UUID.randomUUID();

    private ParentProfile profile() {
        ParentProfile p = new ParentProfile();
        p.setId(PROFILE_ID);
        p.setUserId(USER_ID);
        p.setOccupation("Engineer");
        return p;
    }

    /** Stand in for the two lookups: the user row, then the children count. */
    private void stubLookups(String fullname, String email, String phone, int children) {
        doAnswer(inv -> {
            String sql = inv.getArgument(0);
            RowCallbackHandler handler = inv.getArgument(1);
            ResultSet rs = mock(ResultSet.class);
            if (sql.contains("FROM users")) {
                when(rs.getObject("id", UUID.class)).thenReturn(USER_ID);
                when(rs.getString("fullname")).thenReturn(fullname);
                when(rs.getString("email")).thenReturn(email);
                when(rs.getString("phone")).thenReturn(phone);
                when(rs.getString("status")).thenReturn("ACTIVE");
            } else {
                when(rs.getObject("parent_id", UUID.class)).thenReturn(USER_ID);
                when(rs.getInt("n")).thenReturn(children);
            }
            handler.processRow(rs);
            return null;
        }).when(jdbcTemplate).query(anyString(), any(RowCallbackHandler.class), any(Object[].class));
    }

    @Test
    void theListCarriesTheParentsNameEmailAndPhone() {
        Page<ParentProfile> page = new PageImpl<>(List.of(profile()));
        when(parentProfileRepository.findAll(any(PageRequest.class))).thenReturn(page);
        stubLookups("Trần Thị Mai", "mai@example.com", "0912 345 678", 2);

        Map<String, Object> row = controller.getAllParents(PageRequest.of(0, 20)).getBody().get(0);

        assertEquals("Trần Thị Mai", row.get("fullName"),
                "the name lives on the user record and has to be resolved onto the row");
        assertEquals("mai@example.com", row.get("email"));
        assertEquals("0912 345 678", row.get("phone"));
        assertEquals(2, row.get("childrenCount"), "counted from student_parents");
        assertEquals("Engineer", row.get("occupation"), "profile fields still come from the profile");
        assertEquals(USER_ID, row.get("userId"), "the page needs this to save contact details back");
    }

    @Test
    void aProfileWithNoUserStillListsRatherThanFailing() {
        ParentProfile orphan = profile();
        orphan.setUserId(null);
        when(parentProfileRepository.findAll(any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(orphan)));

        Map<String, Object> row = controller.getAllParents(PageRequest.of(0, 20)).getBody().get(0);

        assertNull(row.get("fullName"));
        assertEquals(0, row.get("childrenCount"));
        verifyNoInteractions(jdbcTemplate);
    }
}

package com.lera.connect_service.service;

import com.lera.connect_service.entity.LeadAssignment;
import com.lera.connect_service.repository.LeadAssignmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeadAssignmentServiceTest {

    @Mock
    private LeadAssignmentRepository leadAssignmentRepository;

    @InjectMocks
    private LeadAssignmentService leadAssignmentService;

    @Test
    void getAll_returnsPage() {
        Page<LeadAssignment> page = new PageImpl<>(List.of(new LeadAssignment()));
        when(leadAssignmentRepository.findAll(any(PageRequest.class))).thenReturn(page);
        assertEquals(1, leadAssignmentService.getAll(PageRequest.of(0, 10)).getTotalElements());
    }

    @Test
    void getByLeadId_returnsList() {
        UUID leadId = UUID.randomUUID();
        when(leadAssignmentRepository.findByLeadId(leadId)).thenReturn(List.of(new LeadAssignment()));
        assertEquals(1, leadAssignmentService.getByLeadId(leadId).size());
    }

    @Test
    void getByAssignedTo_returnsList() {
        UUID userId = UUID.randomUUID();
        when(leadAssignmentRepository.findByAssignedTo(userId)).thenReturn(List.of(new LeadAssignment()));
        assertEquals(1, leadAssignmentService.getByAssignedTo(userId).size());
    }

    @Test
    void create_saves() {
        LeadAssignment a = new LeadAssignment();
        a.setLeadId(UUID.randomUUID());
        when(leadAssignmentRepository.save(any())).thenReturn(a);
        assertNotNull(leadAssignmentService.create(a));
    }

    @Test
    void delete_exists() {
        UUID id = UUID.randomUUID();
        when(leadAssignmentRepository.existsById(id)).thenReturn(true);
        assertTrue(leadAssignmentService.delete(id));
        verify(leadAssignmentRepository).deleteById(id);
    }

    @Test
    void delete_notExists() {
        when(leadAssignmentRepository.existsById(any())).thenReturn(false);
        assertFalse(leadAssignmentService.delete(UUID.randomUUID()));
    }
}

package com.lera.connect_service.service;

import com.lera.connect_service.entity.Lead;
import com.lera.connect_service.repository.LeadRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeadServiceTest {

    @Mock
    private LeadRepository leadRepository;

    @InjectMocks
    private LeadService leadService;

    private Lead testLead;
    private UUID leadId;

    @BeforeEach
    void setUp() {
        leadId = UUID.randomUUID();
        testLead = new Lead();
        testLead.setId(leadId);
        testLead.setParentName("Nguyen Van A");
    }

    @Test
    void getAll_shouldReturnList() {
        when(leadRepository.findAll()).thenReturn(List.of(testLead));
        List<Lead> result = leadService.getAll();
        assertEquals(1, result.size());
    }

    @Test
    void getAll_paginated_shouldReturnPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Lead> page = new PageImpl<>(List.of(testLead), pageable, 1);
        when(leadRepository.findAll(pageable)).thenReturn(page);

        Page<Lead> result = leadService.getAll(pageable);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void getById_shouldReturnLead() {
        when(leadRepository.findById(leadId)).thenReturn(Optional.of(testLead));
        assertTrue(leadService.getById(leadId).isPresent());
    }

    @Test
    void getById_notFound() {
        UUID id = UUID.randomUUID();
        when(leadRepository.findById(id)).thenReturn(Optional.empty());
        assertFalse(leadService.getById(id).isPresent());
    }

    @Test
    void create_shouldSaveLead() {
        when(leadRepository.save(any(Lead.class))).thenReturn(testLead);
        Lead result = leadService.create(testLead);
        assertNotNull(result);
        verify(leadRepository).save(testLead);
    }

    @Test
    void update_shouldReturnUpdated() {
        Lead details = new Lead();
        details.setParentName("Updated");
        when(leadRepository.findById(leadId)).thenReturn(Optional.of(testLead));
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<Lead> result = leadService.update(leadId, details);
        assertTrue(result.isPresent());
    }

    @Test
    void update_notFound() {
        UUID id = UUID.randomUUID();
        when(leadRepository.findById(id)).thenReturn(Optional.empty());
        assertFalse(leadService.update(id, new Lead()).isPresent());
    }

    @Test
    void delete_shouldReturnTrue() {
        when(leadRepository.existsById(leadId)).thenReturn(true);
        assertTrue(leadService.delete(leadId));
        verify(leadRepository).deleteById(leadId);
    }

    @Test
    void delete_notFound() {
        UUID id = UUID.randomUUID();
        when(leadRepository.existsById(id)).thenReturn(false);
        assertFalse(leadService.delete(id));
        verify(leadRepository, never()).deleteById(any());
    }
}

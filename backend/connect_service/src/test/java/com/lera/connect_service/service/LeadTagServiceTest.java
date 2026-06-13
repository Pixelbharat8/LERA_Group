package com.lera.connect_service.service;

import com.lera.connect_service.entity.LeadTag;
import com.lera.connect_service.repository.LeadTagRepository;
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
class LeadTagServiceTest {

    @Mock
    private LeadTagRepository leadTagRepository;

    @InjectMocks
    private LeadTagService leadTagService;

    @Test
    void getAll_returnsPage() {
        Page<LeadTag> page = new PageImpl<>(List.of(new LeadTag()));
        when(leadTagRepository.findAll(any(PageRequest.class))).thenReturn(page);
        assertEquals(1, leadTagService.getAll(PageRequest.of(0, 10)).getTotalElements());
    }

    @Test
    void getById_found() {
        UUID id = UUID.randomUUID();
        LeadTag tag = new LeadTag();
        tag.setId(id);
        when(leadTagRepository.findById(id)).thenReturn(Optional.of(tag));
        assertTrue(leadTagService.getById(id).isPresent());
    }

    @Test
    void getById_notFound() {
        when(leadTagRepository.findById(any())).thenReturn(Optional.empty());
        assertTrue(leadTagService.getById(UUID.randomUUID()).isEmpty());
    }

    @Test
    void create_saves() {
        LeadTag tag = new LeadTag();
        tag.setTagName("Hot");
        when(leadTagRepository.save(any())).thenReturn(tag);
        assertEquals("Hot", leadTagService.create(tag).getTagName());
    }

    @Test
    void update_found() {
        UUID id = UUID.randomUUID();
        LeadTag existing = new LeadTag();
        existing.setId(id);
        existing.setTagName("Old");
        LeadTag details = new LeadTag();
        details.setTagName("New");
        when(leadTagRepository.findById(id)).thenReturn(Optional.of(existing));
        when(leadTagRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        Optional<LeadTag> result = leadTagService.update(id, details);
        assertTrue(result.isPresent());
        assertEquals("New", result.get().getTagName());
    }

    @Test
    void delete_exists() {
        UUID id = UUID.randomUUID();
        when(leadTagRepository.existsById(id)).thenReturn(true);
        assertTrue(leadTagService.delete(id));
        verify(leadTagRepository).deleteById(id);
    }

    @Test
    void delete_notExists() {
        when(leadTagRepository.existsById(any())).thenReturn(false);
        assertFalse(leadTagService.delete(UUID.randomUUID()));
    }
}

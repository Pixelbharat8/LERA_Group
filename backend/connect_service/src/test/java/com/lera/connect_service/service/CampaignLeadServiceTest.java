package com.lera.connect_service.service;

import com.lera.connect_service.entity.CampaignLead;
import com.lera.connect_service.repository.CampaignLeadRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CampaignLeadServiceTest {

    @Mock
    private CampaignLeadRepository campaignLeadRepository;

    @InjectMocks
    private CampaignLeadService campaignLeadService;

    @Test
    void getAll_returnsPage() {
        Page<CampaignLead> page = new PageImpl<>(List.of(new CampaignLead()));
        when(campaignLeadRepository.findAll(any(PageRequest.class))).thenReturn(page);
        assertEquals(1, campaignLeadService.getAll(PageRequest.of(0, 10)).getTotalElements());
    }

    @Test
    void getByCampaignId_returnsList() {
        UUID id = UUID.randomUUID();
        when(campaignLeadRepository.findByCampaignId(id)).thenReturn(List.of(new CampaignLead()));
        assertEquals(1, campaignLeadService.getByCampaignId(id).size());
    }

    @Test
    void getByLeadId_returnsList() {
        UUID id = UUID.randomUUID();
        when(campaignLeadRepository.findByLeadId(id)).thenReturn(List.of(new CampaignLead()));
        assertEquals(1, campaignLeadService.getByLeadId(id).size());
    }

    @Test
    void create_saves() {
        CampaignLead cl = new CampaignLead();
        cl.setLeadId(UUID.randomUUID());
        cl.setCampaignId(UUID.randomUUID());
        when(campaignLeadRepository.save(any())).thenReturn(cl);
        assertNotNull(campaignLeadService.create(cl));
    }

    @Test
    void delete_exists() {
        UUID id = UUID.randomUUID();
        when(campaignLeadRepository.existsById(id)).thenReturn(true);
        assertTrue(campaignLeadService.delete(id));
    }

    @Test
    void delete_notExists() {
        when(campaignLeadRepository.existsById(any())).thenReturn(false);
        assertFalse(campaignLeadService.delete(UUID.randomUUID()));
    }
}

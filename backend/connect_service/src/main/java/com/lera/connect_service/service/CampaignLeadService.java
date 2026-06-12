package com.lera.connect_service.service;

import com.lera.connect_service.entity.CampaignLead;
import com.lera.connect_service.repository.CampaignLeadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CampaignLeadService {

    private final CampaignLeadRepository campaignLeadRepository;

    @Cacheable(value = "campaignLeads", key = "'page:' + #pageable.pageNumber")
    public Page<CampaignLead> getAll(Pageable pageable) {
        return campaignLeadRepository.findAll(pageable);
    }

    public Optional<CampaignLead> getById(UUID id) {
        return campaignLeadRepository.findById(id);
    }

    public List<CampaignLead> getByCampaignId(UUID campaignId) {
        return campaignLeadRepository.findByCampaignId(campaignId);
    }

    public List<CampaignLead> getByLeadId(UUID leadId) {
        return campaignLeadRepository.findByLeadId(leadId);
    }

    @Transactional
    @CacheEvict(value = "campaignLeads", allEntries = true)
    public CampaignLead create(CampaignLead campaignLead) {
        log.info("Adding lead {} to campaign {}", campaignLead.getLeadId(), campaignLead.getCampaignId());
        return campaignLeadRepository.save(campaignLead);
    }

    @Transactional
    @CacheEvict(value = "campaignLeads", allEntries = true)
    public boolean delete(UUID id) {
        if (campaignLeadRepository.existsById(id)) {
            campaignLeadRepository.deleteById(id);
            return true;
        }
        return false;
    }
}

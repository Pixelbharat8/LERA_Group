package com.lera.connect_service.service;

import com.lera.connect_service.entity.MarketingCampaign;
import com.lera.connect_service.repository.MarketingCampaignRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MarketingCampaignService {

    private final MarketingCampaignRepository marketingCampaignRepository;

    public Page<MarketingCampaign> getAll(Pageable pageable) {
        return marketingCampaignRepository.findAll(pageable);
    }

    public Optional<MarketingCampaign> getById(UUID id) {
        return marketingCampaignRepository.findById(id);
    }

    @Transactional
    public MarketingCampaign create(MarketingCampaign campaign) {
        log.info("Creating marketing campaign");
        return marketingCampaignRepository.save(campaign);
    }

    @Transactional
    public Optional<MarketingCampaign> update(UUID id, MarketingCampaign details) {
        return marketingCampaignRepository.findById(id).map(existing -> {
            details.setId(id);
            return marketingCampaignRepository.save(details);
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (marketingCampaignRepository.existsById(id)) {
            marketingCampaignRepository.deleteById(id);
            return true;
        }
        return false;
    }
}

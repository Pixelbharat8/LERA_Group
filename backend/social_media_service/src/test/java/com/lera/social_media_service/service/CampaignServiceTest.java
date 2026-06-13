package com.lera.social_media_service.service;

import com.lera.social_media_service.entity.Lead;
import com.lera.social_media_service.entity.MarketingCampaign;
import com.lera.social_media_service.repository.AdCampaignRepository;
import com.lera.social_media_service.repository.LeadRepository;
import com.lera.social_media_service.repository.MarketingCampaignRepository;
import com.lera.social_media_service.repository.SocialAnalyticsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CampaignServiceTest {

    @Mock private MarketingCampaignRepository campaignRepository;
    @Mock private AdCampaignRepository adCampaignRepository;
    @Mock private SocialAnalyticsRepository analyticsRepository;
    @Mock private LeadRepository leadRepository;
    @InjectMocks private CampaignService service;

    private static Lead lead(UUID campaignId, String status) {
        return Lead.builder().campaignId(campaignId).status(status).build();
    }

    private void campaignExists(UUID id, BigDecimal budget) {
        when(campaignRepository.findById(id)).thenReturn(
                Optional.of(MarketingCampaign.builder().id(id).budget(budget).build()));
    }

    @Test
    void performance_throwsWhenCampaignMissing() {
        UUID id = UUID.randomUUID();
        when(campaignRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.getCampaignPerformance(id));
    }

    @Test
    void performance_countsLeadsAndConversionRateScopedToCampaign() {
        UUID id = UUID.randomUUID();
        campaignExists(id, null); // no budget → no ROI
        when(leadRepository.findAll()).thenReturn(List.of(
                lead(id, "CONVERTED"),
                lead(id, "NEW"),
                lead(id, "NEW"),
                lead(id, "NEW"),
                lead(UUID.randomUUID(), "CONVERTED") // other campaign — must be excluded
        ));

        Map<String, Object> p = service.getCampaignPerformance(id);

        assertEquals(4, p.get("totalLeads"));
        assertEquals(1L, p.get("convertedLeads"));
        assertEquals(25.0, (double) p.get("conversionRate"), 0.0001); // 1/4
        assertFalse(p.containsKey("estimatedROI"));
    }

    @Test
    void performance_computesRoiWhenBudgetSet() {
        UUID id = UUID.randomUUID();
        campaignExists(id, new BigDecimal("1000"));
        when(leadRepository.findAll()).thenReturn(List.of(lead(id, "CONVERTED"), lead(id, "CONVERTED")));

        Map<String, Object> p = service.getCampaignPerformance(id);

        // estRevenue = 2 × 1000 = 2000; ROI = (2000 − 1000)/1000 × 100 = 100
        assertEquals(0, ((BigDecimal) p.get("estimatedROI")).compareTo(new BigDecimal("100.00")));
    }

    @Test
    void performance_zeroLeadsGivesZeroConversionAndNegativeRoi() {
        UUID id = UUID.randomUUID();
        campaignExists(id, new BigDecimal("500"));
        when(leadRepository.findAll()).thenReturn(List.of());

        Map<String, Object> p = service.getCampaignPerformance(id);

        assertEquals(0, p.get("totalLeads"));
        assertEquals(0.0, ((Number) p.get("conversionRate")).doubleValue(), 0.0001);
        // ROI = (0 − 500)/500 × 100 = −100
        assertEquals(0, ((BigDecimal) p.get("estimatedROI")).compareTo(new BigDecimal("-100.00")));
    }

    @Test
    void performance_noRoiWhenBudgetZero() {
        UUID id = UUID.randomUUID();
        campaignExists(id, BigDecimal.ZERO); // guarded: no divide-by-zero
        when(leadRepository.findAll()).thenReturn(List.of(lead(id, "CONVERTED")));

        Map<String, Object> p = service.getCampaignPerformance(id);
        assertFalse(p.containsKey("estimatedROI"));
    }
}

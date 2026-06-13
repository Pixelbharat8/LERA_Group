package com.lera.connect_service.dto;

import com.lera.connect_service.entity.Lead;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConvertLeadResponse {
    private Lead lead;
    private PlacementSyncResult placementSync;
}

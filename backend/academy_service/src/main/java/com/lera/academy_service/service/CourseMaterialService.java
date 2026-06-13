package com.lera.academy_service.service;

import com.lera.academy_service.entity.CourseMaterial;
import com.lera.academy_service.repository.CourseMaterialRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings({"NullAway", "DataFlowIssue", "nullness"})
public class CourseMaterialService {

    private final CourseMaterialRepository courseMaterialRepository;

    @Transactional
    public CourseMaterial createMaterial(CourseMaterial material) {
        if (material == null || material.getLessonId() == null) {
            throw new IllegalArgumentException("material and lessonId must not be null");
        }
        log.info("Creating material for lesson ID: {} - Type: {}",
                material.getLessonId(), material.getMaterialType());

        // Auto-generate display order if not set
        if (material.getDisplayOrder() == null) {
            List<CourseMaterial> existingMaterials =
                    courseMaterialRepository.findByLessonIdOrderByDisplayOrderAsc(material.getLessonId());
            material.setDisplayOrder(existingMaterials.size() + 1);
        }

        CourseMaterial saved = courseMaterialRepository.save(material);
        log.info("Material created with ID: {}", saved.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<CourseMaterial> getLessonMaterials(UUID lessonId) {
        if (lessonId == null) {
            return List.of();
        }
        log.debug("Fetching materials for lesson ID: {}", lessonId);
        return courseMaterialRepository.findByLessonIdOrderByDisplayOrderAsc(lessonId);
    }

    @Transactional(readOnly = true)
    public List<CourseMaterial> getMaterialsByType(UUID lessonId, String materialType) {
        if (lessonId == null || materialType == null) {
            return List.of();
        }
        log.debug("Fetching {} materials for lesson ID: {}", materialType, lessonId);
        return courseMaterialRepository.findByLessonIdAndMaterialType(lessonId, materialType);
    }

    @Transactional(readOnly = true)
    public Optional<CourseMaterial> getMaterialById(UUID id) {
        if (id == null) {
            return Optional.empty();
        }
        log.debug("Fetching material by ID: {}", id);
        return courseMaterialRepository.findById(id);
    }

    @Transactional
    public CourseMaterial updateMaterial(UUID id, CourseMaterial materialDetails) {
        if (id == null) {
            throw new IllegalArgumentException("id must not be null");
        }
        log.info("Updating material ID: {}", id);

        CourseMaterial material = courseMaterialRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Material not found with ID: " + id));

        if (materialDetails != null) {
            if (materialDetails.getMaterialName() != null) {
                material.setMaterialName(materialDetails.getMaterialName());
            }
            if (materialDetails.getMaterialNameVi() != null) {
                material.setMaterialNameVi(materialDetails.getMaterialNameVi());
            }
            if (materialDetails.getMaterialType() != null) {
                material.setMaterialType(materialDetails.getMaterialType());
            }
            if (materialDetails.getDescription() != null) {
                material.setDescription(materialDetails.getDescription());
            }
            if (materialDetails.getDescriptionVi() != null) {
                material.setDescriptionVi(materialDetails.getDescriptionVi());
            }
            if (materialDetails.getFileUrl() != null) {
                material.setFileUrl(materialDetails.getFileUrl());
            }
            if (materialDetails.getFileSize() != null) {
                material.setFileSize(materialDetails.getFileSize());
            }
            if (materialDetails.getDurationMinutes() != null) {
                material.setDurationMinutes(materialDetails.getDurationMinutes());
            }
            if (materialDetails.getDisplayOrder() != null) {
                material.setDisplayOrder(materialDetails.getDisplayOrder());
            }
            if (materialDetails.getIsRequired() != null) {
                material.setIsRequired(materialDetails.getIsRequired());
            }
        }

        CourseMaterial updated = courseMaterialRepository.save(material);
        log.info("Material updated successfully: {}", id);
        return updated;
    }

    @Transactional
    public void deleteMaterial(UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("id must not be null");
        }
        log.info("Deleting material ID: {}", id);

        CourseMaterial material = courseMaterialRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Material not found with ID: " + id));

        UUID lessonId = material.getLessonId();
        Integer displayOrder = material.getDisplayOrder();

        courseMaterialRepository.deleteById(id);

        // Reorder remaining materials
        List<CourseMaterial> remainingMaterials =
                courseMaterialRepository.findByLessonIdOrderByDisplayOrderAsc(lessonId);

        for (CourseMaterial mat : remainingMaterials) {
            if (mat.getDisplayOrder() != null && displayOrder != null && mat.getDisplayOrder() > displayOrder) {
                mat.setDisplayOrder(mat.getDisplayOrder() - 1);
                courseMaterialRepository.save(mat);
            }
        }

        log.info("Material deleted and remaining materials reordered: {}", id);
    }

    @Transactional
    public void reorderMaterials(UUID lessonId, List<UUID> materialIds) {
        if (lessonId == null || materialIds == null) {
            throw new IllegalArgumentException("lessonId and materialIds must not be null");
        }
        log.info("Reordering materials for lesson ID: {}", lessonId);

        for (int i = 0; i < materialIds.size(); i++) {
            UUID materialId = materialIds.get(i);
            CourseMaterial material = courseMaterialRepository.findById(materialId)
                    .orElseThrow(() -> new IllegalArgumentException("Material not found with ID: " + materialId));

            if (!lessonId.equals(material.getLessonId())) {
                throw new IllegalArgumentException("Material " + materialId + " does not belong to lesson " + lessonId);
            }

            material.setDisplayOrder(i + 1);
            courseMaterialRepository.save(material);
        }

        log.info("Materials reordered successfully for lesson: {}", lessonId);
    }

    @Transactional(readOnly = true)
    public List<CourseMaterial> getRequiredMaterials(UUID lessonId) {
        if (lessonId == null) {
            return List.of();
        }
        log.debug("Fetching required materials for lesson ID: {}", lessonId);
        return courseMaterialRepository.findByLessonIdAndIsRequiredTrue(lessonId);
    }

    @Transactional(readOnly = true)
    public Integer getTotalDuration(UUID lessonId) {
        if (lessonId == null) {
            return 0;
        }
        log.debug("Calculating total duration for lesson ID: {}", lessonId);

        List<CourseMaterial> materials = courseMaterialRepository.findByLessonIdOrderByDisplayOrderAsc(lessonId);

        return materials.stream()
                .map(CourseMaterial::getDurationMinutes)
                .filter(java.util.Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();
    }
}

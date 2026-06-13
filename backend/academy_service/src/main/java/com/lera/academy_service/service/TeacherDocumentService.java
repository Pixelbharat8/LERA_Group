package com.lera.academy_service.service;

import com.lera.academy_service.entity.TeacherDocument;
import com.lera.academy_service.repository.TeacherDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherDocumentService {

    private final TeacherDocumentRepository teacherDocumentRepository;

    @Transactional
    public TeacherDocument uploadDocument(TeacherDocument document) {
        if (document == null) {
            throw new IllegalArgumentException("document must not be null");
        }
        if (document.getTeacherId() == null) {
            throw new IllegalArgumentException("teacherId must not be null");
        }
        log.info("Uploading document for teacher ID: {} - Type: {}",
                document.getTeacherId(), document.getDocumentType());

        document.setUpdatedAt(LocalDateTime.now());

        TeacherDocument saved = teacherDocumentRepository.save(document);
        log.info("Document uploaded with ID: {}", saved.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<TeacherDocument> getTeacherDocuments(UUID teacherId) {
        if (teacherId == null) {
            return List.of();
        }
        log.debug("Fetching documents for teacher ID: {}", teacherId);
        return teacherDocumentRepository.findByTeacherId(teacherId);
    }

    @Transactional(readOnly = true)
    public List<TeacherDocument> getTeacherDocumentsByType(UUID teacherId, String documentType) {
        if (teacherId == null || documentType == null) {
            return List.of();
        }
        log.debug("Fetching {} documents for teacher ID: {}", documentType, teacherId);
        return teacherDocumentRepository.findByTeacherIdAndDocumentType(teacherId, documentType);
    }

    @Transactional(readOnly = true)
    public List<TeacherDocument> getVerifiedDocuments(UUID teacherId) {
        if (teacherId == null) {
            return List.of();
        }
        log.debug("Fetching verified documents for teacher ID: {}", teacherId);
        return teacherDocumentRepository.findByTeacherIdAndIsVerifiedTrue(teacherId);
    }

    @Transactional(readOnly = true)
    public Optional<TeacherDocument> getDocumentById(UUID id) {
        if (id == null) {
            return Optional.empty();
        }
        log.debug("Fetching document by ID: {}", id);
        return teacherDocumentRepository.findById(java.util.Objects.requireNonNull(id));
    }

    @Transactional
    public TeacherDocument verifyDocument(UUID documentId, UUID verifiedBy) {
        if (documentId == null) {
            throw new IllegalArgumentException("documentId must not be null");
        }
        log.info("Verifying document ID: {} by user ID: {}", documentId, verifiedBy);

        TeacherDocument document = teacherDocumentRepository.findById(java.util.Objects.requireNonNull(documentId))
                .orElseThrow(() -> new IllegalArgumentException("Document not found with ID: " + documentId));

        document.setIsVerified(true);
        document.setVerifiedBy(verifiedBy);
        document.setVerifiedAt(LocalDateTime.now());

        TeacherDocument verified = teacherDocumentRepository.save(document);
        log.info("Document verified successfully: {}", documentId);
        return verified;
    }

    @Transactional
    public TeacherDocument unverifyDocument(UUID documentId) {
        if (documentId == null) {
            throw new IllegalArgumentException("documentId must not be null");
        }
        log.info("Unverifying document ID: {}", documentId);

        TeacherDocument document = teacherDocumentRepository.findById(java.util.Objects.requireNonNull(documentId))
                .orElseThrow(() -> new IllegalArgumentException("Document not found with ID: " + documentId));

        document.setIsVerified(false);
        document.setVerifiedBy(null);
        document.setVerifiedAt(null);

        TeacherDocument unverified = teacherDocumentRepository.save(document);
        log.info("Document unverified successfully: {}", documentId);
        return unverified;
    }

    @Transactional
    public TeacherDocument updateDocument(UUID id, TeacherDocument documentDetails) {
        if (id == null) {
            throw new IllegalArgumentException("id must not be null");
        }
        log.info("Updating document ID: {}", id);

        TeacherDocument document = teacherDocumentRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Document not found with ID: " + id));

        if (documentDetails != null) {
            if (documentDetails.getDocumentName() != null) {
                document.setDocumentName(documentDetails.getDocumentName());
            }
            if (documentDetails.getDocumentType() != null) {
                document.setDocumentType(documentDetails.getDocumentType());
            }
            if (documentDetails.getDocumentUrl() != null) {
                document.setDocumentUrl(documentDetails.getDocumentUrl());
            }
            if (documentDetails.getFileSize() != null) {
                document.setFileSize(documentDetails.getFileSize());
            }
            if (documentDetails.getFileType() != null) {
                document.setFileType(documentDetails.getFileType());
            }
            if (documentDetails.getIssueDate() != null) {
                document.setIssueDate(documentDetails.getIssueDate());
            }
            if (documentDetails.getExpiryDate() != null) {
                document.setExpiryDate(documentDetails.getExpiryDate());
            }
            if (documentDetails.getIssuingAuthority() != null) {
                document.setIssuingAuthority(documentDetails.getIssuingAuthority());
            }
            if (documentDetails.getDocumentNumber() != null) {
                document.setDocumentNumber(documentDetails.getDocumentNumber());
            }
            if (documentDetails.getNotes() != null) {
                document.setNotes(documentDetails.getNotes());
            }
        }

        document.setUpdatedAt(LocalDateTime.now());

        TeacherDocument updated = teacherDocumentRepository.save(document);
        log.info("Document updated successfully: {}", id);
        return updated;
    }

    @Transactional
    public void deleteDocument(UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("id must not be null");
        }
        log.info("Deleting document ID: {}", id);

        if (!teacherDocumentRepository.existsById(java.util.Objects.requireNonNull(id))) {
            throw new IllegalArgumentException("Document not found with ID: " + id);
        }

        teacherDocumentRepository.deleteById(java.util.Objects.requireNonNull(id));
        log.info("Document deleted successfully: {}", id);
    }

    @Transactional(readOnly = true)
    public List<TeacherDocument> getExpiredDocuments() {
        log.debug("Fetching expired documents");
        return teacherDocumentRepository.findByExpiryDateBefore(java.time.LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<TeacherDocument> getExpiringDocuments(int daysAhead) {
        log.debug("Fetching documents expiring in next {} days", daysAhead);
        return teacherDocumentRepository.findByExpiryDateBefore(java.time.LocalDate.now().plusDays(daysAhead));
    }

    @Transactional(readOnly = true)
    public boolean hasValidCertification(UUID teacherId, String certificationType) {
        if (teacherId == null || certificationType == null) {
            return false;
        }
        log.debug("Checking valid {} certification for teacher ID: {}", certificationType, teacherId);

        List<TeacherDocument> documents = teacherDocumentRepository
                .findByTeacherIdAndDocumentType(teacherId, certificationType);

        return documents.stream()
                .anyMatch(doc -> Boolean.TRUE.equals(doc.getIsVerified()) &&
                        (doc.getExpiryDate() == null || doc.getExpiryDate().isAfter(java.time.LocalDate.now())));
    }
}

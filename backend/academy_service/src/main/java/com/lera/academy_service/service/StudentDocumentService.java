package com.lera.academy_service.service;

import com.lera.academy_service.entity.StudentDocument;
import com.lera.academy_service.repository.StudentDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings({"NullAway", "DataFlowIssue", "nullness"})
public class StudentDocumentService {

    private final StudentDocumentRepository studentDocumentRepository;

    @Transactional
    public StudentDocument uploadDocument(StudentDocument document) {
        if (document == null || document.getStudentId() == null) {
            throw new IllegalArgumentException("document and studentId must not be null");
        }
        log.info("Uploading document for student ID: {} - Type: {}",
                document.getStudentId(), document.getDocumentType());

        document.setUploadedAt(LocalDateTime.now());
        document.setIsVerified(false);

        StudentDocument saved = studentDocumentRepository.save(document);
        log.info("Document uploaded with ID: {}", saved.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<StudentDocument> getStudentDocuments(UUID studentId) {
        if (studentId == null) {
            return List.of();
        }
        log.debug("Fetching documents for student ID: {}", studentId);
        return studentDocumentRepository.findByStudentId(studentId);
    }

    @Transactional(readOnly = true)
    public List<StudentDocument> getStudentDocumentsByType(UUID studentId, String documentType) {
        if (studentId == null || documentType == null) {
            return List.of();
        }
        log.debug("Fetching {} documents for student ID: {}", documentType, studentId);
        return studentDocumentRepository.findByStudentIdAndDocumentType(studentId, documentType);
    }

    @Transactional(readOnly = true)
    public List<StudentDocument> getVerifiedDocuments(UUID studentId) {
        if (studentId == null) {
            return List.of();
        }
        log.debug("Fetching verified documents for student ID: {}", studentId);
        return studentDocumentRepository.findByStudentIdAndIsVerifiedTrue(studentId);
    }

    @Transactional(readOnly = true)
    public Optional<StudentDocument> getDocumentById(UUID id) {
        if (id == null) {
            return Optional.empty();
        }
        log.debug("Fetching document by ID: {}", id);
        return studentDocumentRepository.findById(id);
    }

    @Transactional
    public StudentDocument verifyDocument(UUID documentId, UUID verifiedBy) {
        if (documentId == null) {
            throw new IllegalArgumentException("documentId must not be null");
        }
        log.info("Verifying document ID: {} by user ID: {}", documentId, verifiedBy);

        StudentDocument document = studentDocumentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with ID: " + documentId));

        document.setIsVerified(true);
        document.setVerifiedBy(verifiedBy);
        document.setVerifiedAt(LocalDateTime.now());

        StudentDocument verified = studentDocumentRepository.save(document);
        log.info("Document verified successfully: {}", documentId);
        return verified;
    }

    @Transactional
    public StudentDocument unverifyDocument(UUID documentId) {
        if (documentId == null) {
            throw new IllegalArgumentException("documentId must not be null");
        }
        log.info("Unverifying document ID: {}", documentId);

        StudentDocument document = studentDocumentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with ID: " + documentId));

        document.setIsVerified(false);
        document.setVerifiedBy(null);
        document.setVerifiedAt(null);

        StudentDocument unverified = studentDocumentRepository.save(document);
        log.info("Document unverified successfully: {}", documentId);
        return unverified;
    }

    @Transactional
    public StudentDocument updateDocument(UUID id, StudentDocument documentDetails) {
        if (id == null) {
            throw new IllegalArgumentException("id must not be null");
        }
        log.info("Updating document ID: {}", id);

        StudentDocument document = studentDocumentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with ID: " + id));

        if (documentDetails != null) {
            if (documentDetails.getDocumentName() != null) {
                document.setDocumentName(documentDetails.getDocumentName());
            }
            if (documentDetails.getDocumentType() != null) {
                document.setDocumentType(documentDetails.getDocumentType());
            }
            if (documentDetails.getFilePath() != null) {
                document.setFilePath(documentDetails.getFilePath());
            }
            if (documentDetails.getFileUrl() != null) {
                document.setFileUrl(documentDetails.getFileUrl());
            }
            if (documentDetails.getFileSize() != null) {
                document.setFileSize(documentDetails.getFileSize());
            }
            if (documentDetails.getMimeType() != null) {
                document.setMimeType(documentDetails.getMimeType());
            }
            if (documentDetails.getExpiryDate() != null) {
                document.setExpiresAt(documentDetails.getExpiryDate());
            }
            if (documentDetails.getNotes() != null) {
                document.setNotes(documentDetails.getNotes());
            }
        }

        StudentDocument updated = studentDocumentRepository.save(document);
        log.info("Document updated successfully: {}", id);
        return updated;
    }

    @Transactional
    public void deleteDocument(UUID id) {
        if (id == null) {
            throw new IllegalArgumentException("id must not be null");
        }
        log.info("Deleting document ID: {}", id);

        if (!studentDocumentRepository.existsById(id)) {
            throw new IllegalArgumentException("Document not found with ID: " + id);
        }

        studentDocumentRepository.deleteById(id);
        log.info("Document deleted successfully: {}", id);
    }

    @Transactional(readOnly = true)
    public List<StudentDocument> getExpiredDocuments() {
        log.debug("Fetching expired documents");
        return studentDocumentRepository.findByExpiresAtBefore(LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<StudentDocument> getExpiringDocuments(int daysAhead) {
        log.debug("Fetching documents expiring in next {} days", daysAhead);
        return studentDocumentRepository.findByExpiresAtBefore(LocalDate.now().plusDays(daysAhead));
    }
}

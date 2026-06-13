package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "call_logs", indexes = {
    @Index(name = "idx_call_logs_lead", columnList = "lead_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallLog {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "lead_id")
    private UUID leadId; // optional — a call may be standalone (no CRM lead)

    @Column(name = "caller_id")
    private UUID callerId; // User who made the call

    @Column(name = "call_type", length = 50)
    private String callType; // INBOUND, OUTBOUND

    @Column(name = "call_duration")
    private Integer callDuration; // in seconds

    @Column(name = "call_status", length = 50)
    private String callStatus; // COMPLETED, MISSED, REJECTED, BUSY, FAILED

    @Column(name = "outcome", length = 50)
    private String outcome; // CONNECTED, NO_ANSWER, BUSY, VOICEMAIL, ...

    @Column(name = "phone_number", length = 50)
    private String phoneNumber;

    @Column(name = "recording_url", columnDefinition = "TEXT")
    private String recordingUrl;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String summary; // AI-generated summary

    @Column(name = "called_at", nullable = false)
    @Builder.Default
    private LocalDateTime calledAt = LocalDateTime.now();
}

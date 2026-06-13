package com.lera.connect_service.entity;

import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Poll option entity - each choice in a poll
 */
@Entity
@Table(name = "chat_poll_options")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatPollOption {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "poll_id", nullable = false)
    private UUID pollId;

    @Column(name = "option_index", nullable = false)
    private Integer optionIndex;

    @Column(name = "option_text", nullable = false)
    private String optionText;

    @Column(name = "vote_count")
    @Builder.Default
    private Integer voteCount = 0;
}

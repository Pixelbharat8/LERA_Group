package com.lera.connect_service.service.messaging;

import com.lera.connect_service.entity.Lead;
import com.lera.connect_service.entity.OutboundMessage;
import com.lera.connect_service.repository.LeadRepository;
import com.lera.connect_service.repository.OutboundMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/** Routes an outbound message to the right channel and records it. */
@Service
@RequiredArgsConstructor
public class OutboundMessagingService {

    private final List<MessageChannel> channels;
    private final OutboundMessageRepository messageRepository;
    private final LeadRepository leadRepository;

    public OutboundMessage send(UUID leadId, String toPhone, String channelName, String body, UUID sentBy) {
        String phone = toPhone;
        if ((phone == null || phone.isBlank()) && leadId != null) {
            phone = leadRepository.findById(leadId).map(Lead::getParentPhone).orElse(null);
        }
        MessageChannel channel = channels.stream()
                .filter(c -> c.name().equalsIgnoreCase(channelName))
                .findFirst().orElse(null);

        OutboundMessage msg = new OutboundMessage();
        msg.setLeadId(leadId);
        msg.setToPhone(phone);
        msg.setChannel(channelName != null ? channelName.toUpperCase() : null);
        msg.setBody(body);
        msg.setSentBy(sentBy);

        if (channel == null) {
            msg.setStatus("FAILED");
            msg.setErrorMessage("Unknown channel: " + channelName);
        } else if (phone == null || phone.isBlank()) {
            msg.setStatus("FAILED");
            msg.setErrorMessage("No recipient phone");
        } else {
            MessageChannel.SendResult r = channel.send(phone, body);
            msg.setStatus(r.status());
            msg.setProvider(r.provider());
            msg.setErrorMessage(r.error());
        }
        return messageRepository.save(msg);
    }

    /** Which channels are configured (for the UI). */
    public Map<String, Boolean> channelStatus() {
        return channels.stream().collect(Collectors.toMap(MessageChannel::name, MessageChannel::isConfigured));
    }
}

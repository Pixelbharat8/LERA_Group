package com.lera.payment_service.repository;

import com.lera.payment_service.entity.InvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, UUID> {

    List<InvoiceItem> findByInvoiceId(UUID invoiceId);

    /** One query for a whole page of invoices, rather than one per invoice. */
    List<InvoiceItem> findByInvoiceIdIn(Collection<UUID> invoiceIds);

    void deleteByInvoiceId(UUID invoiceId);
}

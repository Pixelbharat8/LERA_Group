package com.lera.payment_service.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "invoices")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "invoice_number", nullable = false, unique = true)
    private String invoiceNumber;

    @Column(name = "student_id")
    private UUID studentId;

    @Column(name = "center_id")
    private UUID centerId;

    @Column(nullable = false, precision = 12, scale = 2)
    @PositiveOrZero
    private BigDecimal subtotal;

    @Column(name = "discount_id")
    private UUID discountId;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    @PositiveOrZero
    private BigDecimal discountAmount;

    @Column(name = "tax_amount", precision = 12, scale = 2)
    @PositiveOrZero
    private BigDecimal taxAmount;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    @PositiveOrZero
    private BigDecimal totalAmount;

    private String currency = "VND";

    private String status = "PENDING";

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    /** When a payment reminder was last sent for this invoice (avoids re-sending the same day). */
    @Column(name = "last_reminder_at")
    private LocalDateTime lastReminderAt;

    private String notes;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (invoiceNumber == null) {
            invoiceNumber = "INV-" + System.currentTimeMillis();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }

    public UUID getCenterId() { return centerId; }
    public void setCenterId(UUID centerId) { this.centerId = centerId; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public UUID getDiscountId() { return discountId; }
    public void setDiscountId(UUID discountId) { this.discountId = discountId; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }

    public LocalDateTime getLastReminderAt() { return lastReminderAt; }
    public void setLastReminderAt(LocalDateTime lastReminderAt) { this.lastReminderAt = lastReminderAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    /**
     * Money actually received against this invoice, summed from settled payment rows. Not a
     * column — payments live in their own table and the invoice has never had a paid_amount.
     *
     * The finance page read `inv.paidAmount` regardless, which came back undefined every time:
     * the balance column therefore showed the FULL total on a part-paid invoice, the "collected"
     * tile read 0, and recording a second instalment computed `0 + amount` — so an invoice paid
     * in instalments could never reach PAID, however much had been received.
     */
    @Transient
    private BigDecimal paidAmount;

    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }

    /** totalAmount - paidAmount, floored at zero; null until paidAmount has been resolved. */
    @Transient
    public BigDecimal getBalance() {
        if (paidAmount == null) return null;
        BigDecimal total = totalAmount != null ? totalAmount : BigDecimal.ZERO;
        BigDecimal remaining = total.subtract(paidAmount);
        return remaining.signum() < 0 ? BigDecimal.ZERO : remaining;
    }

    /**
     * The invoice's line items. Not a mapped relationship — they are loaded and saved alongside
     * the invoice by InvoiceServiceImpl — but they travel on the wire in both directions, which
     * is what the finance page's line-item editor has always assumed.
     *
     * Nothing persisted them before: there was no repository, and total_price (NOT NULL) had no
     * field on InvoiceItem, so every line a member of staff typed was quietly dropped on save and
     * the invoice detail view showed no items at all.
     */
    @Transient
    private java.util.List<InvoiceItem> items;

    public java.util.List<InvoiceItem> getItems() { return items; }
    public void setItems(java.util.List<InvoiceItem> items) { this.items = items; }
}

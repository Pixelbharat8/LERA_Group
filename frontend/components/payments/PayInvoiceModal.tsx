"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Method = {
  id: string;
  methodName: string;
  methodType?: string;
  description?: string;
  providerName?: string;
  accountInfo?: string; // JSON or free text (bank details, etc.)
  isActive?: boolean;
  isOnline?: boolean;
  displayOrder?: number;
};

/**
 * "Pay this invoice" instructions modal. Online gateway payment for arbitrary invoices
 * isn't wired yet (VNPay is enrolment-only), so this honestly shows HOW to pay: the
 * admin-configured payment methods (/api/payment-methods/active) with the invoice number
 * as the transfer reference. Replaces the old dead "Pay Now" buttons on the student &
 * parent payment pages. Falls back to a contact-the-office message if no methods exist.
 */
export default function PayInvoiceModal({
  invoiceNumber,
  amount,
  currency = "VND",
  contactPhone,
  onClose,
}: {
  invoiceNumber: string;
  amount: number;
  currency?: string;
  contactPhone?: string;
  onClose: () => void;
}) {
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch("/api/payment-methods/active").catch(() => []);
        const arr: Method[] = Array.isArray(data) ? data : [];
        setMethods(
          arr
            .filter((m) => m.isActive !== false)
            .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fmt = (n: number) => `${new Intl.NumberFormat("vi-VN").format(n || 0)} ${currency}`;

  // accountInfo may be JSON ({bank, account, holder}) or plain text — render readably either way.
  const renderAccountInfo = (raw?: string) => {
    if (!raw) return null;
    try {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object") {
        return (
          <dl className="mt-2 grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-sm">
            {Object.entries(obj).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-gray-500 capitalize">{k.replace(/_/g, " ")}</dt>
                <dd className="font-medium text-gray-900 break-all">{String(v)}</dd>
              </div>
            ))}
          </dl>
        );
      }
    } catch {
      /* not JSON — show as text */
    }
    return <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap break-words">{raw}</p>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Pay invoice {invoiceNumber}</h2>
            <p className="text-sm text-gray-500">
              Amount due: <span className="font-semibold text-gray-900">{fmt(amount)}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-sm text-amber-800">
            Use <span className="font-bold">{invoiceNumber}</span> as the payment reference so we can match your payment.
          </div>

          {loading ? (
            <div className="text-gray-400 text-center py-6">Loading payment methods…</div>
          ) : methods.length > 0 ? (
            <div className="space-y-3">
              {methods.map((m) => (
                <div key={m.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{m.methodName}</span>
                    {m.providerName && <span className="text-xs text-gray-500">· {m.providerName}</span>}
                  </div>
                  {m.description && <p className="mt-1 text-sm text-gray-600">{m.description}</p>}
                  {renderAccountInfo(m.accountInfo)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              Please contact our office to complete payment
              {contactPhone ? (
                <> — <a href={`tel:${contactPhone.replace(/[^0-9+]/g, "")}`} className="text-blue-600 font-semibold">{contactPhone}</a></>
              ) : (
                "."
              )}
            </div>
          )}

          <p className="text-xs text-gray-400">
            After paying, your receipt updates once our team confirms the payment.
          </p>
        </div>
      </div>
    </div>
  );
}

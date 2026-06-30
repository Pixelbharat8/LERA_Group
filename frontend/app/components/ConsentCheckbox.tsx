"use client";

import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";

/**
 * Data-processing consent for forms that collect personal data, required by Vietnam's
 * Personal Data Protection Decree (Nghị định 13/2023/NĐ-CP). Use variant="parental" on
 * any form that collects a child's data (enrolment, trial booking) — under-16s need the
 * parent/guardian's consent. Bilingual EN/VI.
 */
export default function ConsentCheckbox({
  checked,
  onChange,
  variant = "self",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  variant?: "self" | "parental";
}) {
  const { language } = useLanguage();
  const vi = language === "VI";

  const lead = variant === "parental"
    ? (vi
        ? "Tôi là phụ huynh/người giám hộ và đồng ý cho LERA Academy thu thập và xử lý dữ liệu cá nhân của con tôi theo "
        : "I am the parent/guardian and consent to LERA Academy collecting and processing my child's personal data in accordance with the ")
    : (vi
        ? "Tôi đồng ý để LERA Academy thu thập và xử lý dữ liệu cá nhân của tôi theo "
        : "I consent to LERA Academy collecting and processing my personal data in accordance with the ");

  return (
    <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required
        className="mt-1 h-4 w-4 flex-shrink-0"
      />
      <span>
        {lead}
        <Link href="/privacy" target="_blank" className="text-blue-600 underline">
          {vi ? "Chính sách bảo mật" : "Privacy Policy"}
        </Link>
        .
      </span>
    </label>
  );
}

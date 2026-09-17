import { redirect } from "next/navigation";

/**
 * This was a second, lesser fee-rules screen. Nothing linked to it — the sidebar points at
 * /dashboard/finance/fee-rules — and it had drifted badly from the FeeRule entity while the
 * linked page had not:
 *
 *   - when /api/fee-rules came back empty it displayed four INVENTED rules ("Standard Course
 *     Fee 150,000", "IELTS Prep Fee 5,000,000", "Early Bird Discount -10%", "Sibling Discount
 *     -15%") as though they were the centre's real billing configuration;
 *   - it saved with `.catch(() => null)` and then added the rule to the on-screen list anyway,
 *     under a locally invented numeric id, so a failed save looked exactly like a successful
 *     one — and deleting did the same in reverse;
 *   - the body it posted carried `type` and `status`, which a FeeRule does not have (they are
 *     `calculationType` and `isActive`), so even a save that DID reach the server stored a rule
 *     with no type and no active flag.
 *
 * /dashboard/finance/fee-rules is the same feature, is the one the sidebar links to, and maps
 * the entity's fields correctly. Sending this URL there keeps any existing bookmark working
 * without keeping a screen that fabricates billing rules.
 */
export default function FeeRulesRedirect() {
  redirect("/dashboard/finance/fee-rules");
}

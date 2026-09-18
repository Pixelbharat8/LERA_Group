import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * The Chairman's ad-campaign page could not create a campaign. MarketingCampaign's column is
 * campaign_name and it is NOT NULL; the form POSTed `name`, which the entity has no field for,
 * so the key was dropped and the insert rejected. Reading had already been fixed
 * (`name: c.campaignName`) — only the write was left behind.
 *
 * The form also offered a Campaign Type select (AWARENESS / LEAD_GEN / ...) alongside Channel.
 * The entity has a single type column, and the read maps it to this page's `channel`, so
 * nothing could store a campaign type: the control silently discarded whatever was chosen.
 * Removed, rather than left as a control that does nothing. Storing both dimensions would need
 * a new column, which is LERA's call.
 */

const REPO = path.resolve(__dirname, "..", "..");
const read = (p: string) => fs.readFileSync(path.join(REPO, p), "utf8");

const entity = read(
  "backend/social_media_service/src/main/java/com/lera/social_media_service/entity/MarketingCampaign.java"
);
const page = read("frontend/app/dashboard/chairman/marketing/ads-campaigns/page.tsx");

describe("creating a marketing campaign", () => {
  it("the name column is campaign_name and is required", () => {
    expect(entity).toMatch(/@Column\(name = "campaign_name", nullable = false\)/);
    expect(entity).not.toMatch(/private String name;/);
  });

  it("the form posts campaignName, not name", () => {
    // anchor on the POST, not the list fetch that shares the same URL
    const post = page.slice(page.indexOf('method: "POST"'));
    expect(post.slice(0, 700)).toMatch(/campaignName: newCampaign\.name/);
    expect(page).not.toMatch(/JSON\.stringify\(newCampaign\)/);
  });

  it("writes the same column the read displays as the channel", () => {
    expect(page).toMatch(/channel: c\.campaignType/);
    expect(page).toMatch(/campaignType: newCampaign\.channel/);
  });

  it("offers no control whose value cannot be stored", () => {
    expect(entity).not.toMatch(/private String channel;/);
    expect(page).not.toMatch(/CAMPAIGN_TYPES/);
    expect(page).not.toMatch(/newCampaign\.campaignType/);
  });
});

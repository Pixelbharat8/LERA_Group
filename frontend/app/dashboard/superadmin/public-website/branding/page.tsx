import { redirect } from "next/navigation";

// De-duplicated. This page previously wrote an orphaned `branding_settings` blob that
// nothing on the live site read. The canonical branding editor lives under the Chairman
// panel and writes the live `branding_*` settings (logo + colours) that the public site
// now consumes (Header/Footer logo via useBrandLogo; colours via BrandTheme). Redirect
// there so there is a single source of truth.
export default function BrandingEditorRedirect() {
  redirect("/dashboard/chairman/website-content/branding");
}

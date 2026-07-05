# Accreditation / partner logos (trust band)

The homepage trust strip renders a real logo when a matching file exists here,
and falls back to a clean text label when it doesn't (see
`app/components/TrustMark.tsx`). This means the site ships with NO copyrighted
marks bundled — you add them only once LERA is genuinely licensed to display them.

## To activate the logo row

Drop a file named after each slug below. `.svg` is preferred (sharpest, smallest);
`.png` also works (use a transparent background, ~height 80px+). The component
tries `<slug>.svg` first, then `<slug>.png`, then the text fallback.

| Slug (filename) | Mark |
|---|---|
| `cambridge-english.svg`      | Cambridge English |
| `ielts.svg`                  | IELTS |
| `toefl.svg`                  | TOEFL |
| `tesol-celta.svg`            | TESOL / CELTA |
| `cambridge-assessment.svg`   | Cambridge Assessment |

Logos display grayscale at 60% opacity, going full-colour on hover — so plain
single-colour or full-colour marks both look correct.

## ⚠️ Legal — read before adding

Only add a mark LERA is **genuinely accredited for and licensed to display**.
Accreditation bodies (Cambridge Assessment English, IELTS/British Council/IDP,
ETS/TOEFL, TESOL/CELTA providers) each have brand-usage rules. Using a logo
without the partnership/authorisation it implies is misrepresentation and a
trademark issue. When in doubt, keep the text fallback — it is not a placeholder,
it's a deliberately clean, launch-safe treatment.

Remove a row entirely by deleting its entry from the array in `app/page.tsx`
(ACCREDITATION / TRUST STRIP section).

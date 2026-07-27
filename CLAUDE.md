# CLAUDE.md

## Design system

This project uses the design system defined in `assets/tokens.css` (design tokens
+ self-hosted `@font-face` declarations) and `assets/base.css` (component styles).

- Always style with the `var(--*)` tokens from `assets/tokens.css` — colors, fonts,
  type scale (`--fs-*`), radii, spacing, and the Effizienzband hues (`--k-*`).
- Never hardcode a hex color or a font-family name that isn't defined in
  `assets/tokens.css`. Colour is information, not decoration — see the header
  comment in that file for what each hue means.
- Load the fonts and the stylesheets in every page, in this order:

  ```html
  <link rel="stylesheet" href="assets/tokens.css" />
  <link rel="stylesheet" href="assets/base.css" />
  ```

  IBM Plex Sans is self-hosted from `assets/fonts/` and declared in
  `assets/tokens.css`. Never load fonts from `fonts.gstatic.com` /
  `fonts.googleapis.com` — that transfers the visitor's IP to a US server and
  was ruled a GDPR violation (LG München I, 20.01.2022 – 3 O 17493/20).
- **Design reference: `Energieausweis-Tools.standalone.html`** (the exported
  "Energieausweis Wissen" design). Use it as the single source of truth for
  layout, component look and visual patterns in the Wissen design, which is
  LIVE as `index.html` since 2026-07-28 (skin: `assets/wissen.css`;
  `preview-wissen.html` remains a gitignored local scratchpad).
  EXCEPTION — fonts: the standalone loads Bricolage Grotesque from Google
  Fonts; never copy that part. Fonts stay self-hosted from `assets/fonts/`
  (GDPR, see above). Copy the look, not the font loading.
- Legal logic is NEVER taken from the standalone (its flows and vendor data are
  design mockups). Every legal claim comes from `assets/rules.js`.

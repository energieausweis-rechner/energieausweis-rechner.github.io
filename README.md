# Energieausweis Rechner

Minimal, static single-page tool site (no build step, no dependencies).

**One focused tool: "Welcher Energieausweis ist nötig?"** — a short question wizard that
decides between *Verbrauchsausweis*, *Bedarfsausweis* (Pflicht) or free choice, based on
GEG §§79–80. A decorative A+ → H Effizienzband sits in the header as brand identity.

The companion **Effizienzklassen-Rechner (A+ bis H)** lives in a separate project
(`../energieausweis-effizienzklasse`) and will get its own GitHub org.

Both tools display a prominent **"nur zu Informationszwecken"** disclaimer.

## Files

| File         | Purpose                                  |
|--------------|------------------------------------------|
| `index.html` | Markup + SEO meta + FAQ schema + content |
| `styles.css` | Minimal/clean styling + Effizienzband    |
| `app.js`     | Question wizard logic + header band      |
| `robots.txt` | Crawl directives                         |
| `sitemap.xml`| Sitemap                                  |

## Test locally

```bash
python -m http.server 8080   # then open http://localhost:8080
```

## Deploy later (GitHub Pages, org-root site)

Not deployed yet. When ready:

1. Create repo `energieausweis-rechner.github.io` in the `energieausweis-rechner` org.
2. Push these files to the default branch.
3. Settings → Pages → Source: deploy from branch (root).
4. Site serves at `https://energieausweis-rechner.github.io/`.

Canonical/OG/robots/sitemap URLs are already set to
`https://energieausweis-rechner.github.io/`.

## Notes / TODO

- The legal facts (GEG §§79–80 decision rules) should be source-verified before launch.
- Affiliate link to the partner (immobilienwerker.de) to be added after ranking is validated.

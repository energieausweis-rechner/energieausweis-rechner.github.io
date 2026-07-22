# Energieausweis Rechner

Static single-page tool site. No build step, no dependencies, no framework.
Live at <https://energieausweis-rechner.github.io/> via GitHub Pages (root of the
default branch).

Separate property from `energieausweis-wissen.de` (same operator). That site
explains; this one *does*. Keep body copy distinct between the two — they must
not compete for the same queries.

## Shape

**One page.** `/` carries every tool and all supporting content; only the legally
required pages exist alongside it. Tools are `<h2>` sections with stable anchors.

| URL | Purpose |
|-----|---------|
| `/` | All five tools + explainers + FAQ |
| `/impressum/` | DDG § 5 |
| `/datenschutz/` | Incl. the `sessionStorage` justification under TDDDG § 25 Abs. 2 |
| `/transparenz/` | Affiliate funding disclosure |

### Anchors are a permanent contract

`#rechner` `#inserat` `#effizienzklasse` `#kosten` `#gmodg` `#unterschied`
`#bedarfspflicht` `#pflicht` `#faq`

Never rename one after launch — inbound links, shared results and AI citations
break silently. Add new ones instead.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The whole product: tools, explainers, FAQ, JSON-LD graph |
| `assets/rules.js` | **Legal single source of truth.** Every § claim, verbatim, with source + validity window |
| `assets/tools.js` | Wizard state machine, citation renderer, partner-CTA gate |
| `assets/widgets.js` | Calculators, generator, GModG timeline, nav, lazy boot |
| `assets/tokens.css` | Design tokens + self-hosted `@font-face` |
| `assets/base.css` | Layout and components |
| `assets/fonts/` | Self-hosted woff2 — see "Fonts" below |
| `docs/geg-verbatim.txt` | Law text as fetched from gesetze-im-internet.de, 2026-07-22 |
| `google95912d855bb339ce.html` | **Do not delete** — Google Search Console verification |

The `google-site-verification` meta tag in `index.html` is the second half of GSC
verification. **Both must survive any rewrite.**

## Hard rules

**Nothing legal is written inline.** If a claim cites a §, it lives in
`assets/rules.js` with its verbatim German text, source URL and validity window,
and renders through `EAR.cite()`. Verify against `docs/geg-verbatim.txt` before
editing. This is also what makes the page citable by AI answer engines.

**`EAR.renderPartnerCta()` is the only path that may emit an outbound partner
link.** It always emits the „Anzeige" label, `rel="sponsored"` and the disclosure
sentence together. § 5a Abs. 4 UWG requires labelling *at each link* — a
page-level disclaimer is not sufficient (LG München I, 26.02.2019 – 33 O 2855/18;
09.07.2024 – 1 HK O 12576/23), which matters on a long single page.
`EAR.PARTNERS` is empty; while it is, no provider block renders anywhere.

**Never claim to be „unabhängig" or „neutral"** while commission is possible
(§ 5 UWG). No dena/BAFA/KfW logos, no "staatlich anerkannt".

**No cookies, no `localStorage`, no third-party requests.** `sessionStorage` only,
for the tool-to-tool handoff — strictly necessary under § 25 Abs. 2 Nr. 2 TDDDG,
so no consent banner is needed. Keep it that way: any analytics that touches the
device brings a banner back.

### Fonts

Self-hosted in `assets/fonts/`. **Do not switch to the Google Fonts CDN** —
embedding it transfers the visitor's IP to a US server and was ruled a GDPR
violation with damages (LG München I, 20.01.2022 – 3 O 17493/20).

## ⚠ GEG → GModG

The Gebäudemodernisierungsgesetz passed the Bundestag on 2026-07-10 and cleared
the Bundesrat, but was **not yet verkündet** as of 2026-07-22. The GEG is still
the law in force. The Energieausweis package (§§ 79, 81, 82, 85, 87 + new § 88b)
lands in **Stufe 2, roughly six months after Verkündung** — and it **abolishes
the pre-1977 Bedarfsausweis-Pflicht**, which is the entire basis of the main
flow's last four questions.

**No page may state a "gilt ab" date until the BGBl entry exists.**

When it appears:
1. Set `EAR.STAND.gmodgVerkuendet` and `gmodgStufe2` in `rules.js`.
2. Fill `giltBis` on every rule carrying `abgeloestDurch: 'gmodg_stufe2'`.
3. Re-check each `unbestaetigt` note — several points are contradictory across
   sources (the new § 82 data basis; whether Wohngebäude move to an A–G scale).
4. Update `EAR.GMODG.stufen[].datum`.

Change `rules.js` — not the tool implementations.

## Develop

```bash
python3 -m http.server 8080   # then open http://localhost:8080
```

### Test the decision tree

`assets/rules.js` and `assets/tools.js` load in Node with only `window` and a
`document` stub, because `EAR.flows.main` is pure logic. That makes the whole
tree exhaustively testable — 37 terminal paths, plus the Anlage 10 boundaries.
Re-run it after touching any flow or rule.

## Backlog

Tools researched but not built: Verbrauchsdaten-Rechner aus der
Heizkostenabrechnung (the step users get stuck on *before* the Anzeigentext
generator — likely the highest-value addition) · Gültigkeits-/Ablaufrechner ·
Ausstellungsberechtigungs-Prüfer (§ 88 vs. dena-EEE-Liste) ·
Unterlagen-Checkliste · Heizkosten-Prognose · Aushangpflicht-Check (250/500 m²).

/* ─────────────────────────────────────────────────────────────────────────
   rules.js — the single source of truth for every legal claim on this site.
   Nothing legal may be written inline in a template. If it cites a §, it
   lives here.

   Verbatim texts transcribed from gesetze-im-internet.de on 2026-07-22 and
   kept in docs/geg-verbatim.txt. Verify against that file before editing.

   ⚠ GEG → GModG TRANSITION
   The Gebäudemodernisierungsgesetz passed the Bundestag on 2026-07-10 and
   cleared the Bundesrat, but was NOT yet verkündet as of 2026-07-22 — so the
   GEG below is the law in force. The Energieausweis package (§§ 79, 81, 82,
   85, 87 + new § 88b) takes effect in Stufe 2, roughly six months after
   Verkündung. Rules that Stufe 2 changes carry `abgeloestDurch`.

   WHEN THE BGBl ENTRY APPEARS: set STAND.gmodgVerkuendet / gmodgStufe2, fill
   each affected rule's `giltBis`, and re-check every `unbestaetigt` note.
   Change this file — never the tool implementations.
   ───────────────────────────────────────────────────────────────────────── */

window.EAR = window.EAR || {};

EAR.STAND = {
  gesetz: 'GEG',
  stand: '07/2026',
  geprueft: '2026-07-22',
  quelle: 'https://www.gesetze-im-internet.de/geg/',
  // null until the Bundesgesetzblatt entry exists. Nothing on the site may
  // state a "gilt ab" date while these are null.
  gmodgVerkuendet: null,
  gmodgStufe2: null,
};

EAR.RULES = {

  /* ── Wann überhaupt ein Ausweis nötig ist ─────────────────────────────── */

  pflicht_verkauf_vermietung: {
    zitat: '§ 80 Abs. 3 Satz 1 GEG',
    wortlaut:
      'Soll ein mit einem Gebäude bebautes Grundstück oder Wohnungs- oder ' +
      'Teileigentum verkauft, ein Erbbaurecht an einem bebauten Grundstück ' +
      'begründet oder übertragen oder ein Gebäude, eine Wohnung oder eine ' +
      'sonstige selbständige Nutzungseinheit vermietet, verpachtet oder ' +
      'verleast werden, ist ein Energieausweis auszustellen, wenn nicht ' +
      'bereits ein gültiger Energieausweis für das Gebäude vorliegt.',
    quelle: 'https://www.gesetze-im-internet.de/geg/__80.html',
    giltBis: null,
  },

  pflicht_neubau: {
    zitat: '§ 80 Abs. 1 Satz 1 GEG',
    wortlaut:
      'Wird ein Gebäude errichtet, ist ein Energiebedarfsausweis unter ' +
      'Zugrundelegung der energetischen Eigenschaften des fertiggestellten ' +
      'Gebäudes auszustellen.',
    quelle: 'https://www.gesetze-im-internet.de/geg/__80.html',
    giltBis: null,
  },

  /* ── Ausnahmen ────────────────────────────────────────────────────────── */

  ausnahme_klein: {
    zitat: '§ 79 Abs. 4 Satz 1 GEG i. V. m. § 3 Abs. 1 Nr. 17 GEG',
    wortlaut:
      'Auf ein kleines Gebäude sind die Vorschriften dieses Abschnitts nicht ' +
      'anzuwenden. — „kleines Gebäude“ ist „ein Gebäude mit nicht mehr als ' +
      '50 Quadratmetern Nutzfläche“ (§ 3 Abs. 1 Nr. 17 GEG).',
    quelle: 'https://www.gesetze-im-internet.de/geg/__79.html',
    giltBis: null,
    // Die Grenze ist "nicht mehr als 50 m²", also ≤ 50 — NICHT "unter 50 m²".
    // Ein Gebäude mit genau 50 m² Nutzfläche ist ausgenommen.
    hinweis: 'Die Schwelle ist ≤ 50 m², nicht < 50 m².',
  },

  ausnahme_denkmal: {
    zitat: '§ 79 Abs. 4 Satz 2 GEG',
    wortlaut: 'Auf ein Baudenkmal ist § 80 Absatz 3 bis 7 nicht anzuwenden.',
    quelle: 'https://www.gesetze-im-internet.de/geg/__79.html',
    giltBis: null,
    // WICHTIG: Ein Baudenkmal ist NUR von § 80 Abs. 3–7 befreit — also von
    // Verkauf, Vermietung, Vorlage und Aushang. Die Pflichten aus § 80
    // Abs. 1 und 2 (Neubau, größere Änderung) gelten weiterhin. Die
    // verbreitete Aussage "Denkmal = gar kein Energieausweis" ist falsch.
    hinweis:
      'Nur § 80 Abs. 3–7 entfallen. Bei Neubau oder größerer Änderung ' +
      '(§ 80 Abs. 1 und 2) bleibt die Pflicht bestehen.',
  },

  /* ── Bedarfs- oder Verbrauchsausweis ──────────────────────────────────── */

  bedarfspflicht_altbau: {
    zitat: '§ 80 Abs. 3 Sätze 2 bis 4 GEG',
    wortlaut:
      'In den Fällen des Satzes 1 ist für Wohngebäude, die weniger als fünf ' +
      'Wohnungen haben und für die der Bauantrag vor dem 1. November 1977 ' +
      'gestellt worden ist, ein Energiebedarfsausweis auszustellen. Satz 2 ' +
      'ist nicht anzuwenden, wenn das Wohngebäude 1. schon bei der ' +
      'Baufertigstellung das Anforderungsniveau der Wärmeschutzverordnung ' +
      'vom 11. August 1977 (BGBl. I S. 1554) erfüllt hat oder 2. durch ' +
      'spätere Änderungen mindestens auf das in Nummer 1 bezeichnete ' +
      'Anforderungsniveau gebracht worden ist.',
    quelle: 'https://www.gesetze-im-internet.de/geg/__80.html',
    giltBis: null,
    // Vom GModG (Stufe 2) aufgehoben: der Verbrauchsausweis wird dann auch
    // für Altbau-Wohngebäude zulässig. Datum erst nach Verkündung eintragen.
    abgeloestDurch: 'gmodg_stufe2',
  },

  freie_wahl: {
    zitat: '§ 79 Abs. 1 Satz 2 GEG',
    wortlaut:
      'Ein Energieausweis ist als Energiebedarfsausweis oder als ' +
      'Energieverbrauchsausweis nach Maßgabe der §§ 80 bis 86 auszustellen.',
    quelle: 'https://www.gesetze-im-internet.de/geg/__79.html',
    giltBis: null,
  },

  /* ── Vorlage & Übergabe ───────────────────────────────────────────────── */

  vorlagepflicht: {
    zitat: '§ 80 Abs. 4 Sätze 1 und 5 GEG (für Vermietung über Abs. 5)',
    wortlaut:
      'Im Falle eines Verkaufs oder der Bestellung eines Rechts im Sinne des ' +
      'Absatzes 3 Satz 1 hat der Verkäufer oder der Immobilienmakler dem ' +
      'potenziellen Käufer spätestens bei der Besichtigung einen ' +
      'Energieausweis oder eine Kopie hiervon vorzulegen. […] Unverzüglich ' +
      'nach Abschluss des Kaufvertrages hat der Verkäufer oder der ' +
      'Immobilienmakler dem Käufer den Energieausweis oder eine Kopie ' +
      'hiervon zu übergeben.',
    quelle: 'https://www.gesetze-im-internet.de/geg/__80.html',
    giltBis: null,
  },

  /* ── Immobilienanzeige ────────────────────────────────────────────────── */

  anzeige_pflichtangaben: {
    zitat: '§ 87 Abs. 1 GEG',
    wortlaut:
      'Wird vor dem Verkauf, der Vermietung, der Verpachtung oder dem Leasing ' +
      '[…] eine Immobilienanzeige in kommerziellen Medien aufgegeben und ' +
      'liegt zu diesem Zeitpunkt ein Energieausweis vor, so hat der ' +
      'Verkäufer, der Vermieter, der Verpächter, der Leasinggeber oder der ' +
      'Immobilienmakler […] sicherzustellen, dass die Immobilienanzeige ' +
      'folgende Pflichtangaben enthält: 1. die Art des Energieausweises […], ' +
      '2. den im Energieausweis genannten Wert des Endenergiebedarfs oder des ' +
      'Endenergieverbrauchs für das Gebäude, 3. die im Energieausweis ' +
      'genannten wesentlichen Energieträger für die Heizung des Gebäudes, ' +
      '4. bei einem Wohngebäude das im Energieausweis genannte Baujahr und ' +
      '5. bei einem Wohngebäude die im Energieausweis genannte ' +
      'Energieeffizienzklasse.',
    quelle: 'https://www.gesetze-im-internet.de/geg/__87.html',
    giltBis: null,
    abgeloestDurch: 'gmodg_stufe2',
    // Genau fünf Angaben. Treibhausgasemissionen gehören NICHT dazu — sie
    // stehen nach § 85 im Ausweis selbst, nicht in der Anzeige.
    hinweis: 'Genau fünf Angaben. Treibhausgasemissionen gehören nicht in die Anzeige.',
  },

  anzeige_nichtwohngebaeude: {
    zitat: '§ 87 Abs. 2 GEG',
    wortlaut:
      'Bei einem Nichtwohngebäude ist bei einem Energiebedarfsausweis und bei ' +
      'einem Energieverbrauchsausweis als Pflichtangabe nach Absatz 1 Nummer 2 ' +
      'der Endenergiebedarf oder Endenergieverbrauch sowohl für Wärme als auch ' +
      'für Strom jeweils getrennt aufzuführen.',
    quelle: 'https://www.gesetze-im-internet.de/geg/__87.html',
    giltBis: null,
  },

  bussgeld: {
    zitat: '§ 108 Abs. 1 Nr. 27 i. V. m. Abs. 2 Nr. 2 GEG',
    wortlaut:
      'Ordnungswidrig handelt, wer […] entgegen § 87 Absatz 1, auch in ' +
      'Verbindung mit Absatz 2, nicht sicherstellt, dass die ' +
      'Immobilienanzeige die dort genannten Pflichtangaben enthält. […] Die ' +
      'Ordnungswidrigkeit kann geahndet werden […] in den Fällen des ' +
      'Absatzes 1 Nummer 21 bis 28 mit einer Geldbuße bis zu zehntausend Euro.',
    quelle: 'https://www.gesetze-im-internet.de/geg/__108.html',
    betrag: 10000,
    giltBis: null,
    // Die vielzitierten "15.000 €" stammen aus der EnEV und sind für den
    // Energieausweis falsch. § 108 Abs. 2 Nr. 2 GEG: zehntausend Euro.
    hinweis: 'Nicht 15.000 € — das ist eine veraltete EnEV-Zahl.',
  },

  /* ── Gültigkeit & Effizienzklassen ────────────────────────────────────── */

  gueltigkeit: {
    zitat: '§ 79 Abs. 3 GEG',
    wortlaut:
      'Ein Energieausweis ist für eine Gültigkeitsdauer von zehn Jahren ' +
      'auszustellen. Unabhängig davon verliert er seine Gültigkeit, wenn nach ' +
      '§ 80 Absatz 2 ein neuer Energieausweis erforderlich wird.',
    quelle: 'https://www.gesetze-im-internet.de/geg/__79.html',
    jahre: 10,
    giltBis: null,
  },

  effizienzklassen: {
    zitat: '§ 86 GEG i. V. m. Anlage 10',
    wortlaut:
      'Im Energieausweis ist die Energieeffizienzklasse des Wohngebäudes ' +
      'entsprechend der Einteilung nach Absatz 2 in Verbindung mit Anlage 10 ' +
      'anzugeben. Die Energieeffizienzklassen gemäß Anlage 10 ergeben sich ' +
      'unmittelbar aus dem Endenergieverbrauch oder Endenergiebedarf.',
    quelle: 'https://www.gesetze-im-internet.de/geg/anlage_10.html',
    giltBis: null,
    // Gilt für WOHNgebäude. Das GModG bringt für NICHTwohngebäude eine
    // eigene A–G-Skala (Anlage 10a). Ob sich für Wohngebäude etwas ändert,
    // ist widersprüchlich berichtet — bis zur Verkündung bleibt A+–H.
    abgeloestDurch: null,
    unbestaetigt:
      'Ob das GModG die Wohngebäude-Skala auf A–G umstellt, ist unbestätigt. ' +
      'Bis zur Verkündung gilt unverändert A+ bis H nach Anlage 10.',
  },

  aushangpflicht: {
    zitat: '§ 80 Abs. 6 und 7 GEG',
    wortlaut:
      'Der Eigentümer eines Gebäudes, in dem sich mehr als 250 Quadratmeter ' +
      'Nutzfläche mit starkem Publikumsverkehr befinden, der auf behördlicher ' +
      'Nutzung beruht, hat sicherzustellen, dass für das Gebäude ein ' +
      'Energieausweis ausgestellt wird. Der Eigentümer hat den nach Satz 1 ' +
      'ausgestellten Energieausweis an einer für die Öffentlichkeit gut ' +
      'sichtbaren Stelle auszuhängen.',
    quelle: 'https://www.gesetze-im-internet.de/geg/__80.html',
    giltBis: null,
  },
};

/* ── GEG Anlage 10 — Energieeffizienzklassen von Wohngebäuden ───────────────
   Endenergie in kWh/(m²·a), bezogen auf die Gebäudenutzfläche.
   Verbatim aus Anlage 10: A+ ≤30, A ≤50, B ≤75, C ≤100, D ≤130, E ≤160,
   F ≤200, G ≤250, H >250.                                                   */
EAR.KLASSEN = [
  { k: 'A+', max: 30,       varName: '--k-aplus' },
  { k: 'A',  max: 50,       varName: '--k-a' },
  { k: 'B',  max: 75,       varName: '--k-b' },
  { k: 'C',  max: 100,      varName: '--k-c' },
  { k: 'D',  max: 130,      varName: '--k-d' },
  { k: 'E',  max: 160,      varName: '--k-e' },
  { k: 'F',  max: 200,      varName: '--k-f' },
  { k: 'G',  max: 250,      varName: '--k-g' },
  { k: 'H',  max: Infinity, varName: '--k-h' },
];

EAR.klasseFuer = function (kwh) {
  for (var i = 0; i < EAR.KLASSEN.length; i++) {
    if (kwh <= EAR.KLASSEN[i].max) return EAR.KLASSEN[i];
  }
  return EAR.KLASSEN[EAR.KLASSEN.length - 1];
};

/* Wesentliche Energieträger — § 87 Abs. 1 Nr. 3 verlangt die Angabe des
   im Ausweis genannten wesentlichen Energieträgers für die Heizung. */
EAR.TRAEGER = [
  { v: 'gas',   label: 'Erdgas' },
  { v: 'oel',   label: 'Heizöl' },
  { v: 'fern',  label: 'Fernwärme' },
  { v: 'strom', label: 'Strom / Wärmepumpe' },
  { v: 'holz',  label: 'Holz / Pellets' },
];

/* ── GModG-Zeitplan ────────────────────────────────────────────────────────
   Nur gesichert Bekanntes. Jede Angabe, deren Datum noch offen ist, trägt
   `datum: null` und wird auf der Seite ausdrücklich als "noch nicht
   verkündet" ausgewiesen — es wird kein "gilt ab" behauptet.              */
EAR.GMODG = {
  beschlossen: '2026-07-10',
  beschlussHinweis:
    'Der Bundestag hat das Gebäudemodernisierungsgesetz am 10. Juli 2026 in ' +
    'dritter Lesung beschlossen; der Bundesrat hat zugestimmt.',
  verkuendet: null,
  stufen: [
    {
      nr: 1,
      titel: 'Umbenennung und Heizungsrecht',
      datum: null,
      wann: 'Tag nach der Verkündung',
      inhalt: 'Das GEG wird zum GModG. Das Heizungsrecht wird neu gefasst.',
    },
    {
      nr: 2,
      titel: 'Energieausweis-Paket',
      datum: null,
      wann: 'etwa sechs Monate nach der Verkündung',
      inhalt:
        'Neufassung der §§ 79, 81, 82, 85 und 87. Für Altbau-Wohngebäude ' +
        'soll die Pflicht zum Bedarfsausweis entfallen; der ' +
        'Verbrauchsausweis soll auf Wohngebäude beschränkt werden.',
      unbestaetigt: true,
    },
  ],
};

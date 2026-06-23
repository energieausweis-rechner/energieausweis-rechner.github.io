/* Energieausweis Rechner – "Welcher Ausweis ist nötig?" (vanilla JS, no deps) */

document.getElementById('year').textContent = new Date().getFullYear();

/* Decorative A+ → H Effizienzband in the header (brand identity, non-interactive) */
const BAND = [
  { name: 'A+', color: 'var(--c-aplus)' },
  { name: 'A',  color: 'var(--c-a)' },
  { name: 'B',  color: 'var(--c-b)' },
  { name: 'C',  color: 'var(--c-c)' },
  { name: 'D',  color: 'var(--c-d)' },
  { name: 'E',  color: 'var(--c-e)' },
  { name: 'F',  color: 'var(--c-f)' },
  { name: 'G',  color: 'var(--c-g)' },
  { name: 'H',  color: 'var(--c-h)' }
];
const heroBand = document.getElementById('heroBand');
if (heroBand) {
  heroBand.innerHTML = BAND.map(c =>
    `<span class="band-seg" style="background:${c.color}">${c.name}</span>`
  ).join('');
}

/* ─────────────────────────────────────────────────────────────────
   Welcher Energieausweis ist nötig?
   Decision logic based on GEG §§79–80:
   - Neubau                                  → Bedarfsausweis
   - Bestand, Nichtwohngebäude               → freie Wahl
   - Bestand, Wohngebäude, ≥ 5 Wohnungen     → freie Wahl
   - Bestand, Wohngebäude, < 5 Wohnungen,
       Bauantrag ab 01.11.1977               → freie Wahl
   - Bestand, Wohngebäude, < 5 Wohnungen,
       Bauantrag vor 01.11.1977,
         modernisiert auf WSchV-77-Niveau    → freie Wahl
         nicht modernisiert                  → Bedarfsausweis (Pflicht)
   ───────────────────────────────────────────────────────────────── */

const RESULTS = {
  bedarf: {
    type: 'pflicht',
    icon: '📐',
    tag: 'Bedarfsausweis – Pflicht',
    title: 'Bedarfsausweis erforderlich',
    text: 'Für Ihr Gebäude schreibt das Gebäudeenergiegesetz den aufwendigeren Bedarfsausweis vor. Er bewertet die Bausubstanz (Dämmung, Fenster, Heizung) unabhängig vom Heizverhalten der Bewohner.'
  },
  wahl: {
    type: 'wahl',
    icon: '✅',
    tag: 'Freie Wahl',
    title: 'Sie dürfen frei wählen',
    text: 'Für Ihr Gebäude können Sie zwischen Verbrauchsausweis und Bedarfsausweis wählen. Der Verbrauchsausweis ist meist günstiger; der Bedarfsausweis ist genauer und unabhängig vom Nutzerverhalten.'
  }
};

const STEPS = {
  start: {
    q: 'Worum handelt es sich?',
    options: [
      { label: 'Neubau (Neubauvorhaben)', next: () => result('bedarf') },
      { label: 'Bestandsgebäude', next: () => goto('art') }
    ]
  },
  art: {
    q: 'Was für ein Gebäude ist es?',
    options: [
      { label: 'Wohngebäude', next: () => goto('einheiten') },
      { label: 'Nichtwohngebäude (z. B. Gewerbe)', next: () => result('wahl') }
    ]
  },
  einheiten: {
    q: 'Wie viele Wohnungen hat das Gebäude?',
    options: [
      { label: 'Weniger als 5 Wohnungen', next: () => goto('baujahr') },
      { label: '5 oder mehr Wohnungen', next: () => result('wahl') }
    ]
  },
  baujahr: {
    q: 'Wann wurde der Bauantrag gestellt?',
    options: [
      { label: 'Vor dem 1. November 1977', next: () => goto('modernisiert') },
      { label: 'Am oder nach dem 1. November 1977', next: () => result('wahl') }
    ]
  },
  modernisiert: {
    q: 'Wurde das Gebäude energetisch modernisiert (mindestens auf den Standard der Wärmeschutzverordnung 1977)?',
    options: [
      { label: 'Ja, modernisiert', next: () => result('wahl') },
      { label: 'Nein / unbekannt', next: () => result('bedarf') }
    ]
  }
};

const ORDER = ['start', 'art', 'einheiten', 'baujahr', 'modernisiert'];
let history = ['start'];

const stepEl = document.getElementById('wizardStep');
const barEl = document.getElementById('wizardBar');

function progress() {
  const idx = ORDER.indexOf(history[history.length - 1]);
  const pct = Math.round(((idx + 1) / (ORDER.length + 1)) * 100);
  barEl.style.width = pct + '%';
}

function renderStep(key) {
  const step = STEPS[key];
  progress();
  const opts = step.options.map((o, i) =>
    `<button class="wizard-opt" data-i="${i}">${o.label}</button>`
  ).join('');
  const back = history.length > 1
    ? `<button class="wizard-back" id="wizardBack">← Zurück</button>` : '';

  stepEl.innerHTML = `
    <p class="wizard-q">${step.q}</p>
    <div class="wizard-options">${opts}</div>
    ${back}
  `;

  stepEl.querySelectorAll('.wizard-opt').forEach(btn => {
    btn.addEventListener('click', () => step.options[+btn.dataset.i].next());
  });
  const backBtn = document.getElementById('wizardBack');
  if (backBtn) backBtn.addEventListener('click', goBack);
}

function goto(key) {
  history.push(key);
  renderStep(key);
}

function goBack() {
  if (history.length > 1) {
    history.pop();
    renderStep(history[history.length - 1]);
  }
}

function result(kind) {
  const r = RESULTS[kind];
  barEl.style.width = '100%';
  stepEl.innerHTML = `
    <div class="wizard-result">
      <div class="res-icon">${r.icon}</div>
      <h3>${r.title}</h3>
      <span class="res-tag ${r.type}">${r.tag}</span>
      <p>${r.text}</p>
      <button class="btn btn-ghost" id="wizardRestart">Neu starten</button>
    </div>
  `;
  document.getElementById('wizardRestart').addEventListener('click', () => {
    history = ['start'];
    renderStep('start');
  });
}

renderStep('start');

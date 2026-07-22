/* ─────────────────────────────────────────────────────────────────────────
   widgets.js — the non-wizard tools, plus page chrome.

   Split from tools.js (which owns the question/result state machine) so
   neither file grows past the point of being readable. Loads after
   rules.js and tools.js.
   ───────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var el = EAR.el;
  var cite = EAR.cite;
  function $(s, r) { return (r || document).querySelector(s); }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  /* A segmented control. Returns the wrapper; calls onChange(value). */
  function seg(name, options, value, onChange) {
    var wrap = el('div', { class: 'seg', role: 'group', 'aria-label': name });
    options.forEach(function (o) {
      wrap.appendChild(el('button', {
        type: 'button', text: o.label,
        'aria-pressed': String(o.v === value),
        onclick: function () { onChange(o.v); },
      }));
    });
    return wrap;
  }

  function field(label, hint, control) {
    return el('div', { class: 'field' }, [
      el('span', { class: 'lbl' }, [
        document.createTextNode(label),
        hint ? el('span', { class: 'hint', text: ' — ' + hint }) : null,
      ]),
      control,
    ]);
  }

  /* ── Effizienzklassen-Rechner (GEG Anlage 10) ─────────────────────────── */

  EAR.mountEffizienz = function (mount) {
    var state = { kwh: '' };

    function draw() {
      clear(mount);
      var val = parseFloat(String(state.kwh).replace(',', '.'));
      var has = !isNaN(val) && val >= 0;
      var kl = has ? EAR.klasseFuer(val) : null;

      var input = el('input', {
        type: 'number', min: '0', step: '1', inputmode: 'decimal',
        value: state.kwh, id: 'eff-kwh',
        'aria-describedby': 'eff-help',
        oninput: function (e) { state.kwh = e.target.value; draw(); },
      });

      mount.appendChild(field(
        'Endenergie-Kennwert in kWh/(m²·a)',
        'die Zahl auf Seite 2 Ihres Energieausweises',
        input
      ));
      mount.appendChild(el('p', { id: 'eff-help', class: 'hint',
        text: 'Beispiele: 60 = gut gedämmter Neubau · 120 = saniertes Haus · 220 = unsanierter Altbau.' }));

      mount.appendChild(el('div', { class: 'seg' }, [60, 120, 220].map(function (v) {
        return el('button', {
          type: 'button', text: v + ' kWh',
          onclick: function () { state.kwh = String(v); draw(); },
        });
      })));

      /* The A+ → H band, active class highlighted */
      mount.appendChild(el('div', { class: 'scale' }, EAR.KLASSEN.map(function (k) {
        var on = kl && kl.k === k.k;
        return el('span', {
          class: 'k' + (on ? ' on' : ''),
          style: 'background: var(' + k.varName + ')',
          text: k.k,
        });
      })));
      mount.appendChild(el('div', { class: 'scale-ends' }, [
        el('span', { text: 'sparsam' }), el('span', { text: 'hoher Verbrauch' }),
      ]));

      if (has) {
        var i = EAR.KLASSEN.indexOf(kl);
        var low = i === 0 ? 0 : EAR.KLASSEN[i - 1].max;
        var range = kl.max === Infinity
          ? 'über ' + low + ' kWh/(m²·a)'
          : 'über ' + low + ' bis ' + kl.max + ' kWh/(m²·a)';
        if (i === 0) range = 'bis ' + kl.max + ' kWh/(m²·a)';

        mount.appendChild(el('div', { class: 'klass-out anim', 'aria-live': 'polite' }, [
          el('span', { class: 'big', style: 'background: var(' + kl.varName + ')', text: kl.k }),
          el('div', {}, [
            el('strong', { text: 'Klasse ' + kl.k }),
            el('div', { class: 'sub',
              text: 'Ihr Kennwert: ' + val + ' kWh/(m²·a) · Bereich der Klasse ' + kl.k + ': ' + range }),
          ]),
        ]));
        EAR.carry('kennwert', String(val));
        EAR.carry('klasse', kl.k);
      }

      mount.appendChild(cite('effizienzklassen'));
    }
    draw();
  };

  /* ── Anzeigentext-Generator (§ 87 GEG) ────────────────────────────────────
     Emits exactly the five Pflichtangaben of § 87 Abs. 1 — no more.
     Treibhausgasemissionen are deliberately NOT included: they belong in
     the Ausweis itself (§ 85), not in the Immobilienanzeige.             */

  EAR.mountInserat = function (mount) {
    var state = {
      art: 'verbrauch',
      kennwert: EAR.recall('kennwert') || '',
      traeger: 'gas',
      baujahr: '',
      copied: false,
    };

    document.addEventListener('ear:carry', function (e) {
      if (e.detail.key === 'art' && (e.detail.value === 'bedarf' || e.detail.value === 'verbrauch')) {
        state.art = e.detail.value; draw();
      }
      if (e.detail.key === 'kennwert' && !state.kennwert) { state.kennwert = e.detail.value; draw(); }
    });

    function buildText() {
      var v = parseFloat(String(state.kennwert).replace(',', '.'));
      if (isNaN(v)) return null;
      var kl = EAR.klasseFuer(v);
      var traeger = (EAR.TRAEGER.filter(function (t) { return t.v === state.traeger; })[0] || {}).label;
      var artLabel = state.art === 'bedarf' ? 'Energiebedarfsausweis' : 'Energieverbrauchsausweis';
      var wertLabel = state.art === 'bedarf' ? 'Endenergiebedarf' : 'Endenergieverbrauch';
      var lines = [
        'Art des Energieausweises: ' + artLabel,
        wertLabel + ': ' + v + ' kWh/(m²·a)',
        'Wesentlicher Energieträger der Heizung: ' + traeger,
        'Baujahr des Gebäudes: ' + (state.baujahr || '—'),
        'Energieeffizienzklasse: ' + kl.k,
      ];
      return { text: lines.join('\n'), klasse: kl.k, ok: !!state.baujahr };
    }

    function draw() {
      clear(mount);

      mount.appendChild(field('Art des Ausweises', null, seg('Ausweis-Art', [
        { v: 'verbrauch', label: 'Verbrauchsausweis' },
        { v: 'bedarf', label: 'Bedarfsausweis' },
      ], state.art, function (v) { state.art = v; state.copied = false; draw(); })));

      mount.appendChild(field(
        (state.art === 'bedarf' ? 'Endenergiebedarf' : 'Endenergieverbrauch') + ' in kWh/(m²·a)',
        'Seite 2 des Ausweises',
        el('input', {
          type: 'number', min: '0', step: '1', inputmode: 'decimal', value: state.kennwert,
          oninput: function (e) { state.kennwert = e.target.value; state.copied = false; draw(); },
        })
      ));

      mount.appendChild(field('Wesentlicher Energieträger für die Heizung', null,
        seg('Energieträger', EAR.TRAEGER.map(function (t) { return { v: t.v, label: t.label }; }),
          state.traeger, function (v) { state.traeger = v; state.copied = false; draw(); })));

      mount.appendChild(field('Baujahr des Gebäudes', 'Seite 1 des Ausweises',
        el('input', {
          type: 'number', min: '1800', max: '2100', step: '1', inputmode: 'numeric',
          value: state.baujahr,
          oninput: function (e) { state.baujahr = e.target.value; state.copied = false; draw(); },
        })));

      var built = buildText();
      if (built) {
        mount.appendChild(el('h3', { text: 'Ihr Anzeigentext' }));
        mount.appendChild(el('pre', { class: 'output', 'aria-live': 'polite', text: built.text }));
        mount.appendChild(el('div', { class: 'wizard-actions' }, [
          el('button', {
            class: 'btn-ghost', type: 'button', text: '⧉ Text kopieren',
            onclick: function () {
              navigator.clipboard.writeText(built.text).then(function () {
                state.copied = true; draw();
              }, function () { /* clipboard blocked */ });
            },
          }),
          state.copied ? el('span', { class: 'copied', text: 'In die Zwischenablage kopiert ✓' }) : null,
        ]));
        if (!built.ok) {
          mount.appendChild(el('p', { class: 'hint',
            text: 'Ergänzen Sie noch das Baujahr – bei Wohngebäuden ist es eine Pflichtangabe.' }));
        }
        mount.appendChild(el('p', {
          text: 'Fügen Sie diesen Block bei ImmoScout24, Kleinanzeigen und Co. in ' +
                'die Beschreibung ein. Damit sind die fünf Pflichtangaben erfüllt.',
        }));
      }

      mount.appendChild(cite('anzeige_pflichtangaben'));
      mount.appendChild(el('details', {}, [
        el('summary', { text: 'Ich vermiete ein Gewerbeobjekt – gilt etwas anderes?' }),
        el('p', { text: 'Ja. Bei Nichtwohngebäuden müssen Endenergiebedarf bzw. ' +
                        '-verbrauch für Wärme und für Strom getrennt angegeben werden. ' +
                        'Baujahr und Effizienzklasse sind dort keine Pflichtangaben. ' +
                        'Dieser Generator ist auf Wohngebäude ausgelegt.' }),
        cite('anzeige_nichtwohngebaeude'),
      ]));
      mount.appendChild(el('details', {}, [
        el('summary', { text: 'Was passiert, wenn die Angaben fehlen?' }),
        el('p', { text: 'Das Fehlen der Pflichtangaben ist eine Ordnungswidrigkeit. ' +
                        'Sie kann mit einem Bußgeld von bis zu 10.000 € geahndet werden. ' +
                        'Die oft genannten 15.000 € stammen aus der alten EnEV und ' +
                        'gelten hier nicht.' }),
        cite('bussgeld'),
      ]));
    }
    draw();
  };

  /* ── Kostenrechner ────────────────────────────────────────────────────────
     Richtwerte, ausdrücklich als Spanne gekennzeichnet. Es werden keine
     Anbieter genannt, solange EAR.PARTNERS leer ist.                     */

  var PREISE = {
    // [art][weg][gebäude] → [von, bis] in Euro
    verbrauch: {
      online:  { efh: [50, 100],  mfh: [60, 120],  nwg: [90, 200] },
      vorort:  { efh: [100, 200], mfh: [150, 300], nwg: [250, 500] },
    },
    bedarf: {
      online:  { efh: [80, 150],  mfh: [150, 350], nwg: [300, 700] },
      vorort:  { efh: [300, 600], mfh: [600, 1200], nwg: [800, 2000] },
    },
  };

  EAR.mountKosten = function (mount) {
    var state = { art: EAR.recall('art') || 'verbrauch', weg: 'online', typ: 'efh' };

    document.addEventListener('ear:carry', function (e) {
      if (e.detail.key === 'art') { state.art = e.detail.value; draw(); }
    });

    function draw() {
      clear(mount);

      mount.appendChild(field('Art des Ausweises', null, seg('Ausweis-Art', [
        { v: 'verbrauch', label: 'Verbrauchsausweis' },
        { v: 'bedarf', label: 'Bedarfsausweis' },
      ], state.art, function (v) { state.art = v; draw(); })));

      mount.appendChild(field('Erstellungsweg', null, seg('Erstellungsweg', [
        { v: 'online', label: 'Online, ohne Termin' },
        { v: 'vorort', label: 'Energieberater vor Ort' },
      ], state.weg, function (v) { state.weg = v; draw(); })));

      mount.appendChild(field('Gebäude', null, seg('Gebäudetyp', [
        { v: 'efh', label: 'Ein-/Zweifamilienhaus' },
        { v: 'mfh', label: 'Mehrfamilienhaus' },
        { v: 'nwg', label: 'Gewerbe' },
      ], state.typ, function (v) { state.typ = v; draw(); })));

      var p = PREISE[state.art][state.weg][state.typ];
      mount.appendChild(el('div', { class: 'klass-out anim', 'aria-live': 'polite' }, [
        el('div', {}, [
          el('strong', { style: 'font-size: var(--fs-h3)',
            text: 'ca. ' + p[0] + ' – ' + p[1] + ' €' }),
          el('div', { class: 'sub', text: 'Richtwert, je nach Anbieter und Gebäude.' }),
        ]),
      ]));

      if (state.weg === 'vorort' && state.art === 'bedarf') {
        mount.appendChild(el('p', { class: 'hint',
          text: 'Ein Vor-Ort-Termin ist gesetzlich nicht vorgeschrieben – ' +
                'auch ein Bedarfsausweis darf auf Grundlage der von Ihnen ' +
                'gelieferten Gebäudedaten erstellt werden. Der Termin bringt ' +
                'dafür belastbarere Werte und Sanierungshinweise.' }));
      }

      /* Provider block stays hidden until real partners are contracted. */
      var partners = EAR.PARTNERS.map(function (p2) {
        return EAR.renderPartnerCta({ partner: p2 });
      }).filter(Boolean);
      if (partners.length) {
        mount.appendChild(el('h3', { text: 'Anbieter' }));
        partners.forEach(function (n) { mount.appendChild(n); });
      }
    }
    draw();
  };

  /* ── GModG-Zeitplan ───────────────────────────────────────────────────────
     Solange nichts verkündet ist, wird ausdrücklich KEIN Datum behauptet. */

  EAR.mountGmodg = function (mount) {
    var g = EAR.GMODG;
    clear(mount);

    mount.appendChild(el('div', { class: 'result ' + (g.verkuendet ? 'yes' : 'no') }, [
      el('span', { class: 'badge', text: g.verkuendet ? 'Verkündet' : 'Beschlossen, noch nicht verkündet' }),
      el('h3', { text: g.verkuendet
        ? 'Das GModG ist verkündet.'
        : 'Das Gesetz ist beschlossen – aber noch nicht verkündet.' }),
      el('p', { class: 'lead', text: g.beschlussHinweis + ' Solange die ' +
        'Verkündung im Bundesgesetzblatt aussteht, steht kein Datum fest, ab ' +
        'dem die neuen Regeln greifen. Bis dahin gilt unverändert das GEG.' }),
    ]));

    mount.appendChild(el('h3', { text: 'Was sich wann ändern soll' }));
    mount.appendChild(el('div', { class: 'table-wrap' }, [
      el('table', {}, [
        el('thead', {}, [el('tr', {}, [
          el('th', { text: 'Stufe' }), el('th', { text: 'Wann' }), el('th', { text: 'Inhalt' }),
        ])]),
        el('tbody', {}, g.stufen.map(function (s) {
          return el('tr', {}, [
            el('td', { text: String(s.nr) }),
            el('td', { text: s.datum || s.wann + ' (Datum offen)' }),
            el('td', {}, [
              document.createTextNode(s.inhalt),
              s.unbestaetigt ? el('div', { class: 'hint', text: 'Noch nicht im Gesetzestext bestätigt.' }) : null,
            ]),
          ]);
        })),
      ]),
    ]));

    mount.appendChild(el('div', { class: 'warn' }, [
      el('span', { class: 'mark', text: '!' }),
      el('span', { text: 'Wichtig für Sie: Wenn Sie jetzt verkaufen oder ' +
        'vermieten, brauchen Sie den Ausweis jetzt – Warten ist keine Option. ' +
        'Ein heute ausgestellter Energieausweis bleibt zehn Jahre gültig.' }),
    ]));
    mount.appendChild(cite('gueltigkeit'));
  };

  /* ── Sticky nav: highlight the section in view, keep the hash honest ───── */

  function initNav() {
    var nav = $('.toolnav');
    if (!nav) return;
    var links = [].slice.call(nav.querySelectorAll('a'));
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });

    var sections = links
      .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
      .filter(Boolean);

    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var a = byId[e.target.id];
        if (a) a.setAttribute('aria-current', 'true');
        // Reflect position in the URL without spamming history.
        if (history.replaceState) history.replaceState(null, '', '#' + e.target.id);
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  function initToTop() {
    var btn = el('button', {
      class: 'totop', type: 'button', 'aria-label': 'Nach oben', text: '↑',
      onclick: function () { window.scrollTo({ top: 0, behavior: 'smooth' }); },
    });
    document.body.appendChild(btn);
    window.addEventListener('scroll', function () {
      btn.classList.toggle('show', window.scrollY > 800);
    }, { passive: true });
  }

  /* ── Boot ─────────────────────────────────────────────────────────────────
     Only the main flow builds on load. The other tools render when their
     section first comes near the viewport, so a long page stays fast.    */

  function lazy(id, fn) {
    var host = document.getElementById(id);
    if (!host) return;
    var mount = host.querySelector('[data-mount]');
    if (!mount) return;
    var done = false;
    function run() { if (done) return; done = true; fn(mount); }
    if (!('IntersectionObserver' in window)) { run(); return; }
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { run(); io.disconnect(); }
    }, { rootMargin: '400px' });
    io.observe(host);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var main = $('#rechner [data-mount]');
    if (main) {
      EAR.renderWizard(main, EAR.flows.main, { steps: ['Situation', 'Gebäude', 'Ergebnis'] });
    }
    lazy('inserat', EAR.mountInserat);
    lazy('effizienzklasse', EAR.mountEffizienz);
    lazy('kosten', EAR.mountKosten);
    lazy('gmodg', EAR.mountGmodg);
    initNav();
    initToTop();

    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  });
})();

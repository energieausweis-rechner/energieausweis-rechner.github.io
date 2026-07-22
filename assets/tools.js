/* ─────────────────────────────────────────────────────────────────────────
   tools.js — shared engine for every tool on the page.

   Ported to vanilla JS from the Claude Design reference component
   (Energieausweis-Tools.dc.html), which targets a React runtime.

   Design rules enforced here rather than left to each tool:
   • Every legal claim reads its § and Wortlaut from EAR.RULES — never inline.
   • renderPartnerCta() is the ONLY path that can emit an outbound partner
     link, so the "Anzeige" label and rel="sponsored" cannot be forgotten.
   • Results are announced via aria-live and are keyboard-reachable.
   • No cookies, no localStorage. sessionStorage only, for the handoff
     between tools — strictly necessary for the requested service
     (§ 25 Abs. 2 Nr. 2 TDDDG), documented in /datenschutz/.
   ───────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var R = EAR.RULES;

  /* ── DOM helpers ──────────────────────────────────────────────────────── */

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k === 'text') n.textContent = v;
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function $(sel, root) { return (root || document).querySelector(sel); }

  EAR.el = el;

  /* ── Cross-tool handoff ───────────────────────────────────────────────── */

  EAR.carry = function (k, v) {
    try { sessionStorage.setItem('ear.' + k, v); } catch (e) { /* private mode */ }
    document.dispatchEvent(new CustomEvent('ear:carry', { detail: { key: k, value: v } }));
  };
  EAR.recall = function (k) {
    try { return sessionStorage.getItem('ear.' + k); } catch (e) { return null; }
  };

  /* ── Icons (from the reference design) ────────────────────────────────── */

  var S = 'fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
  function svg(paths) {
    return '<svg width="40" height="40" viewBox="0 0 64 64" aria-hidden="true" ' + S + '>' + paths + '</svg>';
  }
  var ICONS = {
    house: svg('<path d="M12 30 32 15 52 30"/><path d="M18 28v20h28V28"/><rect x="28" y="37" width="8" height="11"/>'),
    seller: svg('<path d="M8 28 26 14 44 28"/><path d="M14 26v22h24V26"/><rect x="22" y="37" width="8" height="11"/><path d="M46 16h12v12M58 16 44 30"/>'),
    houseKey: svg('<path d="M7 28 25 14 43 28"/><path d="M13 26v22h24V26"/><rect x="21" y="37" width="8" height="11"/><circle cx="50" cy="33" r="6"/><path d="M50 39v9M50 44h5"/>'),
    crane: svg('<path d="M12 54V14h30"/><path d="M12 20 26 14"/><path d="M40 14v9"/><path d="M6 54h22"/><rect x="34" y="36" width="20" height="18"/><path d="M41 54v-9h6v9"/>'),
    buyer: svg('<circle cx="32" cy="20" r="9"/><path d="M14 52c0-10 8-16 18-16s18 6 18 16"/>'),
    building: svg('<rect x="18" y="12" width="28" height="40"/><path d="M12 52h40"/><path d="M25 20h5M35 20h5M25 29h5M35 29h5M25 38h5M35 38h5"/>'),
    columns: svg('<path d="M10 24 32 13 54 24"/><path d="M14 50h36"/><path d="M17 24v24M27 24v24M37 24v24M47 24v24"/>'),
    area: svg('<rect x="14" y="14" width="36" height="36"/><path d="M23 41 41 23"/><path d="M23 33v8h8M41 31v-8h-8"/>'),
    none: svg('<circle cx="32" cy="32" r="17"/><path d="M20 20 44 44"/>'),
    calendar: svg('<rect x="13" y="17" width="38" height="33" rx="2"/><path d="M13 27h38M23 12v9M41 12v9"/><path d="M22 36h6M36 36h6"/>'),
    calendarOld: svg('<rect x="13" y="17" width="38" height="33" rx="2"/><path d="M13 27h38M23 12v9M41 12v9"/><circle cx="32" cy="39" r="6"/><path d="M32 39v-4M32 39l4 2"/>'),
    reno: svg('<path d="M7 28 25 14 43 28"/><path d="M13 26v22h24V26"/><rect x="21" y="37" width="8" height="11"/><circle cx="50" cy="20" r="8"/><path d="M50 16v8M46 20h8"/>'),
    draft: svg('<path d="M18 8h20l10 10v38H18z"/><path d="M38 8v10h10"/><path d="M25 30h16M25 40h12"/>'),
    megaphone: svg('<path d="M14 26v12l26 12V14z"/><path d="M14 26H9v12h5"/><path d="M22 42v8h8"/><path d="M48 24c4 3 4 13 0 16"/>'),
    clock: svg('<circle cx="32" cy="34" r="20"/><path d="M32 23v11l8 6M24 8h16"/>'),
  };

  /* ── Legal citation block ─────────────────────────────────────────────── */

  function cite(ruleKey) {
    var r = R[ruleKey];
    if (!r) return null;
    var kids = [
      el('div', { class: 'src' }, [
        el('strong', { text: r.zitat }),
        el('span', { class: 'stand', text: 'Stand: ' + EAR.STAND.stand }),
      ]),
      el('blockquote', { text: '„' + r.wortlaut + '“' }),
      el('div', { class: 'src' }, [
        el('a', { href: r.quelle, rel: 'noopener', target: '_blank',
                  text: 'Gesetzestext auf gesetze-im-internet.de ↗' }),
      ]),
    ];
    if (r.hinweis) kids.splice(2, 0, el('p', { text: r.hinweis }));
    // Where the law is in flux, say so rather than implying settled certainty.
    if (r.unbestaetigt) {
      kids.splice(kids.length - 1, 0,
        el('p', { class: 'hint', text: 'Hinweis: ' + r.unbestaetigt }));
    }
    return el('div', { class: 'cite' }, kids);
  }
  EAR.cite = cite;

  /* ── Partner CTA — the single monetisation path ───────────────────────────
     § 5a Abs. 4 UWG requires the commercial purpose to be labelled at the
     link itself. A page-level disclaimer is not sufficient (LG München I,
     26.02.2019 – 33 O 2855/18; 09.07.2024 – 1 HK O 12576/23), which matters
     on a long single page. So the label, rel="sponsored" and the disclosure
     sentence are emitted together or not at all.

     EAR.PARTNERS is empty until real partners are contracted; while it is
     empty this renders nothing and no tool shows a provider block.        */

  EAR.PARTNERS = [];

  EAR.renderPartnerCta = function (opts) {
    if (!EAR.PARTNERS.length) return null;
    var p = opts.partner;
    return el('div', { class: 'partner' }, [
      el('span', { class: 'ad-label', text: 'Anzeige' }),
      el('div', {}, [
        el('strong', { text: p.name }),
        p.note ? el('div', { class: 'sub', text: p.note }) : null,
      ]),
      el('a', { class: 'cta', href: p.url, rel: 'sponsored noopener',
                target: '_blank', text: (p.cta || 'Zum Anbieter') + ' →' }),
      el('p', {
        class: 'disclosure',
        text: 'Affiliate-Link: Wenn Sie hierüber bestellen, erhalten wir eine ' +
              'Provision. Für Sie ändert sich der Preis dadurch nicht.',
      }),
    ]);
  };

  /* ── Wizard engine ────────────────────────────────────────────────────────
     A flow is fn(answers) → {view:'question', q, step} | {view:'result', r}.
     compose() chains flows so several segments read as one uninterrupted
     sequence — used for the main flow's Pflicht → Ausweis-Art merge.      */

  EAR.compose = function () {
    var segs = [].slice.call(arguments);
    return function (ans) {
      var used = 0;
      for (var i = 0; i < segs.length; i++) {
        var out = segs[i](ans.slice(used), ans);
        if (out.view !== 'continue') return out;
        used += out.consumed;
      }
      return { view: 'result', r: { tone: 'no', title: 'Kein Ergebnis.' } };
    };
  };

  function stepBar(current, labels) {
    return el('div', { class: 'steps' }, labels.map(function (l, i) {
      var n = i + 1;
      var state = n < current ? 'done' : n === current ? 'on' : '';
      return el('div', { class: 'step ' + state + (n <= current ? ' reached' : '') }, [
        n > 1 ? el('span', { class: 'line' }) : null,
        el('span', { class: 'mark', text: state === 'done' ? '✓' : String(n) }),
        el('span', { class: 'lbl', text: l }),
      ]);
    }));
  }

  EAR.renderWizard = function (mount, flow, opts) {
    opts = opts || {};
    var answers = [];

    function draw(focus) {
      var out = flow(answers);
      clear(mount);

      if (out.view === 'question') {
        var q = out.q;
        mount.appendChild(stepBar(out.step || 1, opts.steps || ['Situation', 'Gebäude', 'Ergebnis']));
        if (q.eyebrow) mount.appendChild(el('p', { class: 'eyebrow', text: q.eyebrow }));
        mount.appendChild(el('p', { class: 'q-text', text: q.text }));

        var box = el('div', { class: 'options' }, q.options.map(function (o) {
          return el('button', {
            class: 'opt', type: 'button',
            onclick: function () { answers.push(o.value); draw(true); },
          }, [
            el('span', { class: 'ico', html: ICONS[o.icon] || ICONS.house }),
            el('span', { class: 'txt' }, [
              el('span', { class: 'lbl', text: o.label }),
              o.sub ? el('span', { class: 'sub', text: o.sub }) : null,
            ]),
            el('span', { class: 'arrow', text: '→' }),
          ]);
        }));
        mount.appendChild(box);

        if (answers.length) {
          mount.appendChild(el('div', { class: 'wizard-actions' }, [
            el('button', {
              class: 'btn-ghost', type: 'button', text: '← Zurück',
              onclick: function () { answers.pop(); draw(true); },
            }),
          ]));
        }
        if (focus) { var f = $('.opt', mount); if (f) f.focus(); }
        return;
      }

      // ── Result ──
      var r = out.r;
      var card = el('div', { class: 'result anim ' + (r.tone || 'no'), tabindex: '-1' }, [
        el('span', { class: 'badge', text: r.badge || 'Ergebnis' }),
        el('h3', { text: r.title }),
        el('p', { class: 'lead', text: r.body }),
      ]);

      if (r.warn) {
        card.appendChild(el('div', { class: 'warn' }, [
          el('span', { class: 'mark', text: '!' }),
          el('span', { text: r.warn }),
        ]));
      }
      if (r.type) {
        card.appendChild(el('div', { class: 'type-out' }, [
          el('span', { text: 'Ausweis-Art: ' }),
          el('strong', { text: r.type }),
        ]));
      }
      if (r.steps) {
        card.appendChild(el('h4', { text: 'Ihre nächsten Schritte' }));
        card.appendChild(el('ol', { class: 'steps-next' },
          r.steps.map(function (s) { return el('li', { text: s }); })));
      }
      (r.cites || []).forEach(function (k) {
        var c = cite(k); if (c) card.appendChild(c);
      });
      if (r.next) {
        card.appendChild(el('a', { class: 'next-link', href: r.next.href }, [
          el('span', {}, [
            el('span', { class: 't', text: r.next.title }), el('br'),
            el('span', { class: 's', text: r.next.sub }),
          ]),
          el('span', { text: '→' }),
        ]));
      }
      if (r.carry) Object.keys(r.carry).forEach(function (k) { EAR.carry(k, r.carry[k]); });

      mount.appendChild(card);
      mount.appendChild(el('div', { class: 'wizard-actions noprint' }, [
        el('button', {
          class: 'btn-ghost', type: 'button', text: '↺ Neu starten',
          onclick: function () { answers = []; draw(true); },
        }),
        el('button', {
          class: 'btn-ghost', type: 'button', text: '← Zurück',
          onclick: function () { answers.pop(); draw(true); },
        }),
        el('button', {
          class: 'btn-ghost', type: 'button', text: 'Ergebnis drucken',
          onclick: function () { window.print(); },
        }),
      ]));
      if (focus) card.focus();
    }

    mount.setAttribute('aria-live', 'polite');
    draw(false);
  };

  /* ── The main flow: "Brauche ich einen — und welchen?" ─────────────────────
     The reference design splits this into two tools joined by a button.
     Merged here into one uninterrupted sequence.                          */

  function needCert(urgent, verb) {
    return {
      tone: urgent ? 'urgent' : 'yes',
      badge: urgent ? 'Dringend' : 'Pflicht: ja',
      verb: verb,
    };
  }

  EAR.flows = {};

  EAR.flows.main = function (ans) {
    var Q1 = {
      eyebrow: 'Frage 1', text: 'In welcher Rolle sind Sie – und was steht an?',
      options: [
        { value: 'verkauf', icon: 'seller', label: 'Ich verkaufe', sub: 'Eigentümer, Verkauf.' },
        { value: 'vermietung', icon: 'houseKey', label: 'Ich vermiete neu', sub: 'Eigentümer, neuer Mietvertrag.' },
        { value: 'neubau', icon: 'crane', label: 'Ich baue neu', sub: 'Neubau / Fertigstellung.' },
        { value: 'interessent', icon: 'buyer', label: 'Ich kaufe oder miete', sub: 'Interessent / Mieter.' },
        { value: 'bestand', icon: 'house', label: 'Nichts davon', sub: 'Selbst nutzen / Bestand.' },
      ],
    };
    if (!ans.length) return { view: 'question', q: Q1, step: 1 };
    var a1 = ans[0];

    if (a1 === 'interessent') return { view: 'result', r: {
      tone: 'no', badge: 'Für Sie kostenlos',
      title: 'Sie müssen keinen Energieausweis erstellen.',
      body: 'Als Käufer oder Mieter erstellen Sie keinen Energieausweis. ' +
            'Verkäufer bzw. Vermieter müssen ihn Ihnen spätestens bei der ' +
            'Besichtigung vorlegen und nach Vertragsabschluss übergeben – ' +
            'bestehen Sie darauf.',
      cites: ['vorlagepflicht'],
      next: { href: '#effizienzklasse', title: 'Effizienzklasse prüfen',
              sub: 'Kennwert aus dem vorgelegten Ausweis einordnen.' },
    }};

    if (a1 === 'bestand') return { view: 'result', r: {
      tone: 'no', badge: 'Pflicht: nein',
      title: 'Nein – aktuell besteht keine Pflicht.',
      body: 'Für reine Eigennutzung oder ein weiterlaufendes Mietverhältnis ' +
            'brauchen Sie keinen Energieausweis. Erst bei Verkauf oder ' +
            'Neuvermietung wird er Pflicht.',
      cites: ['pflicht_verkauf_vermietung'],
    }};

    if (a1 === 'neubau') return { view: 'result', r: {
      tone: 'yes', badge: 'Pflicht: ja',
      title: 'Ja – für den Neubau ist ein Energieausweis Pflicht.',
      body: 'Bei einem Neubau ist ausdrücklich ein Energiebedarfsausweis ' +
            'vorgeschrieben. Er wird nach Fertigstellung auf Grundlage der ' +
            'tatsächlichen Eigenschaften des Gebäudes erstellt.',
      type: 'Bedarfsausweis',
      steps: [
        'Der Ausweis wird im Zuge des Neubaus erstellt.',
        'Die Kennwerte fließen in die Bauunterlagen ein.',
        'Bei späterem Verkauf oder Vermietung vorlegen.',
      ],
      cites: ['pflicht_neubau'],
      carry: { art: 'bedarf' },
      next: { href: '#kosten', title: 'Weiter: Was kostet das?',
              sub: 'Bedarfsausweis-Preise – die Art ist bereits gesetzt.' },
    }};

    /* Verkauf / Vermietung → Ausnahmen prüfen */
    var Q2 = {
      eyebrow: 'Frage 2', text: 'Trifft eine dieser Ausnahmen auf das Gebäude zu?',
      options: [
        { value: 'denkmal', icon: 'columns', label: 'Ja, Baudenkmal', sub: 'Unter Denkmalschutz.' },
        { value: 'klein', icon: 'area', label: 'Ja, höchstens 50 m²', sub: 'Nutzfläche nicht mehr als 50 m².' },
        { value: 'keine', icon: 'none', label: 'Nein, keine davon', sub: 'Weder noch.' },
      ],
    };
    if (ans.length === 1) return { view: 'question', q: Q2, step: 1 };
    var a2 = ans[1];

    if (a2 === 'klein') return { view: 'result', r: {
      tone: 'no', badge: 'Ausnahme greift',
      title: 'Nein – hier greift eine gesetzliche Ausnahme.',
      body: 'Gebäude mit nicht mehr als 50 m² Nutzfläche gelten als „kleine ' +
            'Gebäude“. Für sie gelten die Vorschriften zum Energieausweis nicht.',
      cites: ['ausnahme_klein'],
    }};

    if (a2 === 'denkmal') return { view: 'result', r: {
      tone: 'no', badge: 'Ausnahme greift',
      title: 'Nein – für Verkauf und Vermietung entfällt die Pflicht.',
      body: 'Bei einem Baudenkmal gelten die Pflichten zu Verkauf, Vermietung, ' +
            'Vorlage und Aushang nicht. Wichtig: Das ist keine vollständige ' +
            'Befreiung – bei einem Neubau oder einer größeren Änderung des ' +
            'Gebäudes bleibt die Pflicht zum Bedarfsausweis bestehen.',
      cites: ['ausnahme_denkmal'],
    }};

    /* Wie weit ist der Vorgang? */
    var verb = ans[0] === 'verkauf' ? 'Verkauf' : 'Vermietung';
    var Q3 = {
      eyebrow: 'Frage 3', text: 'Wie weit ist Ihr ' + verb + ' schon?',
      options: [
        { value: 'vorbereitung', icon: 'draft', label: 'In Vorbereitung', sub: 'Noch kein Inserat geschaltet.' },
        { value: 'inseriert', icon: 'megaphone', label: 'Bereits inseriert', sub: 'Die Anzeige läuft schon.' },
        { value: 'notartermin', icon: 'clock', label: 'Termin steht an', sub: 'Notar / Übergabe in Kürze.' },
      ],
    };
    if (ans.length === 2) return { view: 'question', q: Q3, step: 1 };

    /* ── Segment 2: welche Art? ── */
    var Q4 = {
      eyebrow: 'Frage 4', text: 'Um was für ein Gebäude geht es?',
      options: [
        { value: 'wohn', icon: 'house', label: 'Wohngebäude', sub: 'Haus oder Wohnung.' },
        { value: 'nichtwohn', icon: 'building', label: 'Nichtwohngebäude', sub: 'Gewerbe, Büro, Halle.' },
      ],
    };
    if (ans.length === 3) return { view: 'question', q: Q4, step: 2 };

    var Q5 = {
      eyebrow: 'Frage 5', text: 'Wie viele Wohnungen hat das Gebäude?',
      options: [
        { value: 'ab5', icon: 'building', label: '5 oder mehr', sub: 'Mehrfamilienhaus.' },
        { value: 'bis4', icon: 'house', label: 'Bis zu 4', sub: 'Ein- bis Vierfamilienhaus.' },
      ],
    };
    if (ans.length === 4 && ans[3] === 'wohn') return { view: 'question', q: Q5, step: 2 };

    var Q6 = {
      eyebrow: 'Frage 6', text: 'Wann wurde der Bauantrag gestellt?',
      options: [
        { value: 'ab1977', icon: 'calendar', label: 'Am oder nach dem 1.11.1977', sub: 'Oder später gebaut.' },
        { value: 'vor1977', icon: 'calendarOld', label: 'Vor dem 1.11.1977', sub: 'Älteres Gebäude.' },
      ],
    };
    if (ans.length === 5 && ans[4] === 'bis4') return { view: 'question', q: Q6, step: 2 };

    var Q7 = {
      eyebrow: 'Frage 7 von 7',
      text: 'Wurde das Haus auf den Dämmstandard von 1977 gebracht?',
      options: [
        { value: 'ja', icon: 'reno', label: 'Ja, modernisiert', sub: 'Fenster, Dach oder Fassade gedämmt.' },
        { value: 'nein', icon: 'house', label: 'Nein / unsicher', sub: 'Weitgehend im Originalzustand.' },
      ],
    };
    if (ans.length === 6 && ans[5] === 'vor1977') return { view: 'question', q: Q7, step: 2 };

    /* ── Combined result ── */
    var a3 = ans[2];
    var urgent = a3 === 'inseriert' || a3 === 'notartermin';
    var head = needCert(urgent, verb);

    // Bedarfsausweis is only mandatory for: Wohngebäude, ≤4 Wohnungen,
    // Bauantrag vor 01.11.1977, not brought to WSchV-1977 level.
    var bedarfPflicht =
      ans[3] === 'wohn' && ans[4] === 'bis4' && ans[5] === 'vor1977' && ans[6] === 'nein';

    var warn = null;
    if (a3 === 'inseriert') {
      warn = 'Ihre Anzeige läuft bereits – die Kennwerte aus dem Ausweis ' +
             'müssen darin stehen. Bei Verstoß droht ein Bußgeld von bis zu ' +
             '10.000 €. Holen Sie das kurzfristig nach.';
    } else if (a3 === 'notartermin') {
      warn = 'Ihr Termin steht kurz bevor. Der Ausweis muss spätestens bei ' +
             'der Besichtigung vorliegen und nach Vertragsabschluss ' +
             'übergeben werden.';
    }

    var r = {
      tone: bedarfPflicht ? 'bedarf' : head.tone,
      badge: bedarfPflicht ? 'Bedarfsausweis nötig' : head.badge,
      warn: warn,
      steps: [
        'Pflichtangaben in die Immobilienanzeige aufnehmen (§ 87 GEG).',
        'Spätestens bei der Besichtigung vorlegen.',
        'Nach Vertragsabschluss übergeben.',
      ],
      next: { href: '#inserat', title: 'Weiter: Anzeigentext erstellen',
              sub: 'Die Pflichtangaben für Ihr Inserat – fertig zum Kopieren.' },
    };

    if (bedarfPflicht) {
      r.title = 'Ja – und Sie brauchen einen Bedarfsausweis.';
      r.body = 'Bei ' + verb + ' ist ein Energieausweis Pflicht. Für kleine, ' +
               'ältere Wohngebäude – bis zu vier Wohnungen, Bauantrag vor dem ' +
               '1. November 1977 und seither nicht auf den Dämmstandard von ' +
               '1977 gebracht – schreibt das Gesetz ausdrücklich den ' +
               'Bedarfsausweis vor. Sie haben hier keine Wahl.';
      r.type = 'Bedarfsausweis (Pflicht)';
      r.cites = ['pflicht_verkauf_vermietung', 'bedarfspflicht_altbau'];
      r.carry = { art: 'bedarf' };
      // The warning quotes the 10.000 € figure — cite where it comes from.
      if (a3 === 'inseriert') r.cites.push('bussgeld');
    } else {
      r.title = 'Ja – Sie brauchen einen Energieausweis.';
      var why = ans[3] === 'nichtwohn'
        ? 'Bei Nichtwohngebäuden schreibt das Gesetz keine bestimmte Art vor.'
        : ans[4] === 'ab5'
          ? 'Ab fünf Wohnungen schreibt das Gesetz keine bestimmte Art vor.'
          : ans[5] === 'ab1977'
            ? 'Für Gebäude ab dem 1. November 1977 schreibt das Gesetz keine bestimmte Art vor.'
            : 'Da das Gebäude auf den Dämmstandard von 1977 gebracht wurde, entfällt die Pflicht zum Bedarfsausweis.';
      r.body = 'Bei ' + verb + ' ist ein Energieausweis Pflicht. ' + why +
               ' Sie haben die freie Wahl – der Verbrauchsausweis ist in der ' +
               'Regel günstiger, sofern Verbrauchsdaten vorliegen.';
      r.type = 'Freie Wahl – Verbrauchsausweis meist günstiger';
      r.cites = ['pflicht_verkauf_vermietung', 'freie_wahl'];
      r.carry = { art: 'verbrauch' };
      if (a3 === 'inseriert') r.cites.push('bussgeld');
    }
    return { view: 'result', r: r };
  };
})();

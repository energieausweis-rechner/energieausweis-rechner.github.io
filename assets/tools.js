/* ─────────────────────────────────────────────────────────────────────────
   tools.js — shared engine for every tool on the page.

   Ported to vanilla JS from the Claude Design reference component
   (Energieausweis-Tools.dc.html), which targets a React runtime.

   Design rules enforced here rather than left to each tool:
   • Every legal claim reads its § and Wortlaut from EAR.RULES — never inline.
   • renderPartnerCta() is the ONLY path that can emit an outbound partner
     link, so the "Anzeige" label and rel="sponsored" cannot be forgotten.
   • Flow state lives in the ?r= query parameter, so a result is a real URL:
     shareable, bookmarkable, and Back steps back one question.
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

  /* ── Screen-reader status ─────────────────────────────────────────────────
     A single polite region announces results only. Putting aria-live on the
     whole card makes every question re-read the entire card.             */

  function status(msg) {
    if (!EAR._status) {
      EAR._status = el('p', { class: 'visually-hidden', role: 'status', 'aria-live': 'polite' });
      document.body.appendChild(EAR._status);
    }
    EAR._status.textContent = msg;
  }

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
    bank: svg('<path d="M10 26 32 13 54 26"/><path d="M14 26v22M24 26v22M40 26v22M50 26v22"/><path d="M8 52h48"/>'),
    building: svg('<rect x="18" y="12" width="28" height="40"/><path d="M12 52h40"/><path d="M25 20h5M35 20h5M25 29h5M35 29h5M25 38h5M35 38h5"/>'),
    columns: svg('<path d="M10 24 32 13 54 24"/><path d="M14 50h36"/><path d="M17 24v24M27 24v24M37 24v24M47 24v24"/>'),
    area: svg('<rect x="14" y="14" width="36" height="36"/><path d="M23 41 41 23"/><path d="M23 33v8h8M41 31v-8h-8"/>'),
    none: svg('<circle cx="32" cy="32" r="17"/><path d="M20 20 44 44"/>'),
    calendar: svg('<rect x="13" y="17" width="38" height="33" rx="2"/><path d="M13 27h38M23 12v9M41 12v9"/><path d="M22 36h6M36 36h6"/>'),
    calendarOld: svg('<rect x="13" y="17" width="38" height="33" rx="2"/><path d="M13 27h38M23 12v9M41 12v9"/><circle cx="32" cy="39" r="6"/><path d="M32 39v-4M32 39l4 2"/>'),
    unknown: svg('<circle cx="32" cy="32" r="19"/><path d="M25 26a7 7 0 1 1 8 7v4"/><path d="M33 45h.01"/>'),
    reno: svg('<path d="M7 28 25 14 43 28"/><path d="M13 26v22h24V26"/><rect x="21" y="37" width="8" height="11"/><circle cx="50" cy="20" r="8"/><path d="M50 16v8M46 20h8"/>'),
    draft: svg('<path d="M18 8h20l10 10v38H18z"/><path d="M38 8v10h10"/><path d="M25 30h16M25 40h12"/>'),
    megaphone: svg('<path d="M14 26v12l26 12V14z"/><path d="M14 26H9v12h5"/><path d="M22 42v8h8"/><path d="M48 24c4 3 4 13 0 16"/>'),
    clock: svg('<circle cx="32" cy="34" r="20"/><path d="M32 23v11l8 6M24 8h16"/>'),
  };

  /* ── Legal citation block ─────────────────────────────────────────────── */

  /* The § reference and Stand are always visible — they are the credibility
     signal and the anchor an answer engine cites. The verbatim Gesetzestext
     is collapsed: German statutory sentences run long enough to fill a whole
     phone screen, which would wall off everything below the result. Using
     <details> keeps the wording in the DOM (still crawlable, still citable)
     without making the reader scroll past it. */
  function cite(ruleKey) {
    var r = R[ruleKey];
    if (!r) return null;
    var body = [el('blockquote', { text: '„' + r.wortlaut + '“' })];
    if (r.hinweis) body.push(el('p', { text: r.hinweis }));
    if (r.unbestaetigt) body.push(el('p', { class: 'hint', text: 'Hinweis: ' + r.unbestaetigt }));
    body.push(el('div', { class: 'src' }, [
      el('a', { href: r.quelle, rel: 'noopener', target: '_blank',
                text: 'Gesetzestext auf gesetze-im-internet.de ↗' }),
    ]));
    return el('div', { class: 'cite' }, [
      el('details', {}, [
        el('summary', {}, [
          el('strong', { text: r.zitat }),
          el('span', { class: 'stand', text: 'Stand: ' + EAR.STAND.stand }),
        ]),
      ].concat(body)),
    ]);
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

  /* ── URL state ────────────────────────────────────────────────────────────
     Flow state lives in ?r=, NOT in the hash — the hash belongs to the
     section anchors, and mixing the two means navigating to #kosten would
     throw away the user's answers.

     ?r=verkauf.keine.wohn.bis4.vor1977.nein~inseriert
        └─ answers, dot-separated                 └─ optional follow-up

     PERMANENT CONTRACT: never rename or reorder these tokens once live, or
     links people have shared will resolve to a different result.          */

  function readUrl() {
    var m = /[?&]r=([^&#]*)/.exec(location.search);
    if (!m) return { answers: [], extra: null };
    var raw = decodeURIComponent(m[1]).split('~');
    return {
      answers: raw[0] ? raw[0].split('.').filter(Boolean) : [],
      extra: raw[1] || null,
    };
  }

  function writeUrl(answers, extra, push) {
    if (!history.pushState) return;
    var v = answers.join('.') + (extra ? '~' + extra : '');
    var url = v ? '?r=' + encodeURIComponent(v) + '#rechner' : location.pathname;
    try { history[push ? 'pushState' : 'replaceState'](null, '', url); } catch (e) { /* file:// */ }
  }

  /* Replay tokens against the flow, dropping anything that isn't a valid
     option at its position. A tampered or outdated link degrades to the
     furthest valid point instead of erroring or asserting a wrong answer. */
  function sanitise(flow, tokens) {
    var ok = [];
    for (var i = 0; i < tokens.length; i++) {
      var out = flow(ok);
      if (out.view !== 'question') break;
      var valid = out.q.options.some(function (o) { return o.value === tokens[i]; });
      if (!valid) break;
      ok.push(tokens[i]);
    }
    return ok;
  }

  /* Walk the flow to recover what was asked and chosen, for the answer chips. */
  function trail(flow, answers) {
    var out = [];
    for (var i = 0; i < answers.length; i++) {
      var step = flow(answers.slice(0, i));
      if (step.view !== 'question') break;
      var opt = step.q.options.filter(function (o) { return o.value === answers[i]; })[0];
      out.push({ index: i, short: step.q.short || step.q.text, label: opt ? opt.label : answers[i] });
    }
    return out;
  }

  /* ── Wizard engine ────────────────────────────────────────────────────── */

  function stepBar(current, labels) {
    return el('div', { class: 'steps' }, labels.map(function (l, i) {
      var n = i + 1;
      var state = n < current ? 'done' : n === current ? 'on' : '';
      // The connector sits to the LEFT of the circle, so it must be a sibling
      // of the circle's column — not stacked inside it.
      return el('div', { class: 'step ' + state + (n <= current ? ' reached' : '') }, [
        n > 1 ? el('span', { class: 'line' }) : null,
        el('span', { class: 'step-body' }, [
          el('span', { class: 'mark', text: state === 'done' ? '✓' : String(n) }),
          el('span', { class: 'lbl', text: l }),
        ]),
      ]);
    }));
  }

  EAR.renderWizard = function (mount, flow, opts) {
    opts = opts || {};
    var maxQ = opts.maxQuestions || 6;
    var phases = opts.steps || ['Situation', 'Gebäude', 'Ergebnis'];
    var url = readUrl();
    var answers = sanitise(flow, url.answers);
    var extra = url.extra;

    function set(next, nextExtra, push) {
      answers = next;
      extra = nextExtra;
      writeUrl(answers, extra, push !== false);
      draw(true);
    }

    function resultText(r) {
      var lines = ['Energieausweis Rechner – Ihr Ergebnis', '', r.title, '', r.body];
      if (r.type) lines.push('', 'Ausweis-Art: ' + r.type);
      if (r.warn) lines.push('', 'Wichtig: ' + r.warn);
      (r.cites || []).forEach(function (k) {
        if (R[k]) lines.push('', R[k].zitat + ': „' + R[k].wortlaut + '“');
      });
      lines.push('', 'Stand: ' + EAR.STAND.stand + ' · unverbindliche Orientierung, ' +
                     'ersetzt keine Rechtsberatung.', location.href);
      return lines.join('\n');
    }

    function draw(focus) {
      var out = flow(answers);
      clear(mount);

      if (out.view === 'question') {
        var q = out.q;
        // Back goes above the question, with the progress. Below the answers
        // it reads as an action on the answer rather than a way out.
        if (answers.length) {
          mount.appendChild(el('button', {
            class: 'step-back', type: 'button',
            onclick: function () { set(answers.slice(0, -1), null); },
          }, [
            el('span', { 'aria-hidden': 'true', text: '←' }),
            el('span', { text: 'Zurück' }),
          ]));
        }
        mount.appendChild(stepBar(out.step || 1, phases));
        mount.appendChild(el('p', { class: 'eyebrow',
          text: 'Frage ' + (answers.length + 1) + ' von max. ' + maxQ }));
        mount.appendChild(el('p', { class: 'q-text', text: q.text }));

        mount.appendChild(el('div', { class: 'options' }, q.options.map(function (o) {
          return el('button', {
            class: 'opt', type: 'button',
            onclick: function () { set(answers.concat(o.value), null); },
          }, [
            el('span', { class: 'ico' }, [
              el('span', { class: 'ico-tile', html: ICONS[o.icon] || ICONS.house }),
            ]),
            el('span', { class: 'txt' }, [
              el('span', { class: 'lbl', text: o.label }),
              o.sub ? el('span', { class: 'sub', text: o.sub }) : null,
            ]),
            el('span', { class: 'arrow', 'aria-hidden': 'true', text: '→' }),
          ]);
        })));

        // Inline help for the questions that use genuine jargon.
        if (q.help) {
          mount.appendChild(el('details', { class: 'help' }, [
            el('summary', { text: q.help.title }),
            el('p', { text: q.help.body }),
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

      // Follow-up: asked AFTER the answer, because it changes the advice but
      // never the legal outcome — so it must not gate the result.
      var warn = r.warn;
      if (r.urgency && !warn) {
        var chosen = extra;
        if (chosen && EAR.URGENCY[chosen]) {
          warn = EAR.URGENCY[chosen].warn(r.urgency.verb);
        } else {
          card.appendChild(el('div', { class: 'followup' }, [
            el('p', { class: 'fu-q', text: 'Wie weit ist Ihr ' + r.urgency.verb + ' schon? ' +
              'Dann sagen wir Ihnen, worauf Sie jetzt achten müssen.' }),
            el('div', { class: 'seg' }, Object.keys(EAR.URGENCY).map(function (k) {
              return el('button', {
                type: 'button', text: EAR.URGENCY[k].label,
                onclick: function () { set(answers, k); },
              });
            })),
          ]));
        }
      }
      if (warn) {
        card.appendChild(el('div', { class: 'warn' }, [
          el('span', { class: 'mark', 'aria-hidden': 'true', text: '!' }),
          el('span', { text: warn }),
        ]));
      }
      if (r.type) {
        card.appendChild(el('div', { class: 'type-out' }, [
          el('span', { text: 'Ausweis-Art' }),
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

      // "Wie geht es weiter?" — no result is a dead end.
      if (r.nexts && r.nexts.length) {
        card.appendChild(el('h4', { class: 'next-head', text: 'Wie geht es weiter?' }));
        r.nexts.forEach(function (n) {
          card.appendChild(el('a', { class: 'next-link', href: n.href }, [
            el('span', {}, [
              el('span', { class: 't', text: n.title }), el('br'),
              el('span', { class: 's', text: n.sub }),
            ]),
            el('span', { 'aria-hidden': 'true', text: '→' }),
          ]));
        });
      }
      if (r.carry) Object.keys(r.carry).forEach(function (k) { EAR.carry(k, r.carry[k]); });

      mount.appendChild(card);

      // Answer chips — change one answer without walking all the way back.
      var t = trail(flow, answers);
      if (t.length) {
        mount.appendChild(el('div', { class: 'chips noprint' }, [
          el('span', { class: 'chips-lbl', text: 'Ihre Angaben:' }),
        ].concat(t.map(function (item) {
          return el('button', {
            class: 'chip', type: 'button',
            title: item.short + ' – ändern',
            'aria-label': item.short + ': ' + item.label + ' – ändern',
            onclick: function () { set(answers.slice(0, item.index), null); },
          }, [
            el('span', { text: item.label }),
            el('span', { class: 'chip-edit', 'aria-hidden': 'true', text: '✎' }),
          ]);
        }))));
      }

      mount.appendChild(el('div', { class: 'wizard-actions noprint' }, [
        el('button', {
          class: 'btn-ghost', type: 'button', text: '↺ Neu starten',
          onclick: function () { set([], null); },
        }),
        el('button', {
          class: 'btn-ghost', type: 'button', text: '⧉ Ergebnis kopieren',
          onclick: function (e) {
            var b = e.currentTarget;
            navigator.clipboard.writeText(resultText(r)).then(function () {
              b.textContent = '✓ Kopiert';
              setTimeout(function () { b.textContent = '⧉ Ergebnis kopieren'; }, 2200);
            }, function () { /* clipboard blocked */ });
          },
        }),
        el('button', {
          class: 'btn-ghost', type: 'button', text: 'Drucken',
          onclick: function () { window.print(); },
        }),
      ]));

      status(r.title + (r.type ? '. Ausweis-Art: ' + r.type : ''));
      if (focus) card.focus();
    }

    // Back/forward move through the flow rather than leaving the page.
    window.addEventListener('popstate', function () {
      var u = readUrl();
      answers = sanitise(flow, u.answers);
      extra = u.extra;
      draw(false);
    });

    writeUrl(answers, extra, false);
    draw(false);
  };

  /* ── The follow-up asked after the result ─────────────────────────────── */

  EAR.URGENCY = {
    vorbereitung: {
      label: 'Noch in Vorbereitung',
      warn: function (verb) {
        return 'Sie sind früh dran – gut. Lassen Sie den Ausweis erstellen, ' +
               'bevor Sie inserieren: Die Kennwerte müssen bereits in der ' +
               'Anzeige stehen.';
      },
    },
    inseriert: {
      label: 'Anzeige läuft schon',
      warn: function (verb) {
        return 'Ihre Anzeige läuft bereits – die Kennwerte aus dem Ausweis ' +
               'müssen darin stehen. Fehlen sie, droht ein Bußgeld von bis zu ' +
               '10.000 €. Holen Sie das kurzfristig nach.';
      },
    },
    notartermin: {
      label: 'Termin steht kurz bevor',
      warn: function (verb) {
        return 'Ihr Termin steht kurz bevor. Der Ausweis muss spätestens bei ' +
               'der Besichtigung vorliegen und nach Vertragsabschluss ' +
               'übergeben werden – planen Sie eine schnelle Erstellung ein.';
      },
    },
  };

  /* ── The main flow: "Brauche ich einen — und welchen?" ─────────────────────
     The reference design splits this into two tools joined by a button, and
     asks the urgency question in the middle. Merged into one sequence here,
     with urgency moved after the result: it changes the advice, never the
     legal outcome, so it must not stand between the user and their answer. */

  EAR.flows = {};

  EAR.flows.main = function (ans) {
    var Q1 = {
      short: 'Ihre Rolle',
      text: 'In welcher Rolle sind Sie – und was steht an?',
      options: [
        { value: 'verkauf', icon: 'seller', label: 'Ich verkaufe', sub: 'Als Eigentümer' },
        { value: 'vermietung', icon: 'houseKey', label: 'Ich vermiete neu', sub: 'Neuer Mietvertrag' },
        { value: 'neubau', icon: 'crane', label: 'Ich baue neu', sub: 'Neubau, Fertigstellung' },
        { value: 'interessent', icon: 'buyer', label: 'Ich kaufe oder miete', sub: 'Interessent oder Mieter' },
        { value: 'finanzierung', icon: 'bank', label: 'Ich brauche ihn für die Bank', sub: 'Kredit oder Förderung' },
        { value: 'bestand', icon: 'house', label: 'Nichts davon', sub: 'Selbst nutzen' },
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
      nexts: [
        { href: '#effizienzklasse', title: 'Effizienzklasse einordnen',
          sub: 'Kennwert aus dem vorgelegten Ausweis eingeben – A+ bis H.' },
        { href: '#kosten', title: 'Einschätzen, was der Ausweis wert ist',
          sub: 'Was ein Ausweis kostet – hilfreich, wenn Ihnen keiner gezeigt wird.' },
      ],
    }};

    if (a1 === 'finanzierung') return { view: 'result', r: {
      tone: 'no', badge: 'Keine gesetzliche Pflicht',
      title: 'Aus der Finanzierung selbst folgt keine Pflicht.',
      body: 'Das Gesetz verlangt einen Energieausweis bei Verkauf, Vermietung ' +
            'und Neubau – nicht dafür, dass Sie einen Kredit aufnehmen. ' +
            'Banken verlangen ihn aber in der Praxis regelmäßig zur ' +
            'Bewertung der Immobilie, und die Energieeffizienzklasse ' +
            'beeinflusst Förderungen und Konditionen. Wenn Sie ohnehin ' +
            'kaufen, muss die Verkäuferseite Ihnen den Ausweis vorlegen.',
      cites: ['vorlagepflicht'],
      nexts: [
        { href: '#effizienzklasse', title: 'Effizienzklasse bestimmen',
          sub: 'Der Wert, nach dem die Bank und Förderprogramme fragen.' },
        { href: '#kosten', title: 'Kosten einschätzen',
          sub: 'Falls Sie den Ausweis selbst beauftragen müssen.' },
      ],
    }};

    if (a1 === 'bestand') return { view: 'result', r: {
      tone: 'no', badge: 'Pflicht: nein',
      title: 'Nein – aktuell besteht keine Pflicht.',
      body: 'Für reine Eigennutzung oder ein weiterlaufendes Mietverhältnis ' +
            'brauchen Sie keinen Energieausweis. Erst bei Verkauf oder ' +
            'Neuvermietung wird er Pflicht.',
      cites: ['pflicht_verkauf_vermietung'],
      nexts: [
        { href: '#effizienzklasse', title: 'Trotzdem wissen, wo Sie stehen',
          sub: 'Effizienzklasse aus dem Verbrauch einordnen.' },
        { href: '#gmodg', title: 'Was das neue Gesetz ändert',
          sub: 'Ob sich Warten lohnt, wenn ein Verkauf ansteht.' },
      ],
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
      nexts: [
        { href: '#kosten', title: 'Kosten für den Bedarfsausweis',
          sub: 'Die Ausweis-Art ist bereits gesetzt.' },
        { href: '#effizienzklasse', title: 'Effizienzklasse einordnen',
          sub: 'Was der berechnete Kennwert bedeutet.' },
      ],
    }};

    /* Verkauf / Vermietung → Ausnahmen prüfen */
    var Q2 = {
      short: 'Ausnahmen',
      text: 'Trifft eine dieser Ausnahmen auf das Gebäude zu?',
      options: [
        { value: 'denkmal', icon: 'columns', label: 'Ja, Baudenkmal', sub: 'Denkmalschutz' },
        { value: 'klein', icon: 'area', label: 'Ja, höchstens 50 m²', sub: 'Nutzfläche bis 50 m²' },
        { value: 'keine', icon: 'none', label: 'Nein, keine davon', sub: 'Weder noch' },
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
      nexts: [
        { href: '#pflicht', title: 'Die Ausnahmen im Detail nachlesen',
          sub: 'Wortlaut und Grenzfälle – die Grenze ist „nicht mehr als“ 50 m².' },
      ],
    }};

    if (a2 === 'denkmal') return { view: 'result', r: {
      tone: 'no', badge: 'Ausnahme greift',
      title: 'Nein – für Verkauf und Vermietung entfällt die Pflicht.',
      body: 'Bei einem Baudenkmal gelten die Pflichten zu Verkauf, Vermietung, ' +
            'Vorlage und Aushang nicht. Wichtig: Das ist keine vollständige ' +
            'Befreiung – bei einem Neubau oder einer größeren Änderung des ' +
            'Gebäudes bleibt die Pflicht zum Bedarfsausweis bestehen.',
      cites: ['ausnahme_denkmal'],
      nexts: [
        { href: '#pflicht', title: 'Was beim Denkmal trotzdem gilt',
          sub: 'Warum „Denkmal“ nicht „gar kein Energieausweis“ heißt.' },
      ],
    }};

    /* ── Segment 2: welche Art? ── */
    var Q3 = {
      short: 'Gebäudeart',
      text: 'Um was für ein Gebäude geht es?',
      options: [
        { value: 'wohn', icon: 'house', label: 'Wohngebäude', sub: 'Haus oder Wohnung' },
        { value: 'nichtwohn', icon: 'building', label: 'Nichtwohngebäude', sub: 'Gewerbe, Büro, Halle' },
      ],
    };
    if (ans.length === 2) return { view: 'question', q: Q3, step: 2 };

    var Q4 = {
      short: 'Wohnungen',
      text: 'Wie viele Wohnungen hat das Gebäude?',
      options: [
        { value: 'ab5', icon: 'building', label: '5 oder mehr', sub: 'Mehrfamilienhaus' },
        { value: 'bis4', icon: 'house', label: 'Bis zu 4', sub: 'Ein- bis Vierfamilienhaus' },
      ],
    };
    if (ans.length === 3 && ans[2] === 'wohn') return { view: 'question', q: Q4, step: 2 };

    var Q5 = {
      short: 'Bauantrag',
      text: 'Wann wurde der Bauantrag gestellt?',
      help: {
        title: 'Wo finde ich das Bauantragsdatum?',
        body: 'Am häufigsten steht es in den Bauunterlagen oder im Kaufvertrag, ' +
              'bei Eigentumswohnungen auch in der Teilungserklärung. Sonst ' +
              'hilft ein Blick in die Bauakte beim Bauamt Ihrer Gemeinde – ' +
              'als Eigentümer dürfen Sie sie einsehen. Wichtig ist das Datum ' +
              'des Bauantrags, nicht der Fertigstellung; beide können ein bis ' +
              'zwei Jahre auseinanderliegen.',
      },
      options: [
        { value: 'ab1977', icon: 'calendar', label: 'Am oder nach dem 1.11.1977', sub: 'Oder später' },
        { value: 'vor1977', icon: 'calendarOld', label: 'Vor dem 1.11.1977', sub: 'Älteres Gebäude' },
        { value: 'unbekannt', icon: 'unknown', label: 'Weiß ich nicht', sub: 'Datum unbekannt' },
      ],
    };
    if (ans.length === 4 && ans[3] === 'bis4') return { view: 'question', q: Q5, step: 2 };

    var Q6 = {
      short: 'Modernisierung',
      text: 'Wurde das Haus nachträglich gedämmt?',
      help: {
        title: 'Was ist mit „Dämmstandard von 1977“ gemeint?',
        body: 'Gemeint ist das Niveau der Wärmeschutzverordnung von 1977 – grob: ' +
              'gedämmte Außenwände oder gedämmtes Dach und zeitgemäße Fenster. ' +
              'Einzelne neue Fenster genügen dafür in der Regel nicht. ' +
              'Ob Ihr Haus das Niveau erreicht, kann verlässlich nur eine nach ' +
              '§ 88 GEG ausstellungsberechtigte Person beurteilen. Im Zweifel ' +
              'wählen Sie „Bin mir nicht sicher“.',
      },
      options: [
        { value: 'ja', icon: 'reno', label: 'Ja, nachträglich gedämmt', sub: 'Fassade, Dach, Fenster' },
        { value: 'nein', icon: 'house', label: 'Nein, im Originalzustand', sub: 'Im Originalzustand' },
        { value: 'unsicher', icon: 'unknown', label: 'Bin mir nicht sicher', sub: 'Weiß ich nicht' },
      ],
    };
    if (ans.length === 5 && ans[4] === 'vor1977') return { view: 'question', q: Q6, step: 2 };

    /* ── Result ── */
    var verb = a1 === 'verkauf' ? 'Verkauf' : 'Vermietung';
    var typ = ans[2], wohnungen = ans[3], bauantrag = ans[4], daemmung = ans[5];

    // Bedarfsausweis is mandatory only for: Wohngebäude, ≤4 Wohnungen,
    // Bauantrag before 01.11.1977, not brought to WSchV-1977 level.
    var bedarfPflicht =
      typ === 'wohn' && wohnungen === 'bis4' && bauantrag === 'vor1977' && daemmung === 'nein';

    // Not knowing is not the same as "no". The Bedarfsausweis is always
    // permissible, so it is the safe answer — but say how to find out,
    // because the cheaper Verbrauchsausweis may well be allowed.
    var unsicher =
      typ === 'wohn' && wohnungen === 'bis4' &&
      (bauantrag === 'unbekannt' || daemmung === 'unsicher');

    var r = {
      urgency: { verb: verb },
      steps: [
        'Pflichtangaben in die Immobilienanzeige aufnehmen (§ 87 GEG).',
        'Spätestens bei der Besichtigung vorlegen.',
        'Nach Vertragsabschluss übergeben.',
      ],
      nexts: [
        { href: '#inserat', title: 'Anzeigentext erstellen',
          sub: 'Die fünf Pflichtangaben für Ihr Inserat – fertig zum Kopieren.' },
        { href: '#kosten', title: 'Kosten einschätzen',
          sub: 'Was Sie für diese Ausweis-Art einplanen sollten.' },
      ],
    };

    if (bedarfPflicht) {
      r.tone = 'bedarf';
      r.badge = 'Bedarfsausweis nötig';
      r.title = 'Ja – und Sie brauchen einen Bedarfsausweis.';
      r.body = 'Bei ' + verb + ' ist ein Energieausweis Pflicht. Für kleine, ' +
               'ältere Wohngebäude – bis zu vier Wohnungen, Bauantrag vor dem ' +
               '1. November 1977 und seither nicht nachträglich gedämmt – ' +
               'schreibt das Gesetz ausdrücklich den Bedarfsausweis vor. ' +
               'Sie haben hier keine Wahl.';
      r.type = 'Bedarfsausweis (Pflicht)';
      r.cites = ['pflicht_verkauf_vermietung', 'bedarfspflicht_altbau'];
      r.carry = { art: 'bedarf' };
    } else if (unsicher) {
      var was = bauantrag === 'unbekannt'
        ? 'das Datum des Bauantrags'
        : 'der Dämmzustand des Gebäudes';
      r.tone = 'bedarf';
      r.badge = 'Auf der sicheren Seite';
      r.title = 'Ja – und mit dem Bedarfsausweis sind Sie sicher unterwegs.';
      r.body = 'Bei ' + verb + ' ist ein Energieausweis Pflicht. Weil ' + was +
               ' offen ist, lässt sich nicht abschließend sagen, ob der ' +
               'günstigere Verbrauchsausweis zulässig wäre. Der ' +
               'Bedarfsausweis ist immer erlaubt – mit ihm machen Sie in ' +
               'keinem Fall etwas falsch.';
      r.type = 'Bedarfsausweis (immer zulässig)';
      r.cites = ['pflicht_verkauf_vermietung', 'bedarfspflicht_altbau'];
      r.carry = { art: 'bedarf' };
      r.steps = [
        bauantrag === 'unbekannt'
          ? 'Bauantragsdatum klären: Kaufvertrag, Bauunterlagen, Teilungserklärung oder Bauakte beim Bauamt.'
          : 'Dämmzustand klären: Sanierungsbelege sichten oder eine nach § 88 GEG berechtigte Person fragen.',
        'Ergibt sich daraus, dass die Ausnahme greift, genügt der günstigere Verbrauchsausweis.',
        'Andernfalls den Bedarfsausweis erstellen lassen.',
      ];
      r.nexts.unshift({
        href: '#kosten', title: 'Lohnt sich das Nachprüfen?',
        sub: 'Preise beider Ausweis-Arten vergleichen – die Differenz zeigt es.',
      });
    } else {
      var why = typ === 'nichtwohn'
        ? 'Bei Nichtwohngebäuden schreibt das Gesetz keine bestimmte Art vor.'
        : wohnungen === 'ab5'
          ? 'Ab fünf Wohnungen schreibt das Gesetz keine bestimmte Art vor.'
          : bauantrag === 'ab1977'
            ? 'Für Gebäude ab dem 1. November 1977 schreibt das Gesetz keine bestimmte Art vor.'
            : 'Da das Gebäude nachträglich gedämmt wurde, entfällt die Pflicht zum Bedarfsausweis.';
      r.tone = 'yes';
      r.badge = 'Pflicht: ja';
      r.title = 'Ja – Sie brauchen einen Energieausweis.';
      r.body = 'Bei ' + verb + ' ist ein Energieausweis Pflicht. ' + why +
               ' Sie haben die freie Wahl – der Verbrauchsausweis ist in der ' +
               'Regel günstiger, sofern Verbrauchsdaten vorliegen.';
      r.type = 'Freie Wahl – Verbrauchsausweis meist günstiger';
      r.cites = ['pflicht_verkauf_vermietung', 'freie_wahl'];
      r.carry = { art: 'verbrauch' };
    }
    return { view: 'result', r: r };
  };
})();

/**
 * Suche in eigenen Worten (Prototyp Materialpool 2.0, Christina,
 * 28.09.2026), zusätzlich zur Stichwortsuche.
 *
 * Die Relays können mit ganzen Sätzen nur bedingt umgehen: amb-relay
 * rankt „Ich suche etwas zu Ostern für meine Konfis“ halbwegs, sodix
 * liefert dazu fast nur Fachfremdes, oersi gar nichts — die Füllwörter
 * ziehen die Treffer weg vom Thema. Deshalb wird der Satz hier zerlegt:
 * Zielgruppe, Materialart und Fach werden zu denselben Filtern, die man
 * auch von Hand setzen kann, und nur die übrigen Themenwörter gehen in die
 * Suche.
 *
 * Bewusst Regeln statt eines Sprachmodells: Jede Deutung soll sich zeigen
 * lassen („Konfis“ → Sekundarstufe I) statt unsichtbar zu passieren.
 * Reine Funktionen, kennt keine Komponente.
 */

import { kuerzen, SUCHTEXT_MAX } from './text.js';

/** @typedef {import('./typen.js').StufeKey} StufeKey */
/** @typedef {import('./typen.js').TypKey} TypKey */
/** @typedef {import('./typen.js').FachKey} FachKey */

/**
 * Mehrwortige Wendungen zuerst — „junge Erwachsene“ darf nicht als
 * „Erwachsene“ gelesen werden.
 * @type {[string[], StufeKey][]}
 */
const STUFE_WENDUNGEN = [
  [['junge', 'erwachsene'], 'sek2'],
  [['jungen', 'erwachsenen'], 'sek2'],
  [['sekundarstufe', 'ii'], 'sek2'],
  [['sekundarstufe', '2'], 'sek2'],
  [['sek', 'ii'], 'sek2'],
  [['sekundarstufe', 'i'], 'sek1'],
  [['sekundarstufe', '1'], 'sek1'],
  [['sek', 'i'], 'sek1']
];

/** @type {Record<string, StufeKey>} */
const STUFE_WOERTER = {
  kind: 'elem',
  kinder: 'elem',
  kindern: 'elem',
  kita: 'elem',
  kitas: 'elem',
  kindergarten: 'elem',
  kindergartenkinder: 'elem',
  vorschule: 'elem',
  vorschulkinder: 'elem',
  grundschule: 'elem',
  grundschüler: 'elem',
  grundschülern: 'elem',
  grundschulkinder: 'elem',
  grundschulkindern: 'elem',
  primarstufe: 'elem',
  jugendliche: 'sek1',
  jugendlichen: 'sek1',
  jugendgruppe: 'sek1',
  jugendarbeit: 'sek1',
  teenager: 'sek1',
  teens: 'sek1',
  konfis: 'sek1',
  konfi: 'sek1',
  'konfi-arbeit': 'sek1',
  konfiarbeit: 'sek1',
  konfirmanden: 'sek1',
  konfirmandinnen: 'sek1',
  konfirmandenunterricht: 'sek1',
  unterstufe: 'sek1',
  mittelstufe: 'sek1',
  sek1: 'sek1',
  oberstufe: 'sek2',
  abitur: 'sek2',
  abi: 'sek2',
  sek2: 'sek2',
  // Erwachsene sind Fortbildung (KIM level_C), nicht Berufsbildung.
  erwachsene: 'fortbildung',
  erwachsenen: 'fortbildung',
  erwachsenenbildung: 'fortbildung',
  senioren: 'fortbildung',
  seniorinnen: 'fortbildung',
  berufsschule: 'bbs',
  berufsschüler: 'bbs',
  azubis: 'bbs',
  auszubildende: 'bbs',
  auszubildenden: 'bbs'
};

/** @type {Record<string, TypKey>} */
const TYP_WOERTER = {
  arbeitsblatt: 'ab',
  arbeitsblätter: 'ab',
  arbeitsblättern: 'ab',
  arbeitsmaterial: 'ab',
  kopiervorlage: 'ab',
  kopiervorlagen: 'ab',
  unterrichtsentwurf: 'plan',
  unterrichtsentwürfe: 'plan',
  stundenentwurf: 'plan',
  stundenentwürfe: 'plan',
  unterrichtsplanung: 'plan',
  unterrichtsstunde: 'plan',
  unterrichtseinheit: 'plan',
  stundenverlauf: 'plan',
  projekt: 'proj',
  projekte: 'proj',
  projektidee: 'proj',
  projektideen: 'proj',
  übung: 'uebung',
  übungen: 'uebung',
  quiz: 'uebung',
  rätsel: 'uebung',
  video: 'video',
  videos: 'video',
  film: 'video',
  filme: 'video',
  kurzfilm: 'video',
  kurzfilme: 'video',
  erklärvideo: 'video',
  erklärvideos: 'video',
  audio: 'audio',
  podcast: 'audio',
  podcasts: 'audio',
  hörspiel: 'audio',
  webseite: 'webseite',
  website: 'webseite',
  internetseite: 'webseite'
};

/**
 * Das Fach nur, wenn die Konfession am Unterricht hängt („evangelischer
 * Religionsunterricht“). „islamische Feste“ ist ein Thema, kein Fach — und
 * Material über den Islam steckt meist im evangelischen oder
 * überkonfessionellen Bestand.
 * @type {[string, FachKey][]}
 */
const FACH_STAEMME = [
  ['evangelisch', 'evangelisch'],
  ['katholisch', 'katholisch'],
  ['islamisch', 'islamisch'],
  ['jüdisch', 'juedisch'],
  ['alevitisch', 'alevitisch'],
  ['überkonfessionell', 'allgemein']
];
const UNTERRICHT_WOERTER = new Set(['religionsunterricht', 'religionslehre', 'religion', 'reli', 'ru']);

/**
 * Füllwörter, die in einer Frage stehen, aber nichts über das Thema sagen.
 * Lieber eines zu viel: Ein verlorenes Themenwort findet die Stichwortsuche
 * daneben immer noch, ein stehengebliebenes „suche“ dagegen macht die
 * Trefferliste leer.
 */
const FUELLWOERTER = new Set(
  `ich du wir ihr man mir mich uns euch mein meine meinen meinem meiner meines unser unsere unseren unserer
  suche suchen such sucht brauche brauchen braucht benötige benötigen hätte hätten gern gerne möchte möchten
  will wollen soll sollen kann können könnte könntet habt hat habe haben gibt gib gebt es ist sind sein
  etwas was welche welches welcher irgendwas irgendetwas material materialien materialen idee ideen tipp tipps
  anregung anregungen vorschlag vorschläge inhalte
  der die das den dem des ein eine einen einem einer eines und oder aber auch noch so sehr ganz bitte danke hallo
  zu zum zur über ueber für fuer mit ohne von vom im in ins am an auf aus bei nach um vor als wie
  wo wann warum wieso weshalb welche kein keine sagt sagen heißt bedeutet geht gehts
  thema themen themas stunde stunden unterricht unterrichten schule schulen klasse klassen gruppe gruppen
  nächste nächsten kommende kommenden woche wochen morgen heute
  erklären erkläre erklärt vermitteln vermittle beibringen zeigen zeige gestalten gestalte vorbereiten
  bereite machen mache tun einsetzen einstieg arbeit arbeiten
  gut gute guten gutes schön schöne geeignet geeignete passend passende passendes passenden
  alter jahre jahren altersgruppe zielgruppe
  religion religionsunterricht religionslehre reli ru religiös religiöse religiösen`.split(/\s+/)
);

/** @param {string} wort */
function klein(wort) {
  return wort.toLocaleLowerCase('de');
}

/** Stufe aus einer Altersangabe („8 Jahre“, „12-Jährige“). @param {number} alter @returns {StufeKey} */
function stufeFuerAlter(alter) {
  if (alter <= 10) return 'elem';
  if (alter <= 15) return 'sek1';
  if (alter <= 19) return 'sek2';
  return 'bbs';
}

/** @param {number} klasse @returns {StufeKey} */
function stufeFuerKlasse(klasse) {
  if (klasse <= 4) return 'elem';
  if (klasse <= 10) return 'sek1';
  return 'sek2';
}

/**
 * @typedef {object} Erkannt
 * @property {'stufe'|'typ'|'fach'} facette
 * @property {string} wert     StufeKey, TypKey oder FachKey
 * @property {string} woerter  die Wörter, wie sie in der Frage standen
 */

/**
 * @typedef {object} Deutung
 * @property {StufeKey[]} stufen
 * @property {TypKey[]} typen
 * @property {FachKey[]} faecher
 * @property {string[]} begriffe   übrige Themenwörter, in Originalschreibung
 * @property {Erkannt[]} erkannt
 * @property {boolean} istSatz     ab drei Wörtern mit etwas Erkanntem, oder ab vier, wenn Füllwörter wegfallen — Zahlen zählen nicht mit
 */

/**
 * Die Deutung von `frage`, solange die Suche noch aus ihr folgt: die
 * Themenwörter sind `q`, und jede gedeutete Facette ist gewählt (weitere
 * dürfen dazukommen). Sonst null — dann darf die Liste auch nicht
 * behaupten, sie habe den Satz so verstanden.
 * @param {string} frage
 * @param {{ q: string, stufen: string[], typen: string[], faecher: string[] }} suche
 * @returns {Deutung|null}
 */
export function deutungPruefen(frage, suche) {
  if (!frage) return null;
  const d = deuteSuche(frage);
  if (!d.istSatz || d.begriffe.join(' ') !== suche.q) return null;
  /** @param {string[]} gedeutet @param {string[]} gewaehlt */
  const gewaehlt = (gedeutet, gewaehlt) => gedeutet.every((w) => gewaehlt.includes(w));
  if (!gewaehlt(d.stufen, suche.stufen) || !gewaehlt(d.typen, suche.typen) || !gewaehlt(d.faecher, suche.faecher)) return null;
  return d;
}

/**
 * @param {string} text
 * @returns {Deutung}
 */
export function deuteSuche(text) {
  // NFC, damit „für“ aus zerlegtem u + ¨ (macOS, manche Tastaturen) ein Wort bleibt.
  const woerter = kuerzen(text || '', SUCHTEXT_MAX).normalize('NFC').split(/[^\p{L}\p{N}-]+/u).filter(Boolean);
  const k = woerter.map(klein);
  const verbraucht = new Array(woerter.length).fill(false);
  /** @type {Erkannt[]} */
  const erkannt = [];

  /** @param {Erkannt['facette']} facette @param {string} wert @param {number} von @param {number} bis */
  function merke(facette, wert, von, bis) {
    for (let i = von; i < bis; i += 1) verbraucht[i] = true;
    if (!erkannt.some((e) => e.facette === facette && e.wert === wert)) {
      erkannt.push({ facette, wert, woerter: woerter.slice(von, bis).join(' ') });
    }
  }

  for (let i = 0; i < k.length; i += 1) {
    if (verbraucht[i]) continue;

    const wendung = STUFE_WENDUNGEN.find(([teile]) => teile.every((t, j) => k[i + j] === t));
    if (wendung) {
      merke('stufe', wendung[1], i, i + wendung[0].length);
      continue;
    }

    // „3. Klasse“, „Klasse 3“, „Jahrgang 9“
    if (/^(klasse|klassen|jahrgang|jahrgangsstufe)$/.test(k[i])) {
      const zahl = /^\d{1,2}$/.test(k[i + 1] || '') ? i + 1 : /^\d{1,2}$/.test(k[i - 1] || '') ? i - 1 : -1;
      if (zahl >= 0 && !verbraucht[zahl]) {
        merke('stufe', stufeFuerKlasse(Number(k[zahl])), Math.min(i, zahl), Math.max(i, zahl) + 1);
        continue;
      }
    }

    // „12-Jährige“, „8 Jahre“, „8-jährigen“
    const jaehrig = /^(\d{1,2})-?jährig/.exec(k[i]);
    if (jaehrig) {
      merke('stufe', stufeFuerAlter(Number(jaehrig[1])), i, i + 1);
      continue;
    }
    if (/^\d{1,2}$/.test(k[i]) && /^(jahre|jahren|jährige|jährigen)$/.test(k[i + 1] || '')) {
      merke('stufe', stufeFuerAlter(Number(k[i])), i, i + 2);
      continue;
    }

    const fach = FACH_STAEMME.find(([stamm]) => k[i].startsWith(stamm));
    if (fach && UNTERRICHT_WOERTER.has(k[i + 1])) {
      merke('fach', fach[1], i, i + 2);
      continue;
    }

    if (STUFE_WOERTER[k[i]]) {
      merke('stufe', STUFE_WOERTER[k[i]], i, i + 1);
      continue;
    }
    if (TYP_WOERTER[k[i]]) {
      merke('typ', TYP_WOERTER[k[i]], i, i + 1);
    }
  }

  // Zahlen bleiben Themenwörter („Psalm 23“, „Römer 8“), außer eine Klassen-
  // oder Altersregel hat sie verbraucht.
  const begriffe = woerter.filter((w, i) => !verbraucht[i] && !FUELLWOERTER.has(k[i]));
  /** @param {string} w */
  const keineZahl = (w) => !/^\d+$/.test(w);
  const worte = woerter.filter(keineZahl).length;
  /** @param {Erkannt['facette']} facette */
  const werte = (facette) => erkannt.filter((e) => e.facette === facette).map((e) => e.wert);

  return {
    stufen: /** @type {StufeKey[]} */ (werte('stufe')),
    typen: /** @type {TypKey[]} */ (werte('typ')),
    faecher: /** @type {FachKey[]} */ (werte('fach')),
    begriffe,
    erkannt,
    // „Martin Luther“, „Ostern Kita“ und „Tod und Trauer“ bleiben
    // Stichwortsuchen wie bisher.
    istSatz: (worte >= 3 && erkannt.length > 0) || (worte >= 4 && begriffe.filter(keineZahl).length < worte)
  };
}

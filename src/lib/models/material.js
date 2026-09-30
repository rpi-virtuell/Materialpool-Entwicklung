/**
 * Ein Material: die Lesart eines AMB-Events kind:30142.
 *
 * Tagnamen folgen dem edufeed-AMB-NIP, wie `amb-nostr-converter` sie
 * schreibt: flache Felder (`name`, `description`, `image`, `t`,
 * `inLanguage`, `datePublished`) und Pfade mit Doppelpunkt für Objekte
 * (`creator:name`, `publisher:name`, `license:id`, `about:id`,
 * `about:prefLabel:de`, `educationalLevel:…`, `learningResourceType:…`).
 * `d` ist die AMB-`id`, also die URL der Ressource.
 *
 * Events werden nie verändert; was zu säubern ist, wird beim Rendern
 * gesäubert (CLAUDE.md).
 */

import { faecherAusBegriffen, stufeAusBegriffen, stufenAusBegriffen, typAusBegriffen, typenAusBegriffen } from './typen.js';

/** @typedef {import('../services/relay.js').Event} Event */
/** @typedef {import('./typen.js').FachKey} FachKey */
/** @typedef {import('./typen.js').TypKey} TypKey */
/** @typedef {import('./typen.js').StufeKey} StufeKey */

/**
 * @typedef {object} Begriff
 * @property {string} id     URI des Vokabulars (SKOS)
 * @property {string} label  bevorzugt deutsch, sonst englisch, sonst letzter Pfadteil
 */
/**
 * @typedef {object} Material
 * @property {string} id            Event-id
 * @property {string} pubkey
 * @property {number} createdAt
 * @property {string} d             AMB-id, meist die URL der Ressource
 * @property {string} kennung       URL-sicherer Pfadteil aus `d`
 * @property {string} pfad          /m/<kennung>, mit `?von=<pubkey>`, wenn mehrere Schlüssel dieses `d` publizieren (ADR-0008)
 * @property {string} jsonPfad      rohes Event: /m/<kennung>/json, ebenso mit `?von=`
 * @property {string} name
 * @property {string} beschreibung
 * @property {string|null} url      `d`, sonst `encoding:contentUrl`, sonst erstes http-`r`
 * @property {string|null} bild     `image`, nur mit http(s)-Adresse
 * @property {string|null} lizenz   Lizenzangabe (`license:id`), wie im Event
 * @property {string|null} lizenzUrl  dieselbe, nur mit http(s)-Adresse — sonst kein Link
 * @property {string|null} lizenzKuerzel  z. B. „CC BY-SA 4.0“, sonst null
 * @property {string[]} typen       AMB `type`, z. B. LearningResource
 * @property {string[]} schlagworte
 * @property {string[]} sprachen
 * @property {string[]} urheber
 * @property {string[]} herausgeber
 * @property {string[]} mitwirkende
 * @property {string} herkunft      Urheber · Herausgeber · Mitwirkende, sonst Hostname, sonst Hinweis
 * @property {string[]} themen      Schlagworte, sonst Fach-Labels; höchstens vier
 * @property {{ key: TypKey, label: string }} typ       erster bekannter Typ (Anzeige)
 * @property {TypKey[]} typKeys                          alle Typen (Filter, Facetten)
 * @property {{ key: StufeKey, label: string }} stufe   erste Stufe (Anzeige)
 * @property {StufeKey[]} stufenKeys                     alle Stufen (Filter, Facetten)
 * @property {Begriff[]} bildungsstufen
 * @property {Begriff[]} faecher
 * @property {FachKey[]} fachKeys                        Konfessionen aus `about:id`, sonst mit s1055 „allgemein“, sonst leer (Filter, Facetten)
 * @property {Begriff[]} ressourcentypen
 * @property {string|null} datum    datePublished, sonst dateCreated
 */

/** @param {string[][]} tags @param {string} name @returns {string[]} */
function alle(tags, name) {
  return tags
    .filter((t) => t[0] === name)
    .map((t) => t[1])
    .filter((v) => typeof v === 'string' && v.trim() !== '')
    .map((v) => v.trim());
}

/** @param {string[][]} tags @param {string} name @returns {string|null} */
function erstes(tags, name) {
  return alle(tags, name)[0] ?? null;
}

/**
 * Letzter Pfadteil einer URI als Notbezeichnung, wenn kein prefLabel kommt.
 * @param {string} uri
 */
export function letzterPfadteil(uri) {
  const teile = uri.replace(/[/#]+$/, '').split(/[/#]/);
  return teile[teile.length - 1] || uri;
}

/**
 * Begriffe eines SKOS-Feldes: je `:id` ein Eintrag, Label nach Reihenfolge
 * der `:prefLabel:de`-, sonst `:prefLabel:en`-Tags. Der Konverter schreibt
 * die Tags je Begriff hintereinander, die Reihenfolge trägt also die
 * Zuordnung.
 * @param {string[][]} tags @param {string} praefix @returns {Begriff[]}
 */
export function begriffe(tags, praefix) {
  const ids = alle(tags, `${praefix}:id`);
  const de = alle(tags, `${praefix}:prefLabel:de`);
  const en = alle(tags, `${praefix}:prefLabel:en`);
  return ids.map((id, i) => ({ id, label: de[i] ?? en[i] ?? letzterPfadteil(id) }));
}

/**
 * Pfadteil aus `d`. Zurück geht es ohne eigenes Dekodieren: SvelteKit
 * liefert `params.kennung` schon dekodiert, ein zweites
 * `decodeURIComponent` machte aus `%20` in `d` ein Leerzeichen und ließe
 * ein `d` mit `%` gar nicht mehr finden.
 * @param {string} d
 */
export function kennungAusD(d) {
  return encodeURIComponent(d);
}

/**
 * Kürzel einer Creative-Commons-Lizenz aus ihrer URL, sonst null.
 * @param {string|null} url
 * @returns {string|null}
 */
export function lizenzKuerzel(url) {
  if (!url) return null;
  const u = url.toLowerCase();
  if (/creativecommons\.org\/publicdomain\/zero/.test(u)) return 'CC0';
  if (/creativecommons\.org\/publicdomain\/mark/.test(u)) return 'Public Domain';
  const cc = u.match(/creativecommons\.org\/licenses\/([a-z-]+)\/(\d\.\d)/);
  if (cc) return `CC ${cc[1].toUpperCase()} ${cc[2]}`;
  return null;
}

/** @param {string|null} s */
function istHttp(s) {
  return typeof s === 'string' && /^https?:\/\//i.test(s);
}

/** Höchstens so viele Themen je Material (Prototyp). */
export const THEMEN_MAX = 4;

/**
 * Wer das Material verantwortet: Urheber, Herausgeber und Mitwirkende
 * (dedupliziert), sonst der Hostname der Ressource, sonst ein Hinweis.
 * @param {{ urheber: string[], herausgeber: string[], mitwirkende: string[], url: string|null }} m
 */
export function herkunftBilden(m) {
  const namen = [...new Set([...m.urheber, ...m.herausgeber, ...m.mitwirkende])];
  if (namen.length > 0) return namen.join(' · ');
  if (m.url) {
    try {
      return new URL(m.url).hostname.replace(/^www\./, '');
    } catch {
      // keine gültige URL — dann der Hinweis
    }
  }
  return 'Herkunft nicht angegeben';
}

/**
 * Dasselbe Material mit Pfaden, die den Schlüssel nennen — wenn `d` allein
 * mehrdeutig ist (routen/bestand.js entscheidet, ADR-0008).
 * @param {Material} m
 * @returns {Material}
 */
export function mitVon(m) {
  const von = `?${new URLSearchParams({ von: m.pubkey })}`;
  return { ...m, pfad: `/m/${m.kennung}${von}`, jsonPfad: `/m/${m.kennung}/json${von}` };
}

/**
 * @param {Event} event
 * @returns {Material}
 */
export function materialAusEvent(event) {
  const tags = event.tags;
  const d = erstes(tags, 'd') ?? '';
  const kennung = kennungAusD(d);
  const lizenz = erstes(tags, 'license:id');
  const url = istHttp(d)
    ? d
    : [erstes(tags, 'encoding:contentUrl'), ...alle(tags, 'r')].find(istHttp) ?? null;
  const bildRoh = erstes(tags, 'image');
  const urheber = alle(tags, 'creator:name');
  const herausgeber = alle(tags, 'publisher:name');
  const mitwirkende = alle(tags, 'contributor:name');
  const schlagworte = alle(tags, 't');
  const faecher = begriffe(tags, 'about');
  const ressourcentypen = begriffe(tags, 'learningResourceType');
  const bildungsstufen = begriffe(tags, 'educationalLevel');
  return {
    id: event.id,
    pubkey: event.pubkey,
    createdAt: event.created_at,
    d,
    kennung,
    pfad: `/m/${kennung}`,
    jsonPfad: `/m/${kennung}/json`,
    name: erstes(tags, 'name') ?? (d || '(ohne Titel)'),
    beschreibung: erstes(tags, 'description') ?? '',
    url,
    bild: istHttp(bildRoh) ? bildRoh : null,
    lizenz,
    lizenzUrl: istHttp(lizenz) ? lizenz : null,
    lizenzKuerzel: lizenzKuerzel(lizenz),
    typen: alle(tags, 'type'),
    schlagworte,
    sprachen: alle(tags, 'inLanguage'),
    urheber,
    herausgeber,
    mitwirkende,
    herkunft: herkunftBilden({ urheber, herausgeber, mitwirkende, url }),
    themen: (schlagworte.length > 0 ? schlagworte : faecher.map((f) => f.label)).slice(0, THEMEN_MAX),
    typ: typAusBegriffen(ressourcentypen),
    typKeys: typenAusBegriffen(ressourcentypen),
    stufe: stufeAusBegriffen(bildungsstufen),
    stufenKeys: stufenAusBegriffen(bildungsstufen),
    bildungsstufen,
    faecher,
    fachKeys: faecherAusBegriffen(faecher),
    ressourcentypen,
    datum: erstes(tags, 'datePublished') ?? erstes(tags, 'dateCreated')
  };
}

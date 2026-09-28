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

/** @typedef {import('../services/relay.js').Event} Event */

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
 * @property {string} pfad          /m/<kennung>
 * @property {string} name
 * @property {string} beschreibung
 * @property {string|null} url      `d`, wenn es eine http(s)-Adresse ist
 * @property {string|null} bild
 * @property {string|null} lizenz   URL der Lizenz
 * @property {string|null} lizenzKuerzel  z. B. „CC BY-SA 4.0“, sonst null
 * @property {string[]} typen       AMB `type`, z. B. LearningResource
 * @property {string[]} schlagworte
 * @property {string[]} sprachen
 * @property {string[]} urheber
 * @property {string[]} herausgeber
 * @property {Begriff[]} bildungsstufen
 * @property {Begriff[]} faecher
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

/** @param {string} d */
export function kennungAusD(d) {
  return encodeURIComponent(d);
}

/** @param {string} kennung @returns {string|null} */
export function dAusKennung(kennung) {
  try {
    return decodeURIComponent(kennung);
  } catch {
    return null;
  }
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

/**
 * @param {Event} event
 * @returns {Material}
 */
export function materialAusEvent(event) {
  const tags = event.tags;
  const d = erstes(tags, 'd') ?? '';
  const kennung = kennungAusD(d);
  const lizenz = erstes(tags, 'license:id');
  return {
    id: event.id,
    pubkey: event.pubkey,
    createdAt: event.created_at,
    d,
    kennung,
    pfad: `/m/${kennung}`,
    name: erstes(tags, 'name') ?? (d || '(ohne Titel)'),
    beschreibung: erstes(tags, 'description') ?? '',
    url: /^https?:\/\//i.test(d) ? d : null,
    bild: erstes(tags, 'image'),
    lizenz,
    lizenzKuerzel: lizenzKuerzel(lizenz),
    typen: alle(tags, 'type'),
    schlagworte: alle(tags, 't'),
    sprachen: alle(tags, 'inLanguage'),
    urheber: alle(tags, 'creator:name'),
    herausgeber: alle(tags, 'publisher:name'),
    bildungsstufen: begriffe(tags, 'educationalLevel'),
    faecher: begriffe(tags, 'about'),
    ressourcentypen: begriffe(tags, 'learningResourceType'),
    datum: erstes(tags, 'datePublished') ?? erstes(tags, 'dateCreated')
  };
}

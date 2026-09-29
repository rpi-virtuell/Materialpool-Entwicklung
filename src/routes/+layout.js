// Beide Formen (mit und ohne abschließendem Schrägstrich) antworten.
export const trailingSlash = 'ignore';

// Kein Client-Rendering: Die Seiten sind ohne JavaScript vollständig
// (CLAUDE.md). Ohne Hydration entfallen das JS-Bündel und die als JSON
// mitgeschickten Seitendaten — bei 24 Karten je Liste rund 90 kB je Seite.
export const csr = false;

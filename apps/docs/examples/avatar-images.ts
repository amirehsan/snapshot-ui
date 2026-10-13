/*
 * The images the avatar examples share, as `data:` URIs, so no example sends a request off the page. A module,
 * not an example: it is imported by the examples and never registered.
 */

/** An SVG as a `data:` URI. */
const svg = (markup: string): string =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">${markup}</svg>`)}`;

/** A simple portrait: a head and shoulders on a pale ground. */
export const PORTRAIT: string = svg(
  '<rect width="40" height="40" fill="#c9d6df"/><circle cx="20" cy="16" r="8" fill="#3f4e5a"/>' +
    '<path d="M4 40c0-9 7-15 16-15s16 6 16 15z" fill="#3f4e5a"/>',
);

/** A two-color mark for a merchant: a white square with a dark tile, so the ring's edge shows on a white card. */
export const LOGO: string = svg(
  '<rect width="40" height="40" fill="#ffffff"/><rect x="10" y="10" width="20" height="20" fill="#1d3b53"/>',
);

/** A PNG that cannot be decoded, so the browser reports an error and the initials stay. */
export const BROKEN = 'data:image/png;base64,AAAA';

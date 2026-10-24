/*
 * Three pictures for the stories that show choice cards with pictures: a page in the light theme, in the dark
 * theme, and split between the two for "System". Each is an inline svg drawn for the purpose, as a data URL, so
 * no story loads a file from the network. They are decoration: a story gives each `alt=""`. Story code only; it
 * never ships.
 */

/** An svg drawing of a page: a ground, a rail, a title bar and three lines, in the colors given. */
function page(ground: string, rail: string, ink: string, line: string): string {
  return (
    `<rect width="160" height="90" fill="${ground}"/>` +
    `<rect x="10" y="10" width="34" height="70" rx="6" fill="${rail}"/>` +
    `<rect x="54" y="14" width="64" height="8" rx="4" fill="${ink}"/>` +
    `<rect x="54" y="32" width="94" height="6" rx="3" fill="${line}"/>` +
    `<rect x="54" y="44" width="80" height="6" rx="3" fill="${line}"/>` +
    `<rect x="54" y="56" width="88" height="6" rx="3" fill="${line}"/>`
  );
}

const svg = (body: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice">${body}</svg>`,
  )}`;

const LIGHT_PAGE = page('#f3f0ee', '#fcfbfa', '#141413', '#c9c4bf');
const DARK_PAGE = page('#141413', '#252523', '#faf9f5', '#5c5b57');

/** The light theme: a cream page with ink type. */
export const LIGHT_PICTURE: string = svg(LIGHT_PAGE);

/** The dark theme: a near-black page with light type. */
export const DARK_PICTURE: string = svg(DARK_PAGE);

/** The device's theme: the light page on the left and the dark one on the right. */
export const SYSTEM_PICTURE: string = svg(
  `<defs><clipPath id="half"><rect x="80" width="80" height="90"/></clipPath></defs>${LIGHT_PAGE}` +
    `<g clip-path="url(#half)">${DARK_PAGE}</g>`,
);

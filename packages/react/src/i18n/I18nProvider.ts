'use client';

/**
 * React Aria's locale provider, from the library's own copy of React Aria, so the locale and its direction
 * reach every part, the overlays a portal moves out of the page included. An app wraps a right-to-left
 * region, such as a guide in Persian, in it with the region's locale, since a `dir` on a page section does not
 * reach an overlay portaled to the body.
 */
export { I18nProvider, type I18nProviderProps } from 'react-aria-components';

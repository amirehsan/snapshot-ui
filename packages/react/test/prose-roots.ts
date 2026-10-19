import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

/**
 * The component roots core's built prose.css hands back to the layer below prose's, read from the one rule that
 * does it (`.prose :is(<roots>), .prose :is(<roots>) * { all: revert-layer }`, insights spec correction 52). The
 * test that renders each part checks its outermost element against this list, so a component whose root class
 * the generator missed is drawn by prose inside a prose box, and fails (spec correction 93).
 */
export function proseRoots(): Set<string> {
  const file = createRequire(import.meta.url).resolve('@snapshot-ui/core/components/prose.css');
  const css = readFileSync(file, 'utf8').replace(/\s+/g, ' ');
  const rule = /\.prose :is\(([^)]*)\) ?, ?\.prose :is\([^)]*\) \* ?\{ ?all: ?revert-layer/.exec(css);
  if (!rule?.[1]) throw new Error('No component roots rule in the built prose.css');
  return new Set(rule[1].split(',').map((root) => root.trim().replace(/^\./, '')));
}

/**
 * The classes of the outermost element of server markup that draws, after any leading comments and React Aria's
 * `template` (its hidden pass, never drawn); `null` for markup that draws nothing, such as a closed overlay.
 */
export function outermostClasses(markup: string): string[] | null {
  // Comments, React Aria's hidden pass, React's image preloads and a test's own wrapper: `div.host`, or a `div`
  // that sets only the direction and the language, as a Persian row's does.
  const drawn = markup.replace(
    /^\s*(?:(?:<!--[\s\S]*?-->|<template>[\s\S]*?<\/template>|<link\b[^>]*>|<div(?: class="host"| (?:dir|lang)="[^"]*")+>)\s*)*/,
    '',
  );
  const tag = /^<[a-zA-Z][a-zA-Z0-9-]*\b([^>]*)>/.exec(drawn);
  if (!tag) return null;
  const classes = /\bclass="([^"]*)"/.exec(tag[1] ?? '');
  return classes?.[1] ? classes[1].split(/\s+/).filter(Boolean) : [];
}

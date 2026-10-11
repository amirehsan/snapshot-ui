'use client';

import type { Item, Node, Root } from 'fumadocs-core/page-tree';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, type ReactElement, type ReactNode } from 'react';

interface Group {
  name: ReactNode;
  items: Item[];
}

/** Separators in meta.json start a group; a folder is a group of its own pages. */
function groupsOf(tree: Root): Group[] {
  const groups: Group[] = [];
  const current = (): Group => {
    const last = groups.at(-1);
    if (last) return last;
    const group: Group = { name: 'Docs', items: [] };
    groups.push(group);
    return group;
  };
  const visit = (node: Node): void => {
    if (node.type === 'separator') groups.push({ name: node.name ?? '', items: [] });
    else if (node.type === 'page') current().items.push(node);
    else
      groups.push({
        name: node.name,
        items: node.children.filter((child): child is Item => child.type === 'page'),
      });
  };
  tree.children.forEach(visit);
  return groups.filter((group) => group.items.length > 0);
}

const label = (item: Item): string => (typeof item.name === 'string' ? item.name : '');

export function Rail({
  tree,
  pathname,
  version,
  collapsed,
  drawerOpen,
  onCloseDrawer,
  onToggleCollapsed,
  onSearch,
}: {
  tree: Root;
  pathname: string;
  version: string;
  collapsed: boolean;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
  onToggleCollapsed: () => void;
  onSearch: () => void;
}): ReactElement {
  const tip = useRef<HTMLDivElement>(null);
  const nav = useRef<HTMLElement>(null);

  // Names float beside the icons while the rail is collapsed. Fixed rather than
  // inside the rail, so the list keeps scrolling: 400ms on hover, at once on focus.
  useEffect(() => {
    const element = tip.current;
    const list = nav.current;
    if (!element || !list) return;
    let timer = 0;
    const hide = (): void => {
      window.clearTimeout(timer);
      element.hidden = true;
    };
    const show = (target: HTMLElement, delay: number): void => {
      if (document.documentElement.dataset.rail !== 'collapsed' || matchMedia('(width < 1024px)').matches)
        return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const box = target.getBoundingClientRect();
        element.textContent = target.dataset.label ?? '';
        element.style.left = `${String(box.right + 14)}px`;
        element.style.top = `${String(box.top + box.height / 2)}px`;
        element.hidden = false;
      }, delay);
    };
    const targets = [...document.querySelectorAll<HTMLElement>('.rail [data-label]')];
    const listeners = targets.map((target) => {
      const enter = (): void => {
        show(target, 400);
      };
      const focus = (): void => {
        if (target.matches(':focus-visible')) show(target, 0);
      };
      target.addEventListener('mouseenter', enter);
      target.addEventListener('focus', focus);
      target.addEventListener('mouseleave', hide);
      target.addEventListener('blur', hide);
      return () => {
        target.removeEventListener('mouseenter', enter);
        target.removeEventListener('focus', focus);
        target.removeEventListener('mouseleave', hide);
        target.removeEventListener('blur', hide);
      };
    });
    list.addEventListener('scroll', hide);
    return () => {
      listeners.forEach((remove) => {
        remove();
      });
      list.removeEventListener('scroll', hide);
      hide();
    };
  }, [tree, collapsed]);

  return (
    <>
      {/*
        The page's complementary landmark, and, open as a drawer, a modal dialog.
        An aside may not take the dialog role, so this is a div with both roles in turn.
      */}
      <div
        className="rail"
        id="rail"
        role={drawerOpen ? 'dialog' : 'complementary'}
        aria-modal={drawerOpen ? true : undefined}
        aria-label={drawerOpen ? 'Menu' : 'Documentation'}
      >
        <div className="rail-head">
          <Link className="brand" href="/">
            <svg viewBox="0 0 26 26" fill="none" aria-hidden>
              <circle cx="13" cy="13" r="10" stroke="currentColor" strokeWidth="2" />
              <circle cx="21.5" cy="7" r="3.5" fill="var(--color-signal-light)" />
            </svg>
            <span className="rail-label">snapshot ui</span>
          </Link>
          <span className="badge rail-version">v{version}</span>
          {/* Only drawn while the rail is a drawer, where touch and screen reader users need a way out. */}
          <button
            className="icon-button icon-button-ghost rail-close"
            type="button"
            aria-label="Close menu"
            onClick={onCloseDrawer}
          >
            <X aria-hidden />
          </button>
        </div>
        <button
          className="rail-search"
          type="button"
          data-label="Search docs"
          aria-label="Search docs"
          onClick={onSearch}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
          <span className="rail-label">Search docs</span>
          <span className="kbd rail-key">&#8984;K</span>
        </button>
        <nav className="rail-nav" ref={nav}>
          {groupsOf(tree).map((group, index) => {
            const isCurrent = group.items.some((item) => item.url === pathname);
            return (
              <div key={index}>
                <p className={isCurrent ? 'rail-group rail-group-current' : 'rail-group'}>{group.name}</p>
                <ul className="rail-list">
                  {group.items.map((item) => (
                    <li key={item.url}>
                      <Link
                        className="rail-link"
                        href={item.url}
                        data-label={label(item)}
                        aria-current={item.url === pathname ? 'page' : undefined}
                        onClick={() => {
                          // Going to the page already open changes nothing, so it would leave the drawer up.
                          if (item.url === pathname) onCloseDrawer();
                        }}
                      >
                        {item.icon ? <span className="rail-icon">{item.icon}</span> : null}
                        <span className="rail-label">{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
        <div className="rail-foot">
          <span className="rail-label">MIT &#183; React 19</span>
          <a
            className="icon-button icon-button-ghost"
            href="https://github.com/amirehsan/snapshot-ui"
            aria-label="GitHub"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
            </svg>
          </a>
        </div>
      </div>
      <button
        className="rail-collapse"
        type="button"
        aria-controls="rail"
        aria-expanded={!collapsed}
        onClick={onToggleCollapsed}
      >
        <span className="rail-collapse-label">{collapsed ? 'Expand the menu' : 'Collapse the menu'}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m14 7-5 5 5 5" />
        </svg>
      </button>
      <div className="rail-tip" ref={tip} role="presentation" hidden />
    </>
  );
}

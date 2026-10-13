import { act, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Shortcut, useModifierKey } from './Shortcut';

/** Reports the platform as `platform`, as `navigator.platform` does. */
const onPlatform = (platform: string): void => {
  vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform);
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Shortcut', () => {
  it('is one kbd chip with the class it is given, holding the keys, left to right', () => {
    render(<Shortcut keys="Q" className="menu-item-shortcut" />);
    const chip = screen.getByText('Q');
    expect(chip.tagName).toBe('KBD');
    expect(chip.className).toBe('menu-item-shortcut');
    expect(chip).toHaveAttribute('dir', 'ltr');
  });

  it('says Mod on the server, where there is no navigator, and hydrates from that before it resolves', () => {
    // The server knows no platform, so the chip never reads one there.
    vi.stubGlobal('navigator', undefined);
    const html = renderToString(<Shortcut keys="Mod ," className="menu-item-shortcut" />);
    expect(html).toContain('>Mod ,<');
    vi.unstubAllGlobals();

    onPlatform('MacIntel');
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const seen: string[] = [];
    function Probe(): ReactElement {
      const modifier = useModifierKey();
      seen.push(modifier);
      return <Shortcut keys="Mod ," className="menu-item-shortcut" />;
    }
    let root: Root | undefined;
    act(() => {
      root = hydrateRoot(container, <Probe />);
    });
    // Hydration renders the server's "Mod", so nothing mismatches, then React draws the platform's key.
    expect(seen[0]).toBe('Mod');
    expect(errors).not.toHaveBeenCalled();
    expect(container.querySelector('kbd')).toHaveTextContent('\u2318 ,');
    act(() => {
      root?.unmount();
    });
    container.remove();
  });

  it('draws Mod as the Command symbol on an Apple platform, from its first render in the browser', () => {
    for (const platform of ['MacIntel', 'iPhone', 'iPad', 'iPod touch']) {
      onPlatform(platform);
      const seen: string[] = [];
      function Probe(): ReactElement {
        seen.push(useModifierKey());
        return <Shortcut keys="Mod ," className="menu-item-shortcut" />;
      }
      const { unmount } = render(<Probe />);
      // A chip that mounts in the browser, as a menu's does when it opens, never paints "Mod".
      expect(seen, platform).not.toContain('Mod');
      expect(screen.getByText('\u2318 ,'), platform).toBeInTheDocument();
      unmount();
    }
  });

  it('draws Mod as Ctrl elsewhere', () => {
    onPlatform('Win32');
    render(<Shortcut keys="Mod K" className="tooltip-shortcut" />);
    expect(screen.getByText('Ctrl K')).toHaveClass('tooltip-shortcut');
  });
});

import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
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
  it('is one kbd chip with the class it is given, holding the keys', () => {
    render(<Shortcut keys="Q" className="menu-item-shortcut" />);
    const chip = screen.getByText('Q');
    expect(chip.tagName).toBe('KBD');
    expect(chip.className).toBe('menu-item-shortcut');
  });

  it('says Mod on the server, where there is no navigator, and on the first client render', () => {
    // A server render runs no effect, so the chip never reads the platform there.
    vi.stubGlobal('navigator', undefined);
    expect(renderToString(<Shortcut keys="Mod ," className="menu-item-shortcut" />)).toContain('>Mod ,<');
    vi.unstubAllGlobals();

    onPlatform('MacIntel');
    const seen: string[] = [];
    function Probe(): ReactElement | null {
      seen.push(useModifierKey());
      return null;
    }
    render(<Probe />);
    // The first render matches the server's HTML, so hydration agrees; the platform's key follows.
    expect(seen[0]).toBe('Mod');
    expect(seen.at(-1)).toBe('\u2318');
  });

  it('draws Mod as the Command symbol on an Apple platform, once mounted', () => {
    for (const platform of ['MacIntel', 'iPhone', 'iPad', 'iPod touch']) {
      onPlatform(platform);
      const { unmount } = render(<Shortcut keys="Mod ," className="menu-item-shortcut" />);
      expect(screen.getByText('\u2318 ,'), platform).toBeInTheDocument();
      unmount();
    }
  });

  it('draws Mod as Ctrl elsewhere, once mounted', () => {
    onPlatform('Win32');
    render(<Shortcut keys="Mod K" className="tooltip-shortcut" />);
    expect(screen.getByText('Ctrl K')).toHaveClass('tooltip-shortcut');
  });
});

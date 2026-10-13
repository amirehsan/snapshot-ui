import { render, screen } from '@testing-library/react';
import { I18nProvider as RACI18nProvider } from 'react-aria-components';
import { describe, expect, it } from 'vitest';
import * as library from '../index';
import { Dialog } from '../dialog';

describe('I18nProvider', () => {
  it('is React Aria’s own, from the copy the library uses, so its locale reaches every part', () => {
    expect(library.I18nProvider).toBe(RACI18nProvider);
  });

  it('turns an overlay opened in a right-to-left region right to left, though a portal moves it out', () => {
    render(
      <library.I18nProvider locale="fa-IR">
        <section dir="rtl" lang="fa">
          <Dialog defaultOpen title="Rename the workspace" />
        </section>
      </library.I18nProvider>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Rename the workspace' });
    expect(dialog.closest('[lang="fa"]')).toBeNull();
    expect(dialog.closest('[dir]')).toHaveAttribute('dir', 'rtl');
  });
});

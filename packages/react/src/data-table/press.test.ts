import { afterEach, describe, expect, it } from 'vitest';
import { selectsOnPress } from './press';

/** A row as DataTable draws it: a checkbox cell, a cell with text, the row header's link, a cell with a button. */
function row(): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = `<table role="grid"><thead><tr role="row"><th role="columnheader" tabindex="-1"><span>Date</span></th></tr></thead><tbody><tr role="row" tabindex="-1">
    <td role="gridcell" tabindex="-1" data-selection=""><div class="checkbox-field"><label class="checkbox"><input type="checkbox" /><span class="checkbox-box"></span></label></div></td>
    <td role="gridcell" tabindex="0"><span data-text="">12 Oct</span></td>
    <td role="rowheader" tabindex="-1"><a class="data-table-link" href="/t1"><span data-link-text="">Corner Mart</span></a></td>
    <td role="gridcell" tabindex="-1"><button type="button"><svg data-icon=""></svg></button><span class="badge">Pending</span></td>
  </tr></tbody></table>`;
  document.body.append(root);
  return root;
}

const at = (root: HTMLElement, selector: string): Element => {
  const found = root.querySelector(selector);
  if (found === null) throw new Error(`Nothing matches ${selector}`);
  return found;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('the press guard', () => {
  it('takes a press on a cell or its text, the cell holding focus too, which React Aria would select on', () => {
    const root = row();
    expect(selectsOnPress(at(root, '[data-selection]'), root)).toBe(true);
    expect(selectsOnPress(at(root, '[data-text]'), root)).toBe(true);
    expect(selectsOnPress(at(root, '[data-text]').parentElement as Element, root)).toBe(true);
    expect(selectsOnPress(at(root, '.badge'), root)).toBe(true);
  });

  it('leaves a press on a control, the checkbox, the row link and anything in them to them', () => {
    const root = row();
    for (const selector of [
      'input[type="checkbox"]',
      '.checkbox-box',
      '[data-link-text]',
      'button',
      '[data-icon]',
    ]) {
      expect(selectsOnPress(at(root, selector), root), selector).toBe(false);
    }
  });

  it('leaves a header, the row itself and anything outside the root alone', () => {
    const root = row();
    expect(selectsOnPress(at(root, 'thead span'), root)).toBe(false);
    expect(selectsOnPress(at(root, 'tbody tr'), root)).toBe(false);
    const portal = document.createElement('div');
    portal.innerHTML = '<div role="gridcell"><span>Elsewhere</span></div>';
    document.body.append(portal);
    expect(selectsOnPress(at(portal, 'span'), root)).toBe(false);
  });
});

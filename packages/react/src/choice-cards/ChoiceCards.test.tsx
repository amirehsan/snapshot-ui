import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Moon, Sun } from 'lucide-react';
import { createRef, type ReactElement } from 'react';
import { I18nProvider } from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { formOf, root } from '../../test/dom';
import { ChoiceCard, ChoiceCards, type ChoiceCardsProps } from './ChoiceCards';

/** A picture as an app passes one: decoration, with an empty alt. */
const PICTURE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"/%3E';

/** The three plans every test below chooses between, a detail and a sentence on each. */
function Plans(props: Partial<ChoiceCardsProps>): ReactElement {
  return (
    <ChoiceCards label="Plan" name="plan" {...props}>
      <ChoiceCard value="monthly" description="Billed every month. Cancel any time." detail="$12 a month">
        Monthly
      </ChoiceCard>
      <ChoiceCard value="yearly" description="Two months free." detail="$120 a year">
        Yearly
      </ChoiceCard>
      <ChoiceCard value="free" description="One account, no exports." detail="Free">
        Starter
      </ChoiceCard>
    </ChoiceCards>
  );
}

/** The cards of a render, the label elements, in order. */
const cards = (container: HTMLElement): HTMLLabelElement[] => [
  ...container.querySelectorAll<HTMLLabelElement>('label.choice-card'),
];

describe('ChoiceCards', () => {
  it('draws a radio group of label cards, each around a native radio with name and value', () => {
    const { container } = render(<Plans defaultValue="yearly" />);
    const group = screen.getByRole('radiogroup', { name: 'Plan' });
    expect(group).toBe(root(container));
    expect(group).toHaveClass('field', 'radio-group', 'choice-cards');
    const items = container.querySelector('.choice-cards-items');
    expect(items?.parentElement).toBe(group);
    // The field contract's order: the label row, the items, the hint and the error.
    expect([...group.children].map((child) => child.className.split(' ')[0])).toEqual([
      'field-head',
      'choice-cards-items',
    ]);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(radios.map((radio) => (radio as HTMLInputElement).name)).toEqual(['plan', 'plan', 'plan']);
    expect(radios.map((radio) => (radio as HTMLInputElement).value)).toEqual(['monthly', 'yearly', 'free']);
    for (const [at, card] of cards(container).entries()) {
      // A RadioField around a label: the field is the list's or the grid's item.
      expect(card.parentElement).toHaveClass('choice-card-field');
      expect(card.parentElement?.parentElement).toBe(items);
      expect(card).toContainElement(radios[at] ?? null);
      // In DOM order: the hidden radio, the text and the dot.
      expect([...card.children].map((child) => child.className)).toEqual([
        '',
        'choice-card-text',
        'radio-indicator',
      ]);
      expect(
        [...(card.querySelector('.choice-card-text')?.children ?? [])].map((child) => child.className),
      ).toEqual(['choice-card-title', 'choice-card-detail', 'choice-card-description']);
      expect(card.querySelector('.radio-indicator')).toHaveAttribute('aria-hidden', 'true');
    }
    expect(screen.getByRole('radio', { name: 'Yearly' })).toBeChecked();
  });

  it('names each radio by its title alone and describes it by its sentence then its detail', () => {
    render(<Plans description="You can change plans at any time." />);
    const yearly = screen.getByRole('radio', { name: 'Yearly' });
    expect(yearly).toHaveAccessibleName('Yearly');
    expect(yearly).toHaveAccessibleDescription(expect.stringMatching(/^Two months free\. ?\$120 a year/));
    const title = screen.getByText('Yearly');
    const sentence = screen.getByText('Two months free.');
    const detail = screen.getByText('$120 a year');
    expect(yearly).toHaveAttribute('aria-labelledby', title.id);
    // The sentence, then the detail, then what the group adds, its hint.
    expect(yearly.getAttribute('aria-describedby')?.split(' ').slice(0, 2)).toEqual([sentence.id, detail.id]);
    expect(new Set([title.id, sentence.id, detail.id]).size).toBe(3);
  });

  it("lets an app's own aria-label or aria-labelledby name a card over its title", () => {
    render(
      <ChoiceCards label="Plan">
        <ChoiceCard value="monthly" aria-label="Monthly plan">
          Monthly
        </ChoiceCard>
        <ChoiceCard value="yearly" aria-labelledby="outside">
          Yearly
        </ChoiceCard>
        <ChoiceCard value="free" aria-label="Free plan" />
      </ChoiceCards>,
    );
    expect(screen.getByRole('radio', { name: 'Monthly plan' })).not.toHaveAttribute('aria-labelledby');
    expect(screen.getAllByRole('radio')[1]).toHaveAttribute('aria-labelledby', 'outside');
    // A card with no title draws no title span.
    const free = screen.getByRole('radio', { name: 'Free plan' }).closest('label');
    expect(free?.querySelector('.choice-card-title')).toBeNull();
  });

  it('hides the media from assistive technology and reads no picture alt', () => {
    const { container } = render(
      <ChoiceCards label="Theme" layout="grid">
        <ChoiceCard value="light" picture={<img src={PICTURE} alt="A cream page" />}>
          Light
        </ChoiceCard>
        <ChoiceCard value="dark" icon={<Moon />}>
          Dark
        </ChoiceCard>
      </ChoiceCards>,
    );
    const media = [...container.querySelectorAll('.choice-card-media')];
    expect(media).toHaveLength(2);
    for (const each of media) {
      expect(each).toHaveAttribute('aria-hidden', 'true');
      // Right after the hidden radio, before the text.
      expect(each.previousElementSibling?.querySelector('input')).not.toBeNull();
      expect(each.nextElementSibling).toHaveClass('choice-card-text');
    }
    expect(media.map((each) => each.getAttribute('data-media'))).toEqual(['picture', 'icon']);
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveAccessibleName('Light');
    expect(screen.getByRole('radio', { name: 'Light' })).not.toHaveAccessibleDescription(
      expect.stringContaining('cream'),
    );
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('warns once for a card with both icon and picture, and draws the picture', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const { container, rerender } = render(
        <ChoiceCards label="Theme">
          <ChoiceCard value="light" icon={<Sun />} picture={<img src={PICTURE} alt="" />}>
            Light
          </ChoiceCard>
        </ChoiceCards>,
      );
      rerender(
        <ChoiceCards label="Theme">
          <ChoiceCard value="light" icon={<Sun />} picture={<img src={PICTURE} alt="" />}>
            Light
          </ChoiceCard>
        </ChoiceCards>,
      );
      const media = container.querySelector('.choice-card-media');
      expect(media?.querySelector('img')).not.toBeNull();
      expect(media?.querySelector('svg')).toBeNull();
      const calls = warn.mock.calls.filter(([message]) => String(message).includes('ChoiceCard'));
      expect(calls).toHaveLength(1);
      expect(String(calls[0]?.[0])).toContain('picture');
    } finally {
      warn.mockRestore();
    }
  });

  it('warns once for a card holding a link, a button or another input', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      for (const inside of [
        <a href="/terms">Terms</a>,
        <button type="button">More</button>,
        <input aria-label="Seats" />,
      ]) {
        warn.mockClear();
        const { unmount } = render(
          <ChoiceCards label="Plan">
            <ChoiceCard value="team" description={inside}>
              Team
            </ChoiceCard>
          </ChoiceCards>,
        );
        const calls = warn.mock.calls.filter(([message]) => String(message).includes('ChoiceCard'));
        expect(calls).toHaveLength(1);
        expect(String(calls[0]?.[0])).toContain('link, a button or an input');
        unmount();
      }
      // Its own radio is not one.
      warn.mockClear();
      render(<Plans />);
      expect(warn.mock.calls.filter(([message]) => String(message).includes('ChoiceCard'))).toEqual([]);
    } finally {
      warn.mockRestore();
    }
  });

  it.each([['list'], ['grid']] as const)('writes data-layout %s, list by default', (layout) => {
    const { container, unmount } = render(<Plans />);
    expect(root(container)).toHaveAttribute('data-layout', 'list');
    unmount();
    const again = render(<Plans layout={layout} />);
    expect(root(again.container)).toHaveAttribute('data-layout', layout);
  });

  it('chooses with the arrow keys in reading order with wrap, and with Space when nothing is chosen', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Plans layout="grid" onChange={onChange} />);
    await user.tab();
    const [monthly, yearly, free] = screen.getAllByRole('radio');
    expect(monthly).toHaveFocus();
    expect(monthly).not.toBeChecked();
    await user.keyboard(' ');
    expect(monthly).toBeChecked();
    await user.keyboard('{ArrowDown}');
    expect(yearly).toHaveFocus();
    expect(yearly).toBeChecked();
    await user.keyboard('{ArrowRight}');
    expect(free).toBeChecked();
    // Past the last it wraps to the first, and back.
    await user.keyboard('{ArrowDown}');
    expect(monthly).toBeChecked();
    await user.keyboard('{ArrowUp}');
    expect(free).toBeChecked();
    await user.keyboard('{ArrowLeft}');
    expect(yearly).toBeChecked();
    expect(onChange.mock.calls.map(([value]) => value as string)).toEqual([
      'monthly',
      'yearly',
      'free',
      'monthly',
      'free',
      'yearly',
    ]);
  });

  it('mirrors Left and Right in a right-to-left grid, and keeps a list as RadioGroup keeps its stack', async () => {
    const user = userEvent.setup();
    const grid = render(
      <I18nProvider locale="fa-IR">
        <Plans layout="grid" defaultValue="monthly" />
      </I18nProvider>,
    );
    // A grid runs in rows, so it is a horizontal group: Arrow Left is the next card in right to left.
    expect(root(grid.container)).toHaveAttribute('aria-orientation', 'horizontal');
    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'Yearly' })).toBeChecked();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Monthly' })).toBeChecked();
    grid.unmount();

    // A list is a stack, a vertical group as RadioGroup's: Down and Up move, and Left and Right are previous and
    // next in either direction, React Aria's rule for a vertical group (plan, spec correction 42).
    const list = render(
      <I18nProvider locale="fa-IR">
        <Plans defaultValue="monthly" />
      </I18nProvider>,
    );
    expect(root(list.container)).toHaveAttribute('aria-orientation', 'vertical');
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Yearly' })).toBeChecked();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Starter' })).toBeChecked();
  });

  it('chooses a card by a press anywhere on it', async () => {
    const user = userEvent.setup();
    const { container } = render(<Plans />);
    await user.click(screen.getByText('One account, no exports.'));
    expect(screen.getByRole('radio', { name: 'Starter' })).toBeChecked();
    expect(cards(container)[2]).toHaveAttribute('data-selected', 'true');
    await user.click(screen.getByText('$12 a month'));
    expect(screen.getByRole('radio', { name: 'Monthly' })).toBeChecked();
  });

  it('submits the chosen value and resets it on the form reset', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Plans defaultValue="monthly" />
        <button type="reset">Reset</button>
      </form>,
    );
    const form = formOf(container);
    expect(new FormData(form).get('plan')).toBe('monthly');
    await user.click(screen.getByText('Yearly'));
    expect(new FormData(form).get('plan')).toBe('yearly');
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('radio', { name: 'Monthly' })).toBeChecked();
    expect(new FormData(form).get('plan')).toBe('monthly');
  });

  it('draws the error edge on every card while invalid, and the Changed chip only while changed', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Plans isRequired errorMessage="Choose a plan." />
        <button type="submit">Save</button>
      </form>,
    );
    const group = root(container).firstElementChild;
    expect(group).not.toHaveAttribute('data-invalid');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(group).toHaveAttribute('data-invalid');
    expect(screen.getByText('Choose a plan.')).toHaveClass('field-error');
    for (const card of cards(container)) expect(card).toHaveAttribute('data-invalid', 'true');
    // Choosing clears it.
    await user.click(screen.getByText('Starter'));
    expect(group).not.toHaveAttribute('data-invalid');

    const changed = render(<Plans isChanged defaultValue="yearly" />);
    const changedGroup = root(changed.container);
    expect(changedGroup).toHaveAttribute('data-changed');
    const chip = changed.container.querySelector('.field-changed');
    expect(chip).toHaveTextContent('Changed');
    expect(changedGroup.getAttribute('aria-describedby')?.split(' ')).toContain(chip?.id);
    // No edge of its own: nothing on a card says changed.
    for (const card of cards(changed.container)) expect(card).not.toHaveAttribute('data-changed');
  });

  it('sets data-changed alone on an unlabelled changed group', () => {
    const { container } = render(
      <ChoiceCards aria-label="Plan" isChanged>
        <ChoiceCard value="monthly">Monthly</ChoiceCard>
        <ChoiceCard value="yearly">Yearly</ChoiceCard>
      </ChoiceCards>,
    );
    const group = root(container);
    expect(group).toHaveAttribute('data-changed');
    expect(container.querySelector('.field-head')).toBeNull();
    expect(container.querySelector('.field-changed')).toBeNull();
    expect(group).not.toHaveAttribute('aria-describedby');
  });

  it('disables one card or the whole group, and draws read only without a pointer', async () => {
    const user = userEvent.setup();
    const one = render(
      <ChoiceCards label="Plan" defaultValue="monthly">
        <ChoiceCard value="monthly">Monthly</ChoiceCard>
        <ChoiceCard value="team" isDisabled description="For five or more people.">
          Team
        </ChoiceCard>
        <ChoiceCard value="free">Free</ChoiceCard>
      </ChoiceCards>,
    );
    expect(screen.getByRole('radio', { name: 'Team' })).toBeDisabled();
    expect(cards(one.container)[1]).toHaveAttribute('data-disabled', 'true');
    await user.click(screen.getByText('Team'));
    expect(screen.getByRole('radio', { name: 'Monthly' })).toBeChecked();
    // The keys pass over it.
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Free' })).toBeChecked();
    one.unmount();

    const all = render(<Plans isDisabled defaultValue="yearly" />);
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
    expect(root(all.container)).toHaveAttribute('data-disabled');
    all.unmount();

    const readOnly = render(<Plans isReadOnly defaultValue="yearly" />);
    for (const card of cards(readOnly.container)) expect(card).toHaveAttribute('data-readonly', 'true');
    await user.click(screen.getByText('Starter'));
    expect(screen.getByRole('radio', { name: 'Yearly' })).toBeChecked();
  });

  it('passes className, ref and inputRef to the card and the rest to the group', () => {
    const group = createRef<HTMLDivElement>();
    const card = createRef<HTMLLabelElement>();
    const input = createRef<HTMLInputElement>();
    const { container } = render(
      <ChoiceCards
        label="Plan"
        ref={group}
        className="plan-picker"
        data-testid="plans"
        style={{ maxWidth: '30rem' }}
      >
        <ChoiceCard value="monthly" ref={card} inputRef={input} className="plan-card">
          Monthly
        </ChoiceCard>
        <ChoiceCard
          value="yearly"
          className={({ isSelected, defaultClassName }) =>
            `${String(defaultClassName)} ${isSelected ? 'on' : 'off'}`
          }
        >
          Yearly
        </ChoiceCard>
      </ChoiceCards>,
    );
    expect(group.current).toBe(root(container));
    expect(group.current).toHaveClass('field', 'radio-group', 'choice-cards', 'plan-picker');
    expect(group.current).toHaveAttribute('data-testid', 'plans');
    expect(group.current?.style.maxWidth).toBe('30rem');
    expect(card.current).toBe(cards(container)[0]);
    expect(card.current).toHaveClass('choice-card', 'plan-card');
    expect(input.current).toBe(screen.getByRole('radio', { name: 'Monthly' }));
    expect(cards(container)[1]).toHaveClass('choice-card', 'off');
  });

  it('requires a name in its types and takes no layout or selection mode it does not have', () => {
    render(
      <>
        {/* @ts-expect-error: a group needs a label, an aria-label or an aria-labelledby */}
        <ChoiceCards>
          <ChoiceCard value="a">A</ChoiceCard>
        </ChoiceCards>
        <ChoiceCards label="Plan">
          {/* @ts-expect-error: a card needs a title, an aria-label or an aria-labelledby */}
          <ChoiceCard value="a" />
        </ChoiceCards>
        {/* @ts-expect-error: a list or a grid, no row */}
        <ChoiceCards label="Plan" layout="row">
          <ChoiceCard value="a">A</ChoiceCard>
        </ChoiceCards>
        {/* @ts-expect-error: one choice only; several choices are a later part (ruling 15) */}
        <ChoiceCards label="Plan" selectionMode="multiple">
          <ChoiceCard value="a">A</ChoiceCard>
        </ChoiceCards>
        {/* @ts-expect-error: the cards always stack in reading order */}
        <ChoiceCards label="Plan" orientation="horizontal">
          <ChoiceCard value="a">A</ChoiceCard>
        </ChoiceCards>
      </>,
    );
    expect(screen.getAllByRole('radiogroup')).toHaveLength(5);
  });

  const AXE_CASES: [name: string, element: ReactElement][] = [
    ['list', <Plans key="list" />],
    [
      'grid with icons',
      <ChoiceCards key="icons" label="Theme" layout="grid">
        <ChoiceCard value="light" icon={<Sun />}>
          Light
        </ChoiceCard>
        <ChoiceCard value="dark" icon={<Moon />}>
          Dark
        </ChoiceCard>
      </ChoiceCards>,
    ],
    [
      'grid with pictures',
      <ChoiceCards key="pictures" label="Theme" layout="grid" defaultValue="dark">
        <ChoiceCard value="light" picture={<img src={PICTURE} alt="" />} description="Warm cream page">
          Light
        </ChoiceCard>
        <ChoiceCard value="dark" picture={<img src={PICTURE} alt="" />} description="For low light">
          Dark
        </ChoiceCard>
      </ChoiceCards>,
    ],
    ['details', <Plans key="details" description="Prices include tax." />],
    ['chosen', <Plans key="chosen" defaultValue="yearly" />],
    ['invalid', <Plans key="invalid" isInvalid errorMessage="Choose a plan." />],
    ['changed', <Plans key="changed" isChanged defaultValue="free" />],
    ['disabled', <Plans key="disabled" isDisabled defaultValue="yearly" />],
    [
      'a disabled card',
      <ChoiceCards key="card" label="Plan" defaultValue="monthly">
        <ChoiceCard value="monthly">Monthly</ChoiceCard>
        <ChoiceCard value="team" isDisabled>
          Team
        </ChoiceCard>
      </ChoiceCards>,
    ],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element) => {
    const { container } = render(element);
    await expectNoA11yViolations(container);
  });
});

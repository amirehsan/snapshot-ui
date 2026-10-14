import { render } from '@testing-library/react';
import { StrictMode, type ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useWarnOnce } from './useWarnOnce';

function Probe({ message }: { message: string | null }): ReactElement {
  useWarnOnce(message);
  return <output />;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useWarnOnce', () => {
  it('warns once per mount, in an effect, the first time the message is not null', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Effects never run on the server, so a server render warns nothing.
    renderToString(<Probe message="Not on the server." />);
    expect(warn).not.toHaveBeenCalled();

    const { rerender, unmount } = render(
      <StrictMode>
        <Probe message={null} />
      </StrictMode>,
    );
    expect(warn).not.toHaveBeenCalled();
    rerender(
      <StrictMode>
        <Probe message="First." />
      </StrictMode>,
    );
    // Strict Mode runs the effect twice on the same instance; the mount still warns once.
    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith('First.');
    rerender(
      <StrictMode>
        <Probe message="Second." />
      </StrictMode>,
    );
    rerender(
      <StrictMode>
        <Probe message={null} />
      </StrictMode>,
    );
    expect(warn).toHaveBeenCalledOnce();
    unmount();

    // A new mount warns again.
    render(<Probe message="Again." />);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenLastCalledWith('Again.');
  });
});

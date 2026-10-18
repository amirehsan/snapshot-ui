import { useEffect } from 'react';

/** Asks the browser to warn before the page unloads: the default prevented, and the old `returnValue` set too. */
function warn(event: BeforeUnloadEvent): void {
  event.preventDefault();
  // Chromium before 119 warns only when returnValue is set; the browser shows its own words, never these.
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- the floor's Chromium still needs it to warn
  event.returnValue = '';
}

/**
 * While `isOn`, the browser warns before the tab closes, reloads or leaves for another site, in its own words
 * (ruling 12). A client navigation unloads nothing and is not guarded. iOS Safari shows no warning, so the part
 * that calls this still says on the page what is at risk. The listener is added in an effect and removed when
 * `isOn` turns false or the part unmounts. Internal: UploadTray's, and SaveBar's.
 */
export function useBeforeUnload(isOn: boolean): void {
  useEffect(() => {
    if (!isOn) return;
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
    };
  }, [isOn]);
}

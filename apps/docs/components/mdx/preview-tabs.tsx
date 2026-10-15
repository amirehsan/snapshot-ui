'use client';

import { Eyebrow, Tab, TabList, TabPanel, Tabs } from '@snapshot-ui/react';
import type { ReactElement, ReactNode } from 'react';

/**
 * Preview and Code as the library's own Tabs, so a docs page never draws a second tab look. Both panels stay in
 * the page, force-mounted: the one not selected is inert, and tabs.css hides it. A `wide` stage takes the
 * content grid's full width at every window width (shell.css, "A page with a wide example").
 */
export function PreviewTabs({
  preview,
  code,
  wide = false,
}: {
  preview: ReactNode;
  code: ReactNode;
  wide?: boolean;
}): ReactElement {
  return (
    <Tabs className="preview" defaultSelectedKey="preview">
      <div className="preview-head">
        <Eyebrow>Example</Eyebrow>
        <TabList aria-label="Example">
          <Tab id="preview">Preview</Tab>
          <Tab id="code">Code</Tab>
        </TabList>
      </div>
      <TabPanel id="preview" shouldForceMount>
        <div className={wide ? 'stage stage-wide' : 'stage'}>{preview}</div>
        <div className="stage-bar">
          <span>Follows the page theme and corners</span>
        </div>
      </TabPanel>
      <TabPanel id="code" shouldForceMount>
        {code}
      </TabPanel>
    </Tabs>
  );
}

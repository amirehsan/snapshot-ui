/** One settings section: its key in the address, its name, its list face line and its end state. */
export interface SettingsSection {
  key: string;
  name: string;
  description: string;
  end?: string;
}

/** A settings page's eight sections, in the order the nav lists them. Nothing counts them. */
export const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  { key: 'coach', name: 'Coach', description: 'How the coach waits before a charge.' },
  { key: 'notifications', name: 'Notifications', description: 'What we tell you, and where.' },
  {
    key: 'bank-sync',
    name: 'Bank sync',
    description: 'Connected accounts and how often they sync.',
    end: '2 connected',
  },
  { key: 'assistant', name: 'AI assistant', description: 'What the assistant may read.' },
  { key: 'logos', name: 'Logos', description: 'Bank logos beside your transactions.', end: 'Off' },
  { key: 'appearance', name: 'Appearance', description: 'The theme and the density.' },
  { key: 'data', name: 'Data', description: 'Export or import your data.' },
  { key: 'danger', name: 'Danger zone', description: 'Delete your account.' },
];

/** The section with `key`, or none. */
export const sectionOf = (key: string | null): SettingsSection | undefined =>
  SETTINGS_SECTIONS.find((section) => section.key === key);

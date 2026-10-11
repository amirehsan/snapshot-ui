import type { Metadata } from 'next';
import type { ReactElement } from 'react';
import { HomePage } from './home-page';
import './home.css';

export const metadata: Metadata = {
  title: { absolute: 'Snapshot UI: calm interfaces for settings, dashboards and apps' },
};

export default function Home(): ReactElement {
  return <HomePage />;
}

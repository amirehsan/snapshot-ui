import { Avatar } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { BROKEN } from './avatar-images';

export default function AvatarFallback(): ReactElement {
  return (
    <div className="row" style={{ justifyContent: 'center' }}>
      <Avatar name="Grace Hopper" size="lg" />
      <Avatar name="Northwind" size="lg" shape="square" />
      <Avatar name="Willowford Bank" initials="WF" size="lg" shape="square" />
      {/* The image fails, so the initials it covered stay. */}
      <Avatar name="Mary Ann Evans" src={BROKEN} size="lg" />
    </div>
  );
}

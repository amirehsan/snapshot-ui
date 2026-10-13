import { Avatar } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { PORTRAIT } from './avatar-images';

export default function AvatarBesideName(): ReactElement {
  return (
    <div className="row" style={{ justifyContent: 'center' }}>
      {/* The name is in the text beside it, so the avatar is decorative and the row is read once. */}
      <Avatar name="Ada Lovelace" src={PORTRAIT} isDecorative />
      <span>Ada Lovelace</span>
    </div>
  );
}

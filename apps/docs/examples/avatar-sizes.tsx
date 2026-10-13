import { Avatar } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { LOGO, PORTRAIT } from './avatar-images';

export default function AvatarSizes(): ReactElement {
  return (
    <div className="stack" style={{ justifyItems: 'center' }}>
      <div className="row">
        <Avatar name="Ada Lovelace" src={PORTRAIT} size="sm" />
        <Avatar name="Ada Lovelace" src={PORTRAIT} />
        <Avatar name="Ada Lovelace" src={PORTRAIT} size="lg" />
      </div>
      <div className="row">
        <Avatar name="Northwind" src={LOGO} shape="square" size="sm" />
        <Avatar name="Northwind" src={LOGO} shape="square" />
        <Avatar name="Northwind" src={LOGO} shape="square" size="lg" />
      </div>
    </div>
  );
}

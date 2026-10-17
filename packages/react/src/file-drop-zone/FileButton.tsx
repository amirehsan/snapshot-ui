'use client';

import type { ReactElement, ReactNode } from 'react';
import { FileTrigger } from 'react-aria-components';
import { Button, type ButtonProps } from '../button/Button';
import { acceptFiles, type FileAcceptance } from './accept';

export type FileButtonProps = FileAcceptance &
  Omit<ButtonProps, 'onPress' | 'children'> & {
    /** The button's text: "Upload", "Choose files". */
    children: ReactNode;
    /**
     * On a phone, opens the camera instead of the file picker: `environment` the back camera, `user` the front.
     * A desktop browser ignores it. A phone's button then takes photos only, so list an image type in
     * `acceptedFileTypes` and keep a button without it for other files, as "Take a photo" beside "Choose a file".
     */
    capture?: 'user' | 'environment';
  };

/**
 * A button that opens the file picker: React Aria's FileTrigger around the library's Button. The files chosen
 * run the same check as a drop on a FileDropZone or a PageDropZone, and reach `onFiles` with the refusals and
 * their reasons. React Aria clears its input as the button is pressed, so the same file chosen again fires again.
 */
export function FileButton({
  acceptedFileTypes,
  maxFileSize,
  allowsMultiple,
  maxFiles,
  onFiles,
  capture,
  children,
  ...props
}: FileButtonProps): ReactElement {
  return (
    <FileTrigger
      acceptedFileTypes={acceptedFileTypes === undefined ? undefined : [...acceptedFileTypes]}
      allowsMultiple={allowsMultiple}
      defaultCamera={capture}
      onSelect={(list) => {
        const { accepted, rejected } = acceptFiles(list === null ? [] : [...list], {
          acceptedFileTypes,
          maxFileSize,
          allowsMultiple,
          maxFiles,
        });
        if (accepted.length > 0 || rejected.length > 0) onFiles(accepted, rejected);
      }}
    >
      <Button {...props}>{children}</Button>
    </FileTrigger>
  );
}

import React from 'react';
import { PencilIcon } from '../svgIcons';

export function EditModeControl({ editMode, switchModeFn }: Object) {
  if (!editMode) {
    return (
      <PencilIcon
        className="red dib fr pointer"
        height="20px"
        width="20px"
        onClick={() => switchModeFn(!editMode)}
      />
    );
  } else {
    return <></>;
  }
}

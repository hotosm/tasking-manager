import React from 'react';

import { CloseIcon } from '../components/svgIcons';

const ServerMessage = ({ children }) => {
  return (
    <div className="red ba b--red pa2 br1 dib pa2">
      <CloseIcon className="h1 w1 v-mid pb1 red mr2" />
      {children}
    </div>
  );
};

export const ErrorMessage = ({ error, children }) => {
  if (error !== null) {
    return (
      <div className="db mt3">
        <ServerMessage>{children}</ServerMessage>
      </div>
    );
  }
  return null;
};

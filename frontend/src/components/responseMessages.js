import React from 'react';

import { CloseIcon } from '../components/svgIcons';

export const ErrorMessage = ({ children }) => {
  return (
    <div className="db mt3">
      <div className="red ba b--red pa2 br1 dib pa2">
        <CloseIcon className="h1 w1 v-mid pb1 red mr2" />
        {children}
      </div>
    </div>
  );
};

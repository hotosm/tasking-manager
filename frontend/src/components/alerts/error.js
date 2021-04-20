import React from 'react';

import { BanIcon } from '../svgIcons';

export const ErrorAlert = ({ children }) => {
  return (
    <div className="db blue-dark bl b--red bw2 br2 bg-red-light pa3">
      <BanIcon className="h1 w1 v-top red mr2" />
      {children}
    </div>
  );
};

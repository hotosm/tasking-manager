import React from 'react';

import { AlertIcon } from '../svgIcons';

export const AlertMessage = ({ error }) => {
  return (
    <>
      {error.error === true && (
        <p className={'w-80 pv2 tc f6 fw6 red ba b--red br1 lh-copy'}>
          <span className="ph1">
            <AlertIcon className="red mr2" height="15px" width="15px" />
            {error.message}
          </span>
        </p>
      )}
    </>
  );
};

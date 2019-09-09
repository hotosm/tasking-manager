import React from 'react';

import { MenuIcon, CloseIcon } from '../svgIcons';

export const BurgerMenu = ({ open, ...props }) => (
  <button
    className="blue-dark bg-white br1 f5 bn pointer"
    style={{ padding: '.75rem 1.5rem' }}
    {...props}
  >
    {open ? (
      <CloseIcon style={{ width: '20px', height: '20px' }} />
    ) : (
      <MenuIcon style={{ width: '20px', height: '20px' }} />
    )}
  </button>
);

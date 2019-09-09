import React from 'react';
import { Link } from '@reach/router';

export default ({ partial = true, ...props }) => (
  <Link
    {...props}
    getProps={({ isCurrent, isPartiallyCurrent }) => {
      const isActive = partial ? isPartiallyCurrent : isCurrent;
      const activeStyle = isActive
        ? {
            color: '#FFFFFF',
          }
        : {};
      return {
        className: `${isActive && 'bg-blue-dark white'} ${props.className} `,
        style: activeStyle,
      };
    }}
  />
);

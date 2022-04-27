import React from 'react';

import { useHover } from '../hooks/UseHover';

export const ProgressBar = ({ className, height, firstBarValue, secondBarValue = 0, children }) => {
  const [hoverRef, isHovered, position] = useHover();

  /* tooltip component credit: https://codepen.io/syndicatefx/pen/QVPbJg */
  return (
    <div className={`cf db ${className || ''}`}>
      <div className="relative" ref={hoverRef}>
        <div
          className={`absolute bg-blue-grey br-pill h${height} hide-child`}
          style={{ width: `${firstBarValue > 100 ? 100 : firstBarValue}%` }}
          role="progressbar"
          aria-valuenow={firstBarValue}
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
        <div
          className={`absolute bg-red br-pill h${height} hide-child`}
          style={{ width: `${secondBarValue > 100 ? 100 : secondBarValue}%` }}
          role="progressbar"
          aria-valuenow={secondBarValue}
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
        <div className={`bg-grey-light br-pill h${height} overflow-y-hidden`}></div>
        {isHovered && (
          <span
            className={`db absolute z-1 dib bg-blue-dark ba br2 b--blue-dark pa2 shadow-5 top-${
              height === 'half' ? '1' : height
            }`}
            style={{ left: position.x }}
          >
            {children}
            <span className="absolute top-0 left-2 nt2 w1 h1 bg-blue-dark bl bt b--blue-dark rotate-45"></span>
          </span>
        )}
      </div>
    </div>
  );
};

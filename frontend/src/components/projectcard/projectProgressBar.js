import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { useHover } from '../../hooks/UseHover';

export default function ProjectProgressBar({
  percentMapped,
  percentValidated,
  percentBadImagery,
  className,
}: Object) {
  const [hoverRef, isHovered, position] = useHover();

  /* tooltip component credit: https://codepen.io/syndicatefx/pen/QVPbJg */
  return (
    <>
      <div className={`cf db ${className || ''}`}>
        <div className="relative" ref={hoverRef}>
          <div
            className="absolute bg-blue-grey br-pill hhalf hide-child"
            style={{ width: `${percentMapped > 100 ? 100 : percentMapped}%` }}
          ></div>
          <div
            className="absolute bg-red br-pill hhalf hide-child"
            style={{ width: `${percentValidated > 100 ? 100 : percentValidated}%` }}
          ></div>
          <div className={`bg-grey-light br-pill hhalf overflow-y-hidden`}></div>
          {isHovered && (
            <span
              className="db absolute top-1 z-1 dib bg-blue-dark ba br2 b--blue-dark pa2 shadow-5"
              style={{ left: position.x - 70 }}
            >
              <p className="f6 lh-copy ma0 white f7 fw4">
                <span className="fw8">{percentMapped}%</span>&nbsp;
                <FormattedMessage {...messages['percentMapped']} />
              </p>
              <p className="f6 lh-copy ma0 white f7 fw4">
                <span className="fw8">{percentValidated}%</span>&nbsp;
                <FormattedMessage {...messages['percentValidated']} />
              </p>
              {![null, undefined].includes(percentBadImagery) && (
                <p className="f6 lh-copy ma0 white f7 fw4">
                  <span className="fw8">{percentBadImagery}%</span>&nbsp;
                  <FormattedMessage {...messages['percentBadImagery']} />
                </p>
              )}
              <span className="absolute top-0 left-2 nt2 w1 h1 bg-blue-dark bl bt b--blue-dark rotate-45"></span>
            </span>
          )}
        </div>
      </div>
    </>
  );
}

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
            role="progressbar"
            aria-valuenow={percentMapped}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
          <div
            className="absolute bg-red br-pill hhalf hide-child"
            style={{ width: `${percentValidated > 100 ? 100 : percentValidated}%` }}
            role="progressbar"
            aria-valuenow={percentValidated}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
          <div className={`bg-grey-light br-pill hhalf overflow-y-hidden`}></div>
          {isHovered && (
            <span
              className="db absolute top-1 z-1 dib bg-blue-dark ba br2 b--blue-dark pa2 shadow-5"
              style={{ left: position.x - 70 }}
            >
              <p className="f6 lh-copy ma0 white f7 fw4">
                <FormattedMessage
                  {...messages['percentMapped']}
                  values={{ n: <span className="fw8">{percentMapped}</span> }}
                />
              </p>
              <p className="f6 lh-copy ma0 white f7 fw4">
                <FormattedMessage
                  {...messages['percentValidated']}
                  values={{ n: <span className="fw8">{percentValidated}</span> }}
                />
              </p>
              {![null, undefined].includes(percentBadImagery) && (
                <p className="f6 lh-copy ma0 white f7 fw4">
                  <FormattedMessage
                    {...messages['percentBadImagery']}
                    values={{ n: <span className="fw8">{percentBadImagery}</span> }}
                  />
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

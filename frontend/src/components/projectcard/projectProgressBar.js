import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

export default function ProjectProgressBar({ percentMapped, percentValidated, className }: Object) {
  /* tooltip component credit: https://codepen.io/syndicatefx/pen/QVPbJg */
  return (
    <>
      <div className={`cf db ${className}`}>
        <div className="relative">
          <div
            className="absolute bg-blue-grey br-pill hhalf hide-child"
            style={{ width: `${percentMapped}%` }}
          ></div>
          <div
            className="absolute bg-red br-pill hhalf hide-child"
            style={{ width: `${percentValidated}%` }}
          >
            <span className="db absolute top-1 z-1 w3 w4-m w4-l bg-black ba br2 b--blue-dark pa2 shadow-5 child">
              <p className="f6 lh-copy near-black ma0 white f7 fw4">
                <span className="fw8">{percentValidated}%</span>&nbsp;
                <FormattedMessage {...messages['percentValidated']} />
              </p>
              <span className="absolute top-0 left-2 nt2 w1 h1 bg-black bl bt b--blue-dark rotate-45"></span>
            </span>
          </div>
          <div className={`bg-grey-light br-pill hhalf hide-child overflow-y-hidden`}>
            <span className="db absolute top-1 z-1 w3 w4-m w4-l bg-black ba br2 b--moon-gray pa2 shadow-5 child">
              <p className="f6 lh-copy near-black ma0 white f7 fw4">
                <span className="fw8">{percentMapped}%</span>&nbsp;
                <FormattedMessage {...messages['percentMapped']} />
              </p>
              <span className="absolute top-0 center-2 nt2 w1 h1 bg-black bl bt b--moon-gray rotate-45"></span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

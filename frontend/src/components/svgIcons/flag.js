import React from 'react';

export class FlagIcon extends React.PureComponent {
  render() {
    return (
      <svg width="12" height="18" viewBox="0 0 12 18" {...this.props}>
        <g fill="none" fillRule="evenodd">
          <path d="M-14-11h40v40h-40z" />
          <path
            d="M.007 0v17.955l5.56-3.943 5.56 3.943V0z"
            fill="currentColor"
            fillRule="nonzero"
          />
        </g>
      </svg>
    );
  }
}

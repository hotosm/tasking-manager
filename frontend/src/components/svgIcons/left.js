import React from 'react';

export class LeftIcon extends React.PureComponent {
  render() {
    return (
      <svg width="26" height="16" viewBox="0 0 26 16" {...this.props}>
        <g fill="none" fillRule="evenodd">
          <path d="M33-12H-7v40h40z" />
          <path
            fill="currentColor"
            fillRule="nonzero"
            d="M8 0l1.41 1.41L3.83 7H26v2H3.83l5.58 5.59L8 16 0 8z"
          />
        </g>
      </svg>
    );
  }
}

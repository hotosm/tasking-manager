import React from 'react';

export class RightIcon extends React.PureComponent {
  render() {
    return (
      <svg width="26" height="16" viewBox="0 0 26 16" {...this.props}>
        <g fill="none" fillRule="evenodd">
          <path d="M-7-12h40v40H-7z" />
          <path
            fill="currentColor"
            fillRule="nonzero"
            d="M18 0l-1.41 1.41L22.17 7H0v2h22.17l-5.58 5.59L18 16l8-8z"
          />
        </g>
      </svg>
    );
  }
}

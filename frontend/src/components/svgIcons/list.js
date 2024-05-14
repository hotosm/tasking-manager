import React from 'react';

export class ListIcon extends React.PureComponent {
  render() {
    return (
      <svg width="16" height="11" viewBox="0 0 16 11" {...this.props}>
        <g fill="none" fillRule="evenodd">
          <path d="M-12-15h40v40h-40z" />
          <g fill="currentColor" fillRule="nonzero">
            <path d="M4.107 0h11.804v2.401H4.107zM4.107 3.867h11.804v2.401H4.107zM4.107 8h11.804v2.4H4.107z" />
            <circle cx="1.233" cy="1.234" r="1.233" />
            <path d="M1.233 3.833a1.234 1.234 0 1 0 1.234 1.233c0-.681-.553-1.233-1.234-1.233zM1.233 7.967a1.233 1.233 0 1 0 0 2.466 1.233 1.233 0 0 0 0-2.466z" />
          </g>
        </g>
      </svg>
    );
  }
}

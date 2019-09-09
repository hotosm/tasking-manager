import React from 'react';

export class BellIcon extends React.PureComponent {
  render() {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" {...this.props}>
        <g fill="none" fillRule="evenodd">
          <path d="M-11-11h40v40h-40z" />
          <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.872">
            <path d="M16.4 13.069H1a2.31 2.31 0 0 0 2.31-2.31v-3.85a5.39 5.39 0 0 1 10.78 0v3.85a2.31 2.31 0 0 0 2.31 2.31zM10.032 16.148a1.54 1.54 0 0 1-2.664 0h2.664z" />
          </g>
        </g>
      </svg>
    );
  }
}

import React from 'react';

export class MenuIcon extends React.PureComponent {
  render() {
    return (
      <svg width="8" height="8" viewBox="0 0 8 8" {...this.props}>
        <path
          fill="currentColor"
          d="M0 0v1h8v-1h-8zm0 2.97v1h8v-1h-8zm0 3v1h8v-1h-8z"
          transform="translate(0 1)"
        />
      </svg>
    );
  }
}

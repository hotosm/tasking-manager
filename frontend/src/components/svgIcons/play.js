import React from 'react';

export class PlayIcon extends React.PureComponent {
  render() {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" {...this.props}>
        <g fill="none" fillRule="evenodd">
          <path d="M-14-14h40v40h-40z" />
          <path
            fill="currentColor"
            d="M.335.083a.621.621 0 0 1 .62 0l6.447 5.38a.622.622 0 0 1 0 1.075L.956 11.917a.622.622 0 0 1-.932-.538V.62C.024.4.142.194.334.083zM8.47.255v11.49c0 .137.112.249.249.249h2.05a.249.249 0 0 0 .248-.249V.255a.249.249 0 0 0-.249-.249h-2.05a.249.249 0 0 0-.248.249z"
            fillRule="nonzero"
          />
        </g>
      </svg>
    );
  }
}

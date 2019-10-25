import React from 'react';

export class ProfilePictureIcon extends React.PureComponent {
  render() {
    return (
      <svg width="110" height="110" viewBox="0 0 110 110" {...this.props}>
        <rect
          x="0"
          y="0"
          width="110"
          height="110"
          rx="55"
          opacity="1"
          fill="#586070"
          fillOpacity="0.1254902"
          fillRule="evenodd"
          stroke="none"
          strokeWidth="1"
        />
        <ellipse
          transform="rotate(-67.50001)"
          cx="-13.851587"
          cy="65.077881"
          rx="15.736153"
          ry="15.615014"
          fill="currentColor"
          fillRule="evenodd"
          stroke="none"
          strokeWidth="1"
        />
        <path
          id="path1103"
          d="m 20.624999,88.800928 c 0,9.9321 68.749988,9.9321 68.749988,0 0,-16.769323 -15.390172,-30.363429 -34.374992,-30.363429 -18.98481,0 -34.374996,13.594106 -34.374996,30.363429 z"
          fill="currentColor"
          fillRule="evenodd"
          stroke="none"
          strokeWidth="1"
        />
      </svg>
    );
  }
}

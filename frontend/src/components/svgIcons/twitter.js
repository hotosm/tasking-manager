import React from 'react';

export class TwitterIcon extends React.PureComponent {
  render() {
    return (
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...this.props}
        aria-label="Twitter"
      >
        {!this.props.noBg && <rect width="15" height="15" rx="1" fill="black" />}
        <path
          d="M8.54822 6.66248L12.644 2H11.6735L8.1156 6.04753L5.27595 2H2L6.29505 8.12111L2 13.01H2.97043L6.72541 8.7347L9.72488 13.01H13.0008L8.54822 6.66248ZM7.21864 8.17485L6.7828 7.56494L3.32038 2.71647H4.81116L7.60626 6.63082L8.04027 7.24073L11.6731 12.3285H10.1823L7.21864 8.17485Z"
          fill="white"
        />
      </svg>
    );
  }
}

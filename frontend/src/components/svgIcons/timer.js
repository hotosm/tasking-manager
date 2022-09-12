import React from 'react';

export class TimerIcon extends React.PureComponent {
  render() {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="10"
        height="12"
        fill="none"
        viewBox="0 0 10 12"
        role="img"
        {...this.props}
      >
        <title>Timer</title>
        <path
          fill="#68707F"
          fillRule="evenodd"
          d="M5.77 1.013v.932C8.164 2.32 10 4.419 10 6.942 10 9.732 7.757 12 5 12S0 9.731 0 6.942c0-2.524 1.837-4.621 4.23-4.997v-.932h-.421a.504.504 0 01-.501-.507c0-.28.224-.506.5-.506h2.383c.277 0 .501.227.501.506 0 .28-.224.507-.5.507H5.77zm3.306 5.909a.344.344 0 00.09-.264c-.182-1.99-1.783-3.58-3.787-3.76A.344.344 0 005 3.24V6.69c0 .19.155.344.347.344H8.82c.098 0 .191-.04.257-.112z"
          clipRule="evenodd"
        ></path>
      </svg>
    );
  }
}

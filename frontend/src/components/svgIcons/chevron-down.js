import React from 'react';

export class ChevronDownIcon extends React.PureComponent {
  render() {
    return (
      <svg width="15px" height="15px" viewBox="0 0 15 15" {...this.props}>
        <path
          fill="currentColor"
          d="M 13.636364,3.0544845 7.5,9.1908485 1.363636,3.0544845 0,4.4455155 7.5,11.945515 15,4.4455155 Z"
        />
      </svg>
    );
  }
}

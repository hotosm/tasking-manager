import React from 'react';

export class ChevronUpIcon extends React.PureComponent {
  render() {
    return (
      <svg width="15" height="15" viewBox="0 0 15 15" {...this.props}>
        <path
          fill="currentColor"
          d="M 1.363636,11.945515 7.5,5.8091511 13.636364,11.945515 15,10.554484 7.5,3.054485 -5.625e-8,10.554484 Z"
        />
      </svg>
    );
  }
}

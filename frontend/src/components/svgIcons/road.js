import React from 'react';

export class RoadIcon extends React.PureComponent {
  render() {
    return (
      <svg width="19" height="26" viewBox="0 0 19 26" {...this.props}>
        <g fill="none" fillRule="evenodd">
          <path d="M-10-7h40v40h-40z" />
          <path
            d="M0 .5v24.671h18.44V.5H0zm8.497 19.595v3.63H4.462V1.945h4.035v4.113h1.446V1.946h4.035v21.78H9.943v-3.631H8.497zM1.446 1.945h1.57v21.78h-1.57V1.945zm15.549 21.78h-1.571V1.945h1.57v21.78z"
            fill="currentColor"
            fillRule="nonzero"
          />
          <path
            fill="currentColor"
            fillRule="nonzero"
            d="M8.497 7.835h1.446v4.353H8.497zM8.497 13.965h1.446v4.353H8.497z"
          />
        </g>
      </svg>
    );
  }
}

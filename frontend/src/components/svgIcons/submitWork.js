import React from 'react';

export class SubmitWorkIcon extends React.PureComponent {
  render() {
    return (
      <svg width="130" height="100" viewBox="0 0 130 100" {...this.props}>
        <g fillRule="nonzero" fill="none">
          <path fill="#929DB3" opacity=".25" d="M36 16l2.268 48H130V16z" />
          <path fillOpacity=".25" fill="#929DB3" d="M0 0h114v48H0z" />
          <path
            fill="currentColor"
            style={{
              mixBlendMode: 'multiply',
            }}
            d="M45.637 36L0 63.236l11.478 6.636-9.385 16.804L25.138 100l9.384-16.804L46 89.832z"
          />
        </g>
      </svg>
    );
  }
}

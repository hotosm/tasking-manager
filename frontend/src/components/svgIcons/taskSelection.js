import React from 'react';

export class TaskSelectionIcon extends React.PureComponent {
  render() {
    return (
      <svg width="120" height="100" viewBox="0 0 120 100" {...this.props}>
        <g fillRule="nonzero" fill="none">
          <path fill="#929DB3" opacity=".25" d="M0 0v100h120V0z" />
          <path
            fill="#929DB3"
            opacity=".25"
            d="M31 94H6V68h25zM31 62H6V37h25zM62 94H37V68h25zM62 62H37V37h25zM62 31H37V6h25zM94 62H68V37h26z"
          />
          <path
            d="M34 46c-10.476 0-19 8.524-19 19 0 10.477 8.523 19 19 19s19-8.523 19-19c0-10.476-8.523-19-19-19zM66 24c-5.514 0-10 4.486-10 10s4.486 10 10 10 10-4.486 10-10-4.486-10-10-10z"
            fill="currentColor"
            style={{
              mixBlendMode: 'multiply',
            }}
          />
        </g>
      </svg>
    );
  }
}

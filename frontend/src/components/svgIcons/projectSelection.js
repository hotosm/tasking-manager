import React from 'react';

export class ProjectSelectionIcon extends React.PureComponent {
  render() {
    return (
      <svg width="120" height="100" viewBox="0 0 120 100" {...this.props}>
        <g fillRule="nonzero" fill="none">
          <path fill="#929DB3" opacity=".25" d="M0 0v100h120V0z" />
          <path fill="#929DB3" opacity=".25" d="M13 8h28v40H13zM13 53h28v40H13zM46 8h28v40H46z" />
          <path
            fill="currentColor"
            style={{
              mixBlendMode: 'multiply',
            }}
            d="M13 8h61v40H13z"
          />
          <path fill="#929DB3" opacity=".25" d="M46 53h28v40H46zM79 8h28v40H79zM79 53h28v40H79z" />
        </g>
      </svg>
    );
  }
}

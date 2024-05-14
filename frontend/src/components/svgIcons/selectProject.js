import React from 'react';

export class SelectProject extends React.PureComponent {
  render() {
    return (
      <svg width="120px" height="100px" viewBox="0 0 120 100" {...this.props}>
        <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
          <g transform="translate(-358.000000, -439.000000)" fillRule="nonzero">
            <g transform="translate(358.000000, 439.000000)">
              <polygon fill="#929DB3" opacity="0.25" points="0 0 0 100 120 100 120 0" />
              <rect fill="#929DB3" opacity="0.25" x="13" y="8" width="28" height="40" />
              <rect fill="#929DB3" opacity="0.25" x="13" y="53" width="28" height="40" />
              <rect fill="#929DB3" opacity="0.25" x="46" y="8" width="28" height="40" />
              <rect
                fill="currentColor"
                style={{ mixBlendMode: 'multiply' }}
                x="13"
                y="8"
                width="61"
                height="40"
              />
              <rect fill="#929DB3" opacity="0.25" x="46" y="53" width="28" height="40" />
              <rect fill="#929DB3" opacity="0.25" x="79" y="8" width="28" height="40" />
              <rect fill="#929DB3" opacity="0.25" x="79" y="53" width="28" height="40" />
            </g>
          </g>
        </g>
      </svg>
    );
  }
}

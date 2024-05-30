import React from 'react';

export class SearchIcon extends React.PureComponent {
  render() {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" {...this.props}>
        <g fill="none" fillRule="evenodd">
          <path d="M-12-12h40v40h-40z" />
          <path
            d="M15.48 14.565l-3.806-3.958a6.435 6.435 0 0 0 1.514-4.15A6.464 6.464 0 0 0 6.732 0 6.464 6.464 0 0 0 .276 6.456a6.464 6.464 0 0 0 6.456 6.456c1.337 0 2.61-.403 3.7-1.168l3.834 3.988c.16.167.376.258.607.258a.843.843 0 0 0 .607-1.426zM6.732 1.685a4.777 4.777 0 0 1 4.772 4.771 4.777 4.777 0 0 1-4.772 4.772A4.777 4.777 0 0 1 1.96 6.456a4.777 4.777 0 0 1 4.772-4.772z"
            fill="currentColor"
            fillRule="nonzero"
          />
        </g>
      </svg>
    );
  }
}

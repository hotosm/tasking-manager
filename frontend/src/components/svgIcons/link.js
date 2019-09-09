import React from 'react';

export class LinkIcon extends React.PureComponent {
  render() {
    return (
      <svg width="11" height="11" viewBox="0 0 11 11" {...this.props}>
        <path
          fill="currentColor"
          d="M9.778 9.778H1.222V1.222H5.5V0H1.222C.544 0 0 .55 0 1.222v8.556C0 10.45.544 11 1.222 11h8.556C10.45 11 11 10.45 11 9.778V5.5H9.778v4.278zM6.722 0v1.222h2.194L2.91 7.23l.862.862 6.007-6.007v2.194H11V0H6.722z"
        />
      </svg>
    );
  }
}

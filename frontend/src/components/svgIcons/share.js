import React from 'react';

export class ShareIcon extends React.PureComponent {
  render() {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" {...this.props}>
        <g fill="none" fillRule="evenodd">
          <path d="M-11-11h40v40h-40z" />
          <path
            d="M14.564 11.439a3.258 3.258 0 0 0-2.562 1.256l-5.57-2.848c.074-.272.126-.553.126-.849 0-.322-.062-.625-.15-.92l5.546-2.835a3.258 3.258 0 0 0 2.61 1.314 3.278 3.278 0 1 0 0-6.557 3.279 3.279 0 0 0-3.278 3.278c0 .297.053.579.126.851L5.844 6.977a3.265 3.265 0 0 0-2.566-1.259A3.278 3.278 0 0 0 0 8.998a3.278 3.278 0 0 0 3.278 3.28 3.266 3.266 0 0 0 2.614-1.317l5.542 2.835c-.086.294-.15.6-.15.922a3.28 3.28 0 1 0 3.28-3.28z"
            fill="currentColor"
            fillRule="nonzero"
          />
        </g>
      </svg>
    );
  }
}

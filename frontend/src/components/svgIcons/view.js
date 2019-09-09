import React from 'react';

export class ViewIcon extends React.PureComponent {
  render() {
    return (
      <svg width="16" height="11" viewBox="0 0 16 11" {...this.props}>
        <g fill="none" fillRule="evenodd">
          <path d="M-12-15h40v40h-40z" />
          <path
            d="M8 0a8.569 8.569 0 0 0-8 5.455 8.569 8.569 0 0 0 8 5.454 8.569 8.569 0 0 0 8-5.454A8.569 8.569 0 0 0 8 0zm0 9.09a3.601 3.601 0 0 1-3.636-3.635c0-2.037 1.6-3.637 3.636-3.637s3.636 1.6 3.636 3.637c0 2.036-1.6 3.636-3.636 3.636zm0-5.817c-1.236 0-2.182.945-2.182 2.182 0 1.236.946 2.181 2.182 2.181s2.182-.945 2.182-2.181c0-1.237-.946-2.182-2.182-2.182z"
            fill="currentColor"
            fillRule="nonzero"
          />
        </g>
      </svg>
    );
  }
}

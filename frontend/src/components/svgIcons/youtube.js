import React from 'react';

export class YoutubeIcon extends React.PureComponent {
  render() {
    return (
      <svg width="20" height="14" viewBox="0 0 20 14" {...this.props}>
        <g fill="none" fillRule="evenodd">
          <path d="M-10-13h40v40h-40z" />
          <path
            d="M7.984 9.875l5.152-2.93-5.152-2.932v5.862zm11.46-7.706c.412 1.547.412 4.775.412 4.775s0 3.228-.412 4.775a2.477 2.477 0 0 1-1.743 1.754c-1.537.415-7.701.415-7.701.415s-6.164 0-7.701-.415A2.477 2.477 0 0 1 .556 11.72C.144 10.172.144 6.944.144 6.944s0-3.228.412-4.775A2.477 2.477 0 0 1 2.299.415C3.836 0 10 0 10 0s6.164 0 7.701.415c.849.228 1.516.9 1.743 1.754z"
            fill="currentColor"
            fillRule="nonzero"
          />
        </g>
      </svg>
    );
  }
}

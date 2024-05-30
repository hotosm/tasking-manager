import React from 'react';

export class MappingIcon extends React.PureComponent {
  render() {
    return (
      <svg width="125" height="97" viewBox="0 0 125 97" {...this.props}>
        <g fill="none" fillRule="evenodd">
          <path
            d="M27.233 88.127L0 97V21.108l26.745-8.714.058-.3.43.141.433-.14v.282l26.475 8.677 26.807-8.96v.837l.162-.837 27.504 9.014V97L81.11 87.986l-.162-.837v.837l-26.64 8.904V97l-.167-.054-.162.054-.015-.112-26.73-8.76z"
            fill="#929DB3"
            fillOpacity=".25"
            fillRule="nonzero"
          />
          <path
            d="M125 19.419c0 15.549-17.175 29.95-17.175 29.95-1.004.841-2.646.841-3.65 0 0 0-17.175-14.401-17.175-29.95C87 8.694 95.507 0 106 0s19 8.694 19 19.419zM105.5 29c5.238 0 9.5-4.486 9.5-10s-4.262-10-9.5-10S96 13.486 96 19s4.262 10 9.5 10zM42.453 96.057H17.925V79.108l12.264-11.353 12.264 11.353z"
            style={{
              mixBlendMode: 'multiply',
            }}
            fill="currentColor"
            fillRule="nonzero"
          />
          <path
            fill="#B8C0CF"
            fillRule="nonzero"
            d="M28.488 43.237l-10.47-21.709-10.47 21.709h7.521v4.706h5.894v-4.706zM66.038 65.168l-8.02-16.281L50 65.168h5.76v3.53h4.515v-3.53z"
          />
        </g>
      </svg>
    );
  }
}

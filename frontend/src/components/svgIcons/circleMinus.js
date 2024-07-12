import { PureComponent } from 'react';

export class CircleMinusIcon extends PureComponent {
  render() {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        width="16"
        height="16"
        {...this.props}
      >
        <path
          d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM184 232H328c13.3 0 24 10.7 24 24s-10.7 24-24 24H184c-13.3 0-24-10.7-24-24s10.7-24 24-24z"
          fill="currentColor"
          fillRule="nonzero"
        />
      </svg>
    );
  }
}

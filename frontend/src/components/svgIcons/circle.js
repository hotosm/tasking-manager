import { PureComponent } from 'react';

// Icon produced by FontAwesome project: https://github.com/FortAwesome/Font-Awesome/
// License: CC-By 4.0
export class CircleIcon extends PureComponent {
  render() {
    return (
      <svg viewBox="0 0 512 512" {...this.props}>
        <path
          fill="currentColor"
          d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8z"
        ></path>
      </svg>
    );
  }
}

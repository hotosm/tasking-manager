import { PureComponent } from 'react';

// Icon produced by FontAwesome project: https://github.com/FortAwesome/Font-Awesome/
// License: CC-By 4.0
export class PlusIcon extends PureComponent {
  render() {
    return (
      <svg viewBox="0 0 448 512" {...this.props}>
        <path
          fill="currentColor"
          d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"
        ></path>
      </svg>
    );
  }
}

import { PureComponent } from 'react';

export class LockIcon extends PureComponent {
  render() {
    return (
      <svg width="8" height="8" viewBox="0 0 8 8" {...this.props}>
        <path
          fill="currentColor"
          d="M3 0c-1.1 0-2 .9-2 2v1h-1v4h6v-4h-1v-1c0-1.1-.9-2-2-2zm0 1c.56 0 1 .44 1 1v1h-2v-1c0-.56.44-1 1-1z"
          transform="translate(1)"
        />
      </svg>
    );
  }
}

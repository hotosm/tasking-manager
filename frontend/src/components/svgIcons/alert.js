import { PureComponent } from 'react';

export class AlertIcon extends PureComponent {
  render() {
    return (
      <svg width="8" height="8" viewBox="0 0 8 8" {...this.props}>
        <path
          fill="currentColor"
          d="M3.09 0c-.06 0-.1.04-.13.09l-2.94 6.81c-.02.05-.03.13-.03.19v.81c0 .05.04.09.09.09h6.81c.05 0 .09-.04.09-.09v-.81c0-.05-.01-.14-.03-.19l-2.94-6.81c-.02-.05-.07-.09-.13-.09h-.81zm-.09 3h1v2h-1v-2zm0 3h1v1h-1v-1z"
        />
      </svg>
    );
  }
}

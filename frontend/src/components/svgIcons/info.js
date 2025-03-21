import { PureComponent } from 'react';

export class InfoIcon extends PureComponent {
  render() {
    return (
      <svg viewBox="0 0 32 32" {...this.props}>
        <path
          fill="currentColor"
          d="M16 0 A16 16 0 0 1 16 32 A16 16 0 0 1 16 0 M19 15 L13 15 L13 26 L19 26 z M16 6 A3 3 0 0 0 16 12 A3 3 0 0 0 16 6"
        />
      </svg>
    );
  }
}

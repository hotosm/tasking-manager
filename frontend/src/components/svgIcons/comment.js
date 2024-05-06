import { PureComponent } from 'react';

// Icon produced by FontAwesome project: https://github.com/FortAwesome/Font-Awesome/
// License: CC-By 4.0
export class CommentIcon extends PureComponent {
  render() {
    return (
      <svg {...this.props} aria-hidden="true" role="img" viewBox="0 0 512 512">
        <path
          fill="currentColor"
          d="M448 0H64C28.7 0 0 28.7 0 64v288c0 35.3 28.7 64 64 64h96v84c0 9.8 11.2 15.5 19.1 9.7L304 416h144c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64z"
        ></path>
      </svg>
    );
  }
}

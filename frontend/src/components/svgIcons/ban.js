import { PureComponent } from 'react';

// Icon produced by FontAwesome project: https://github.com/FortAwesome/Font-Awesome/
// License: CC-By 4.0
export class BanIcon extends PureComponent {
  render() {
    return (
      <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 512 512" {...this.props}>
        <path
          fill="currentColor"
          d="M256 8C119.034 8 8 119.033 8 256s111.034 248 248 248 248-111.034 248-248S392.967 8 256 8zm130.108 117.892c65.448 65.448 70 165.481 20.677 235.637L150.47 105.216c70.204-49.356 170.226-44.735 235.638 20.676zM125.892 386.108c-65.448-65.448-70-165.481-20.677-235.637L361.53 406.784c-70.203 49.356-170.226 44.736-235.638-20.676z"
        ></path>
      </svg>
    );
  }
}

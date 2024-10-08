import { PureComponent } from 'react';

export class PlayIcon extends PureComponent {
  render() {
    return (
      <svg viewBox="0 0 15 15" {...this.props}>
        <path
          fill="currentColor"
          d="m 13.249605,7.2743054 c 0.0091,-0.2814 -0.1419,-0.5456 -0.3948,-0.6907 l -9.8691996,-5.5 c -0.5434,-0.31180004 -1.2355,0.0614 -1.2356,0.6664 V 12.750005 c 10e-5,0.605 0.6922,0.9782 1.2355,0.6664 L 12.854705,7.9164054 c 0.2374,-0.1362 0.3861,-0.378 0.3949,-0.6421 z m -2.3989,-0.0243 -7.4703996,4.1266996 V 3.1233054 Z"
        />
      </svg>
    );
  }
}

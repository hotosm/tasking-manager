import { PureComponent } from 'react';

export class SelectTask extends PureComponent {
  render() {
    return (
      <svg width="120px" height="100px" viewBox="0 0 120 100" {...this.props}>
        <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
          <g transform="translate(-555.000000, -439.000000)" fillRule="nonzero">
            <g transform="translate(555.000000, 439.000000)">
              <polygon fill="#929DB3" opacity="0.25" points="0 0 0 100 120 100 120 0" />
              <polygon fill="#929DB3" opacity="0.25" points="31 94 6 94 6 68 31 68" />
              <polygon fill="#929DB3" opacity="0.25" points="31 62 6 62 6 37 31 37" />
              <polygon fill="#929DB3" opacity="0.25" points="62 94 37 94 37 68 62 68" />
              <polygon fill="#929DB3" opacity="0.25" points="62 62 37 62 37 37 62 37" />
              <polygon fill="#929DB3" opacity="0.25" points="62 31 37 31 37 6 62 6" />
              <polygon fill="#929DB3" opacity="0.25" points="94 62 68 62 68 37 94 37" />
              <path
                d="M34.0003857,46 C23.5238761,46 15,54.5238763 15,65.0003857 C15,75.476895 23.523105,84 34.0003857,84 C44.476895,84 53,75.476895 53,65.0003857 C53,54.5238763 44.476895,46 34.0003857,46 Z"
                fill="currentColor"
                style={{ mixBlendMode: 'multiply' }}
              />
              <path
                d="M66,24 C60.4863146,24 56,28.4863146 56,34 C56,39.5136854 60.4863146,44 66,44 C71.5136854,44 76,39.5136854 76,34 C76,28.4863146 71.5136854,24 66,24 Z"
                fill="currentColor"
                style={{ mixBlendMode: 'multiply' }}
              />
            </g>
          </g>
        </g>
      </svg>
    );
  }
}

import React from 'react';

export class FacebookIcon extends React.PureComponent {
  render() {
    return (
      <svg width="15" height="14" viewBox="0 0 15 14" {...this.props}>
        <g fill="none" fillRule="evenodd">
          <path d="M-13-13h40v40h-40z" />
          <path
            d="M.917 0a.773.773 0 0 0-.773.773v12.454c0 .427.346.773.773.773h6.705V8.578H5.797V6.466h1.825V4.907c0-1.808 1.104-2.792 2.717-2.792.773 0 1.437.057 1.63.083v1.89h-1.118c-.877 0-1.047.417-1.047 1.029v1.349h2.092l-.272 2.112h-1.82V14h3.567a.773.773 0 0 0 .773-.773V.773A.773.773 0 0 0 13.37 0H.917z"
            fill="currentColor"
            fillRule="nonzero"
          />
        </g>
      </svg>
    );
  }
}

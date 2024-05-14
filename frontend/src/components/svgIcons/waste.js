import React from 'react';

export class WasteIcon extends React.PureComponent {
  render() {
    return (
      <svg width="14" height="16" viewBox="0 0 14 16" {...this.props}>
        <g fill="none" fillRule="evenodd">
          <path d="M-13-12h40v40h-40z" />
          <path
            d="M12.699 2.16H9.588V.57A.572.572 0 0 0 9.016 0H4.445a.572.572 0 0 0-.571.571V2.16H.762a.762.762 0 0 0 0 1.524h.763v11.112c0 .526.426.952.952.952h8.507a.952.952 0 0 0 .953-.952V3.683h.762a.762.762 0 0 0 0-1.524zM4.254 13.588a.572.572 0 0 1-1.142 0v-8a.572.572 0 0 1 1.142 0v8zm3.048 0a.572.572 0 0 1-1.143 0v-8a.572.572 0 0 1 1.143 0v8zm1.143-11.43H5.016V1.143h3.429v1.016zm1.905 11.43a.572.572 0 0 1-1.143 0v-8a.572.572 0 0 1 1.143 0v8z"
            fill="currentColor"
            fillRule="nonzero"
          />
        </g>
      </svg>
    );
  }
}

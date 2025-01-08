import { TextBlock, TextRow, RectShape } from 'react-placeholder/lib/placeholders';

import { LoadingIcon } from '../svgIcons';

const awesomePlaceholder = (
  <div className="my-awesome-placeholder mt4">
    <div className="w-100 w-60-l fl ph4-l ph2 pv3 bg-white blue-dark vh-minus-200-ns relative bw0 bw1-ns br b--near-white">
      <div className="flex flex-column justify-between h-100">
        <div>
          <RectShape
            className="show-loading-animation mb3"
            color="#CCC"
            style={{ width: 150, height: 24 }}
          />
          <TextRow className="show-loading-animation" color="#CCC" style={{ height: 32 }} />
          <TextRow className="show-loading-animation mb4" color="#CCC" style={{ height: 32 }} />
          <TextBlock className="show-loading-animation mb3" rows={5} color="#CCC" />
        </div>
        <div className="dn db-l">
          <TextBlock className="show-loading-animation mb3" rows={3} color="#CCC" />
        </div>
      </div>
    </div>
    <div className="dn dn-m w-100 w-40-l vh-minus-200-ns fl flex-ns flex-column items-center justify-center">
      <LoadingIcon className="red h3 w3" style={{ animation: 'spin 1s linear infinite' }} />
      <span className="db mt3">Loading map...</span>
    </div>
  </div>
);

export const ProjectDetailPlaceholder = () => {
  return <div>{awesomePlaceholder}</div>;
};

import React from 'react';

import { TextBlock, MediaBlock, RectShape } from 'react-placeholder/lib/placeholders';

export const projectCardPlaceholderTemplate = (cardWidthClass = 'w-25-l') => (n, i) => (
  <div className={`fl ${cardWidthClass} base-font w-50-m w-100 mb3 ph2 blue-dark mw5`} key={i}>
    <div className="pv3 ph3 ba br1 b--grey-light shadow-hover">
      <div className="w-50 red dib">
        {' '}
        <MediaBlock
          rows={1}
          className="show-loading-animation"
          color="#DDD"
          style={{ width: 60, height: 30 }}
        />{' '}
      </div>
      <div className={`fr w-33 tc pr4 f7 ttu`}>
        {' '}
        <RectShape
          className="show-loading-animation"
          color="#DDD"
          style={{ width: 60, height: 30 }}
        />{' '}
      </div>
      <h3 className="pb2 f5 fw6 h3 lh-title overflow-y-hidden">
        <TextBlock rows={3} className="show-loading-animation" color="#CCC" />
      </h3>
      <TextBlock rows={4} className="show-loading-animation" color="#CCC" />
    </div>
  </div>
);

export const nCardPlaceholders = (N, cardWidthClass = 'w-25-l') => {
  return [...Array(N).keys()].map(projectCardPlaceholderTemplate(cardWidthClass));
};

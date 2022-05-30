import React, { Fragment } from 'react';

import { TextRow, TextBlock, RoundShape, RectShape } from 'react-placeholder/lib/placeholders';

export const teamCardPlaceholderTemplate = () => (_n, i) =>
  (
    <div className={`fl 'w-third-l' base-font w-50-m w-100 mb3 pr3 blue-dark mw5`} key={i}>
      <div className="pv3 ph3 ba br1 b--grey-light shadow-hover bg-white">
        <TextRow className="show-loading-animation mb3" color="#CCC" />
        <RectShape
          className="show-loading-animation"
          style={{ width: 80, height: 50 }}
          color="#DDD"
        />
        {[...Array(2)].map((_, i) => (
          <Fragment key={i}>
            <TextRow className="show-loading-animation" color="#CCC" style={{ width: '45%' }} />
            {[...Array(2)].map((_, i) => (
              <RoundShape
                key={i}
                className="show-loading-animation dib mt1"
                style={{ width: 25, height: 25 }}
                color="#DDD"
              />
            ))}
          </Fragment>
        ))}
        <TextBlock rows={2} className="show-loading-animation mt2" color="#CCC" />
      </div>
    </div>
  );

export const nCardPlaceholders = (N) => {
  return [...Array(N).keys()].map(teamCardPlaceholderTemplate());
};

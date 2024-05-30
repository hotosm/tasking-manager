import React from 'react';
import { TextRow, RoundShape, RectShape } from 'react-placeholder/lib/placeholders';

export const partnersActivityPlaceholderTemplate = () => (_n, i) =>
  (
    <div className="w-50-l w-100 fl pr3" key={i}>
      <div className="bg-white blue-dark mv2 pb4 dib w-100 ba br1 b--grey-light shadow-hover">
        <div className="w-25 h4 fl pa3">
          <RectShape
            className="show-loading-animation"
            style={{ width: '100%', height: 100 }}
            color="#DDD"
          />
        </div>
        <div className="w-75 fl pl3">
          <TextRow className="show-loading-animation mb4" color="#CCC" style={{ width: '50%' }} />
          <TextRow className="show-loading-animation mb2" color="#CCC" style={{ width: '50%' }} />
          <div className="dib">
            {[...Array(2)].map((_, i) => (
              <RoundShape
                key={i}
                className="show-loading-animation dib mt1"
                style={{ width: 25, height: 25 }}
                color="#DDD"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

export const nCardPlaceholders = (N) => {
  return [...Array(N).keys()].map(partnersActivityPlaceholderTemplate());
};

import { Fragment } from 'react';

import { TextRow, TextBlock, RoundShape, RectShape } from 'react-placeholder/lib/placeholders';

export const teamCardPlaceholderTemplate = () => (_n, i) =>
  (
    <article
      className="base-font blue-dark h-100 bg-white ph3 pb3 ba br1 b--card shadow-hover h-100 flex flex-column justify-between"
      key={i}
    >
      <div className="mt3">
        <TextRow
          className="show-loading-animation mb3"
          color="#CCC"
          style={{ width: 200, height: 24 }}
        />
        <RectShape
          className="show-loading-animation mb4"
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
      </div>
      <TextBlock
        rows={2}
        className="show-loading-animation mt2"
        color="#CCC"
        style={{ width: 80, height: 50 }}
      />
    </article>
  );

export const nCardPlaceholders = (N) => {
  return [...Array(N).keys()].map(teamCardPlaceholderTemplate());
};

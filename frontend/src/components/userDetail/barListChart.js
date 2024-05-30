import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

const ProgressBar = ({ percent }) => (
  <div className="w-100 relative mt2">
    <div
      style={{ height: '0.5em', width: `${percent * 100}%` }}
      className="bg-red br-pill absolute"
    ></div>
  </div>
);

export const BarChartItem = ({ name, link, percentValue, number, numberUnit }: Object) => (
  <li className="w-100 cf list pv3">
    <div className="w-100 cf mr4">
      <div className="di ma0 f7 b fl">
        {link ? (
          <Link className="link blue-dark" to={link}>
            {name}
          </Link>
        ) : (
          name
        )}
      </div>
      <div className="di ma0 f7 fr">
        <span className="b mr1">{number}</span>
        {numberUnit && <span className="blue-grey">{numberUnit}</span>}
      </div>
    </div>
    <div className="w-100 cf">
      <ProgressBar percent={percentValue} />
    </div>
  </li>
);

export const BarListChart = ({ data, valueField, nameField, linkBase, linkField }) => {
  return (
    <ol className="pa0 mt1 mb0">
      {data.map((p, n) => (
        <BarChartItem
          key={n}
          name={p[nameField]}
          link={linkBase ? `${linkBase}${p[linkField]}` : null}
          percentValue={p.percent}
          number={p[valueField]}
          numberUnit={<FormattedMessage {...messages.tasks} />}
        />
      ))}
    </ol>
  );
};

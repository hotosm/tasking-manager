import React from 'react';
import { Link } from '@reach/router';
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

export const BarChartItem = ({ name, link, percentValue, tasksNumber }: Object) => (
  <li className="w-100 flex pv3">
    <div className="w-100 mr4">
      <p className="ma0 f7 b">
        {link ? (
          <Link className="link blue-dark" to={link}>
            {name}
          </Link>
        ) : (
          name
        )}
      </p>
      <ProgressBar percent={percentValue} />
    </div>
    <div className="w-30 tl self-end">
      <p className="ma0 f7">
        <span className="b mr1">{tasksNumber}</span>
        <span className="blue-grey">
          <FormattedMessage {...messages.tasks} />
        </span>
      </p>
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
          tasksNumber={p[valueField]}
        />
      ))}
    </ol>
  );
};

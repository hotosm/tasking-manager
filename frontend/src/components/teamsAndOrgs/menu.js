import React from 'react';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { SectionMenu } from '../menu';
import { ChartLineIcon } from '../svgIcons';

export function ManagementMenu({ isAdmin }: Object) {
  let links = [
    'projects',
    'organisations',
    'teams',
    'campaigns',
    'categories',
    'users',
    'licenses',
  ];
  // non admin users can only see the three first items
  if (!isAdmin) {
    links = links.slice(0, 3);
  }
  const items = links.map((item) => ({
    url: `/manage/${item}/${
      item === 'projects' ? '?status=PUBLISHED&managedByMe=1&action=any' : ''
    }`,
    label: <FormattedMessage {...messages[item]} />,
  }));

  return (
    <div className="w-100 cf">
      <SectionMenu items={items} />
      <Link to="/stats" className="link bg-tan bn blue-grey pv2 mt2 ph3 ml4">
        <ChartLineIcon className="pr1 pb1 h1 v-mid" />
        <FormattedMessage {...messages.statistics} />
      </Link>
    </div>
  );
}

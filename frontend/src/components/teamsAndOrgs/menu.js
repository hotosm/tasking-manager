import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { SectionMenu } from '../menu';

export function ManagementMenu({ isAdmin }: Object) {
  let links = [
    'projects',
    'organisations',
    'teams',
    'campaigns',
    'partners',
    'categories',
    'users',
    'licenses',
  ];
  // non admin users can only see the three first items
  if (!isAdmin) {
    links = links.slice(0, 3);
  }
  let items = links.map((item) => ({
    url: `/manage/${item}/${
      item === 'projects' ? '?status=PUBLISHED&managedByMe=1&action=any' : ''
    }`,
    label: <FormattedMessage {...messages[item]} />,
  }));
  items.push({
    url: '/manage/stats/',
    label: <FormattedMessage {...messages.statistics} />,
  });
  items.unshift({
    url: '/manage',
    label: <FormattedMessage {...messages.overview} />,
  });
  return <SectionMenu items={items} />;
}

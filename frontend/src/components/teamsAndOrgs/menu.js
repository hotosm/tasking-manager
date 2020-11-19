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
    'categories',
    'users',
    'licenses',
  ];
  // non admin users can only see the three first items
  if (!isAdmin) {
    links = links.slice(0, 3);
  }
  const items = links.map((item) => ({
    url: `/manage/${item}/${item === 'projects' ? '?status=PUBLISHED&managedByMe=1' : ''}`,
    label: <FormattedMessage {...messages[item]} />,
  }));

  return <SectionMenu items={items} />;
}

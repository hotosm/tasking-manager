import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { SectionMenu } from '../menu';

export function ManagementMenu() {
  const links = ['projects', 'organisations', 'teams', 'campaigns', 'interests', 'users'];
  const items = links.map(item => ({
    url: `/manage/${item}/`,
    label: <FormattedMessage {...messages[item]} />,
  }));

  return <SectionMenu items={items} />;
}

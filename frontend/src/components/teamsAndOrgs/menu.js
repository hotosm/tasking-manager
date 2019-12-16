import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { TopNavLink } from '../header/NavLink';

export function ManagementMenu() {
  const links = ['projects', 'organisations', 'teams', 'campaigns'];

  const isActive = ({ isCurrent }) => {
    const linkCombo = 'link mh2 blue-dark';
    return isCurrent
      ? { className: `${linkCombo} bb b--blue-dark bw1 pb1` }
      : { className: linkCombo };
  };
  return (
    <div className="cf mb2 pb3 pt3-ns ph4 bg-grey-light dib">
      {links.map((link, n) => (
        <TopNavLink key={n} to={`/manage/${link}/`} isActive={isActive}>
          <span className="db dib-ns">
            <FormattedMessage
              {...messages.manage}
              values={{ entity: <FormattedMessage {...messages[link]} /> }}
            />
          </span>
        </TopNavLink>
      ))}
    </div>
  );
}

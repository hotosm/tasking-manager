import React, { useRef, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import { Button } from '../button';
import messages from './messages';
import { ShareButton } from './shareButton';
import { AddToFavorites } from './favorites';
import { HorizontalScroll } from '../horizontalScroll';

import './styles.scss';

const menuItems = [
  {
    href: '#top',
    label: <FormattedMessage {...messages.overview} />,
  },
  {
    href: '#description',
    label: <FormattedMessage {...messages.description} />,
  },
  {
    href: '#coordination',
    label: <FormattedMessage {...messages.coordination} />,
  },
  {
    href: '#teams',
    label: <FormattedMessage {...messages.teamsAndPermissions} />,
  },
  {
    href: '#questionsAndComments',
    label: <FormattedMessage {...messages.questionsAndComments} />,
  },
  {
    href: '#contributions',
    label: <FormattedMessage {...messages.contributions} />,
  },
  {
    href: '#relatedProjects',
    label: <FormattedMessage {...messages.relatedProjects} />,
  },
];

export const ProjectDetailFooter = ({ className, projectId }) => {
  const userIsloggedIn = useSelector((state) => state.auth.token);
  const menuItemsContainerRef = useRef(null);

  return (
    <div
      className={`${
        className || ''
      } pl4 w-100 z-4 bg-white fixed bottom-0 left-0 flex items-center justify-between`}
      style={{ boxShadow: '0px -1px 0px #F0EFEF, 0px 1px 0px #F0EFEF' }}
    >
      {/* TODO ADD ANCHORS */}
      <HorizontalScroll
        className={'w-60-ns pr1 mr4 dn db-l'}
        menuItemsContainerRef={menuItemsContainerRef}
        containerClass={'.menu-items-container'}
      >
        <div ref={menuItemsContainerRef} className="menu-items-container nowrap overflow-x-auto">
          {menuItems.map((menuItem, index) => (
            <Fragment key={menuItem.href}>
              <a className="link blue-dark" href={menuItem.href}>
                {menuItem.label}
              </a>
              {index < menuItems.length - 1 && <span className="ph2">&#183;</span>}
            </Fragment>
          ))}
        </div>
      </HorizontalScroll>
      <div className="flex items-center ml-auto gap-1">
        <ShareButton projectId={projectId} />
        {userIsloggedIn && <AddToFavorites projectId={projectId} />}
        <Link to={`./tasks`} className="">
          <Button className="white bg-red h3 w5">
            <FormattedMessage {...messages.contribute} />
          </Button>
        </Link>
      </div>
    </div>
  );
};

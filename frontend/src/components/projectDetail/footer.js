import React, { useState, useEffect, useRef, Fragment } from 'react';
import { Link } from '@reach/router';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import useForceUpdate from '../../hooks/UseForceUpdate';
import { useWindowSize } from '../../hooks/UseWindowSize';
import { Button } from '../button';
import messages from './messages';
import { ShareButton } from './shareButton';
import { AddToFavorites } from './favorites';
import { ChevronRightIcon } from '../svgIcons';

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
  // {
  //   href: '#relatedProjects',
  //   label: <FormattedMessage {...messages.relatedProjects} />,
  // },
];

export const ProjectDetailFooter = ({ className, projectId }) => {
  const userIsloggedIn = useSelector((state) => state.auth.token);
  const [scrollLeft, setScrollLeft] = useState(0);
  const menuItemsContainerRef = useRef(null);
  const size = useWindowSize();
  const [, forceUpdate] = useForceUpdate();

  useEffect(() => {
    forceUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, size);

  useEffect(() => {
    const menuItemsContainer = document.querySelector('.menu-items-container');
    menuItemsContainer.addEventListener('scroll', updateScrollLeft);

    return () => {
      menuItemsContainer.removeEventListener('scroll', updateScrollLeft);
    };
  }, []);

  const updateScrollLeft = (e) => {
    setScrollLeft(e.target.scrollLeft);
  };

  const handleScroll = (direction) => {
    let currentScroll = scrollLeft;
    if (direction === 'right') {
      currentScroll += 200;
    } else {
      currentScroll -= 200;
    }
    menuItemsContainerRef.current.scrollTo({
      left: currentScroll,
      behavior: 'smooth',
    });
  };

  return (
    <div
      className={`${
        className || ''
      } pl4 w-100 z-4 bg-white fixed bottom-0 left-0 flex items-center justify-between`}
      style={{ boxShadow: '0px -1px 0px #F0EFEF, 0px 1px 0px #F0EFEF' }}
    >
      {/* TODO ADD ANCHORS */}
      <div className="relative overflow-hidden w-60-ns pr1 mr4 dn db-l">
        <div
          className={`menu-overflow-left bg-white absolute left-0 rotate-180 z-1 pointer pl2 ${
            scrollLeft > 0 ? 'db' : 'dn'
          }`}
          onClick={() => handleScroll('left')}
        >
          <ChevronRightIcon />
        </div>
        <div
          className={`menu-overflow-right bg-white absolute right-0 z-1 pointer pl2 ${
            scrollLeft <
            menuItemsContainerRef.current?.scrollWidth - menuItemsContainerRef.current?.clientWidth
              ? 'db'
              : 'dn'
          }`}
          onClick={() => handleScroll('right')}
        >
          <ChevronRightIcon />
        </div>
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
      </div>
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

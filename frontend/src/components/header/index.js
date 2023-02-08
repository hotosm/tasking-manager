import React, { Fragment, useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, navigate } from '@reach/router';
import Popup from 'reactjs-popup';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { ORG_URL, ORG_NAME, ORG_LOGO, SERVICE_DESK } from '../../config';
import logo from '../../assets/img/main-logo.svg';
import { ChevronRightIcon, ExternalLinkIcon } from '../svgIcons';
import { Dropdown } from '../dropdown';
import { LocaleSelector } from '../localeSelect';
import { Button } from '../button';
import { UpdateDialog } from './updateDialog';
import { BurgerMenu } from './burgerMenu';
import { TopNavLink } from './NavLink';
import { SignUp } from './signUp';
import { UpdateEmail } from './updateEmail';
import { CurrentUserAvatar } from '../user/avatar';
import { logout } from '../../store/actions/auth';
import { createLoginWindow } from '../../utils/login';
import { NotificationBell } from './notificationBell';
import { useDebouncedCallback } from '../../hooks/UseThrottle';
import { useWindowSize } from '../../hooks/UseWindowSize';

import './styles.scss';

export const Header = (props) => {
  const dispatch = useDispatch();
  const menuItemsContainerRef = useRef(null);
  // This triggers rerender when the screen size changes, so had to keep it
  // even if it's unused
  // eslint-disable-next-line no-unused-vars
  const size = useWindowSize();
  const [scrollLeft, setScrollLeft] = useState(0);
  const userDetails = useSelector((state) => state.auth.userDetails);
  const organisations = useSelector((state) => state.auth.organisations);
  const showOrgBar = useSelector((state) => state.orgBarVisibility.isVisible);

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

  const linkCombo = 'link mh3 barlow-condensed blue-dark f4 ttu lh-solid nowrap pv2';

  const isActive = ({ isPartiallyCurrent }) => {
    return isPartiallyCurrent
      ? { className: `${linkCombo} bb b--blue-dark bw1` }
      : { className: linkCombo };
  };

  const getUserLinks = (role) => {
    return [
      { label: <FormattedMessage {...messages.settings} />, url: '/settings' },
      { label: <FormattedMessage {...messages.logout} />, url: '/logout' },
    ];
  };

  const renderMenuItems = () => {
    let filteredMenuItems = getMenuItemsForUser(userDetails, organisations);

    return (
      <nav className="menu-items-container flex overflow-x-auto" ref={menuItemsContainerRef}>
        {filteredMenuItems.map((item) => (
          <Fragment key={item.label.id}>
            {!item.serviceDesk ? (
              <TopNavLink to={item.link} isActive={isActive} style={{ outlineOffset: '-1px' }}>
                <FormattedMessage {...item.label} />
              </TopNavLink>
            ) : (
              <a href={item.link} target="_blank" rel="noreferrer" className={linkCombo}>
                <FormattedMessage {...item.label} />
                <ExternalLinkIcon className="pl2 v-cen" style={{ height: '15px' }} />
              </a>
            )}
          </Fragment>
        ))}
      </nav>
    );
  };

  const onUserMenuSelect = (arr) => {
    if (arr[0].url === '/logout') {
      dispatch(logout());
    } else {
      navigate(arr[0].url);
    }
  };

  const checkUserEmail = () =>
    userDetails.hasOwnProperty('emailAddress') && !userDetails.emailAddress ? (
      <Popup modal open closeOnEscape={false} closeOnDocumentClick={false}>
        {(close) => <UpdateEmail closeModal={close} />}
      </Popup>
    ) : null;

  return (
    <header className="w-100 bb b--grey-light">
      <UpdateDialog />
      {checkUserEmail()}
      {showOrgBar && (
        <div className="cf ph2 red pt3 pb2 bb b--grey-light">
          <div className="fl w-50">
            <span className="barlow-condensed f5 ml2 ">
              <FormattedMessage {...messages.slogan} />
            </span>
          </div>
          <div className="tr red">
            <a className="link red f6 mr2" href={`http://${ORG_URL}`}>
              {ORG_URL}
              <ExternalLinkIcon
                title="externalLink"
                className="pl2 v-btm"
                style={{ height: '15px' }}
              />
            </a>
          </div>
        </div>
      )}
        <div
          className="dn dib-l ml5-l mr4-l pl6-xl relative overflow-hidden"
          style={{ flexGrow: 1 }}
        >
          <ChevronRightIcon
            role="button"
            className={`bg-white absolute left-0 rotate-180 z-1 pointer pa2 translate-icon-btm ${
              scrollLeft > 0 ? 'db' : 'dn'
            }`}
            onClick={() => handleScroll('left')}
          />
          <ChevronRightIcon
            role="button"
            className={`translate-icon bg-white absolute right-0 z-1 pointer pa2 translate-icon ${
              scrollLeft <
              menuItemsContainerRef.current?.scrollWidth -
                menuItemsContainerRef.current?.clientWidth
                ? 'db'
                : 'dn'
            }`}
            onClick={() => handleScroll('right')}
          />
          {renderMenuItems()}
        </div>

        <div className="fr dib tr mb1 flex items-center">
          <ActionItems
            userDetails={userDetails}
            onUserMenuSelect={onUserMenuSelect}
            location={props.location}
            getUserLinks={getUserLinks}
          />
          <div className="dib v-mid dn-l">
            <Popup trigger={(open) => <BurgerMenu open={open} />} modal closeOnDocumentClick>
              {(close) => (
                <div>
                  <PopupItems
                    userDetails={userDetails}
                    menuItems={getMenuItemsForUser(userDetails)}
                    linkCombo={linkCombo}
                    location={props.location}
                    close={close}
                  />
                </div>
              )}
            </Popup>
          </div>
        </div>
      </div>
    </header>
  );
};

export function getMenuItemsForUser(userDetails, organisations) {
  const menuItems = [
    { label: messages.exploreProjects, link: 'explore', showAlways: true },
    {
      label: messages.myContributions,
      link: `contributions`,
      authenticated: true,
    },
    { label: messages.manage, link: 'manage', authenticated: true, manager: true },
    { label: messages.learn, link: 'learn', showAlways: true },
    { label: messages.about, link: 'about', showAlways: true },
  ];

  if (SERVICE_DESK) {
    menuItems.push({
      label: messages.support,
      link: SERVICE_DESK,
      showAlways: true,
      serviceDesk: true,
    });
  }

  let filteredMenuItems;
  if (userDetails.username) {
    filteredMenuItems = menuItems.filter((item) => item.authenticated === true || item.showAlways);
    if (
      userDetails.role !== 'ADMIN' &&
      (organisations === undefined || organisations.length === 0)
    ) {
      filteredMenuItems = filteredMenuItems.filter((item) => !item.manager);
    }
  } else {
    filteredMenuItems = menuItems.filter((item) => item.authenticated === false || item.showAlways);
  }
  return filteredMenuItems;
}

const UserDisplay = ({ username }) => {
  return (
    <span>
      <CurrentUserAvatar className="br-100 v-mid red h2 w2 dib" />
      <span className="pl2 mw5 dib v-mid truncate">{username}</span>
    </span>
  );
};

export const AuthButtons = ({
  logInStyle,
  signUpStyle,
  redirectTo,
  alternativeSignUpText = false,
}) => {
  const [debouncedCreateLoginWindow] = useDebouncedCallback(
    (redirectToPass) => createLoginWindow(redirectToPass),
    3000,
    { leading: true },
  );

  return (
    <>
      <Button onClick={() => debouncedCreateLoginWindow(redirectTo)} className={`${logInStyle}`}>
        <FormattedMessage {...messages.logIn} />
      </Button>
      <Popup
        trigger={
          <Button className={signUpStyle}>
            {alternativeSignUpText ? (
              <FormattedMessage {...messages.createAccount} />
            ) : (
              <FormattedMessage {...messages.signUp} />
            )}
          </Button>
        }
        modal
        closeOnDocumentClick
      >
        {(close) => <SignUp closeModal={close} />}
      </Popup>
    </>
  );
};

export const ActionItems = ({ userDetails, onUserMenuSelect, location, getUserLinks }) =>
  userDetails.username ? (
    <>
      <NotificationBell />
      <Dropdown
        onChange={onUserMenuSelect}
        value={[]}
        display={<UserDisplay username={userDetails.username} />}
        options={getUserLinks(userDetails.role)}
        className="blue-dark bg-white mr1 v-mid dn dib-ns pv2 ph3 bn"
      />
    </>
  ) : (
    <>
      <LocaleSelector className="bn dn dib-66rem" />
      <AuthButtons
        logInStyle="blue-dark bg-white"
        signUpStyle="bg-blue-dark white ml1 v-mid dn dib-ns"
        redirectTo={location.pathname}
      />
    </>
  );

export const PopupItems = (props) => {
  const dispatch = useDispatch();

  return (
    <div className="v-mid tc">
      {/* links that don't require authentication */}
      {props.menuItems
        .filter((item) => item.authenticated === false || item.showAlways)
        .map((item, n) => (
          <p key={n}>
            {!item.serviceDesk ? (
              <Link to={item.link} className={props.linkCombo} onClick={props.close}>
                <FormattedMessage {...item.label} />
              </Link>
            ) : (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="link mh3 barlow-condensed blue-dark f4 ttu"
              >
                <FormattedMessage {...item.label} />
                <ExternalLinkIcon className="pl2 v-cen" style={{ height: '15px' }} />
              </a>
            )}
          </p>
        ))}
      <p className="bb b--grey-light"></p>

      {/* authentication section */}
      {props.userDetails.username ? (
        <>
          {props.menuItems
            .filter((item) => item.authenticated === true)
            .map((item) => (
              <p key={item.label.id}>
                <Link to={item.link} className={props.linkCombo} onClick={props.close}>
                  <FormattedMessage {...item.label} />
                </Link>
              </p>
            ))}
          <p>
            <Link to={'/settings'} className={props.linkCombo} onClick={props.close}>
              <FormattedMessage {...messages.settings} />
            </Link>
          </p>
          <Button className="bg-blue-dark white" onClick={() => dispatch(logout())}>
            <FormattedMessage {...messages.logout} />
          </Button>
        </>
      ) : (
        <AuthButtons
          logInStyle="bg-red white"
          signUpStyle="bg-blue-dark white mh1 mv2 dib"
          redirectTo={props.location.pathname}
        />
      )}
    </div>
  );
};

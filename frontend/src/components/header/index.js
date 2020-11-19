import React from 'react';
import { connect } from 'react-redux';
import { Link, navigate } from '@reach/router';
import Popup from 'reactjs-popup';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { ORG_URL, ORG_NAME } from '../../config';
import logo from '../../assets/img/main-logo.svg';
import { ExternalLinkIcon } from '../svgIcons';
import { Dropdown } from '../dropdown';
import { LocaleSelector } from '../localeSelect';
import { Button } from '../button';
import { BurgerMenu } from './burgerMenu';
import { TopNavLink } from './NavLink';
import { SignUp } from './signUp';
import { UpdateEmail } from './updateEmail';
import { CurrentUserAvatar } from '../user/avatar';
import { logout } from '../../store/actions/auth';
import { createLoginWindow } from '../../utils/login';
import { NotificationBell } from './notificationBell';
import { useDebouncedCallback } from '../../hooks/UseThrottle';

function getMenuItensForUser(userDetails, organisations) {
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
      <span className="pl2">{username}</span>
    </span>
  );
};

const AuthButtons = (props) => {
  const { logInStyle, signUpStyle, redirectTo } = props;
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
            <FormattedMessage {...messages.signUp} />
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

const PopupItems = (props) => {
  return (
    <div className="v-mid tc">
      {/* links that don't require authentication */}
      {props.menuItems
        .filter((item) => item.authenticated === false || item.showAlways)
        .map((item, n) => (
          <p key={n}>
            <Link to={item.link} className={props.linkCombo} onClick={props.close}>
              <FormattedMessage {...item.label} />
            </Link>
          </p>
        ))}
      <p className="bb b--grey-light"></p>
      {/* links that require authentication */}
      {props.userDetails.username &&
        props.menuItems
          .filter((item) => item.authenticated === true)
          .map((item, n) => (
            <p key={n}>
              <Link to={item.link} className={props.linkCombo} onClick={props.close}>
                <FormattedMessage {...item.label} />
              </Link>
            </p>
          ))}
      {/* user links */}
      {props.userDetails.username && (
        <>
          <p>
            <Link to={'/settings'} className={props.linkCombo} onClick={props.close}>
              <FormattedMessage {...messages.settings} />
            </Link>
          </p>
        </>
      )}
      {/* authentication section */}
      {props.userDetails.username ? (
        <Button className="bg-blue-dark white" onClick={() => props.logout()}>
          <FormattedMessage {...messages.logout} />
        </Button>
      ) : (
        <div>
          <AuthButtons
            logInStyle="bg-red white"
            signUpStyle="bg-blue-dark white mh1 mv2 dib"
            redirectTo={props.location.pathname}
          />
        </div>
      )}
    </div>
  );
};

class Header extends React.Component {
  linkCombo = 'link mh3 barlow-condensed blue-dark f4 ttu';
  isActive = ({ isCurrent }) => {
    return isCurrent
      ? { className: `${this.linkCombo} bb b--blue-dark bw1 pv2` }
      : { className: this.linkCombo };
  };

  getUserLinks = (role) => {
    return [
      { label: <FormattedMessage {...messages.settings} />, url: '/settings' },
      { label: <FormattedMessage {...messages.logout} />, url: '/logout' },
    ];
  };

  renderMenuItems() {
    let filteredMenuItems = getMenuItensForUser(this.props.userDetails, this.props.organisations);

    return (
      <div className="v-mid">
        {filteredMenuItems.map((item, n) => (
          <TopNavLink to={item.link} key={n} isActive={this.isActive}>
            <FormattedMessage {...item.label} />
          </TopNavLink>
        ))}
      </div>
    );
  }

  onUserMenuSelect = (arr) => {
    if (arr.length === 1) {
      if (arr[0].url === '/logout') {
        this.props.logout();
      } else {
        console.log(this.props.push);
        navigate(arr[0].url);
      }
    } else if (arr.length > 1) {
      throw new Error('filter select array is big');
    }
  };

  checkUserEmail() {
    return this.props.userDetails.hasOwnProperty('emailAddress') &&
      !this.props.userDetails.emailAddress ? (
      <Popup modal open closeOnEscape={false} closeOnDocumentClick={false}>
        {(close) => <UpdateEmail closeModal={close} />}
      </Popup>
    ) : null;
  }

  renderAuthenticationButtons() {
    return this.props.userDetails.username ? (
      <>
        <NotificationBell />
        <Dropdown
          onAdd={() => {}}
          onRemove={() => {}}
          onChange={this.onUserMenuSelect}
          value={[]}
          display={<UserDisplay username={this.props.userDetails.username} />}
          options={this.getUserLinks(this.props.userDetails.role)}
          className="blue-dark bg-white mr1 v-mid dn dib-ns pv2 ph3 bn"
        />
      </>
    ) : (
      <div className="dib">
        <LocaleSelector className="bn dn dib-66rem" />
        <AuthButtons
          aStyle="mh1 v-mid dn dib-ns"
          logInStyle="blue-dark bg-white"
          signUpStyle="bg-blue-dark white ml1 v-mid dn dib-ns"
          redirectTo={this.props.location.pathname}
        />
      </div>
    );
  }

  render() {
    return (
      // Validate that user has set is email.
      <header className="w-100 bb b--grey-light">
        {this.checkUserEmail()}
        {this.props.showOrgBar && (
          <div className="cf ph2 red pt3 pb2 bb b--grey-light">
            <div className="fl w-50">
              <span className="barlow-condensed f5 ml2 ">
                <FormattedMessage {...messages.slogan} />
              </span>
            </div>
            <div className="tr red">
              <a className="link red f6 mr2" href={`http://${ORG_URL}`}>
                {ORG_URL}
                <ExternalLinkIcon className="pl2 v-btm" style={{ height: '15px' }} />
              </a>
            </div>
          </div>
        )}
        <div className="mt3 pb1 pb2-ns ph2 dib w-100">
          <div className="cf fl pt1 dib">
            <Link to={'/'} className="link mv-1">
              <img
                src={logo}
                alt={`${ORG_NAME} logo`}
                className="ml2 v-mid pb2"
                style={{ width: '54px' }}
              />
              <span className="barlow-condensed f3 fw6 ml2 blue-dark">Tasking Manager</span>
            </Link>
          </div>
          <nav className="dn dib-l pl4-l pl6-xl pt1 mv1">{this.renderMenuItems()}</nav>

          <div className="fr dib tr mb1">
            {this.renderAuthenticationButtons()}
            <div className="dib v-mid dn-l">
              <Popup trigger={(open) => <BurgerMenu open={open} />} modal closeOnDocumentClick>
                {(close) => (
                  <div>
                    <PopupItems
                      userDetails={this.props.userDetails}
                      menuItems={getMenuItensForUser(this.props.userDetails)}
                      linkCombo={this.linkCombo}
                      logout={this.props.logout}
                      location={this.props.location}
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
  }
}

const mapStateToProps = (state) => ({
  userDetails: state.auth.get('userDetails'),
  organisations: state.auth.get('organisations'),
  token: state.auth.get('token'),
  showOrgBar: state.orgBarVisibility.isVisible,
});

Header = connect(mapStateToProps, { logout })(Header);

export { Header, getMenuItensForUser, AuthButtons };

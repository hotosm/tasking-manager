import React from 'react';
import { connect } from 'react-redux';
import { Link, navigate } from '@reach/router';
import Popup from 'reactjs-popup';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { ORG_URL, ORG_NAME, API_URL } from '../../config';
import logo from '../../assets/img/main-logo.svg';
import { LinkIcon } from '../svgIcons';
import { Dropdown } from '../dropdown';
import { Button } from '../button';
import { BurgerMenu } from './burgerMenu';
import { UserAvatar } from '../user/avatar';
import { logout } from '../../store/actions/auth';
import { setLocale } from '../../store/actions/userPreferences';
import { supportedLocales } from '../../utils/internationalization';

const menuItems = [
  { label: messages.exploreProjects, link: 'contribute', showAlways: true },
  { label: messages.howItWorks, link: 'learn', authenticated: false },
  { label: messages.about, link: 'about', authenticated: false },
  { label: messages.help, link: 'help', authenticated: false },
  { label: messages.myProjects, link: 'projects', authenticated: true },
  { label: messages.myTasks, link: 'tasks', authenticated: true },
  { label: messages.statsBadges, link: 'user', authenticated: true },
];

const TopNavLink = props => {
  const { isActive, ...otherProps } = props;
  return (
    <Link getProps={isActive} {...otherProps}>
      {props.children}
    </Link>
  );
};

const UserDisplay = props => {
  return (
    <span>
      <UserAvatar className="br-100 h2 v-mid" />
      <span className="pl2">{props.username}</span>
    </span>
  );
};

const AuthButtons = props => {
  const { logInStyle, signUpStyle, aStyle, redirectTo } = props;
  return (
    <>
      <a
        href={`${API_URL}system/authentication/login?redirect_to=${redirectTo || '/'}`}
        className={aStyle}
      >
        <Button className={logInStyle}>
          <FormattedMessage {...messages.logIn} />
        </Button>
      </a>
      <Button className={signUpStyle}>
        <FormattedMessage {...messages.signUp} />
      </Button>
    </>
  );
};

class Header extends React.Component {
  menuItems = menuItems;
  linkCombo = 'link mh3 barlow-condensed blue-dark f4 ttu';
  isActive = ({ isPartiallyCurrent }) => {
    return isPartiallyCurrent
      ? { className: `${this.linkCombo} bb b--blue-dark bw1 pv2` }
      : { className: this.linkCombo };
  };
  userLinks = [
    { label: <FormattedMessage {...messages.settings} />, url: '/settings' },
    { label: <FormattedMessage {...messages.logout} />, url: '/logout' },
  ];

  renderMenuItems() {
    let filteredMenuItems;
    if (this.props.token) {
      filteredMenuItems = this.menuItems.filter(
        item => item.authenticated === true || item.showAlways,
      );
    } else {
      filteredMenuItems = this.menuItems.filter(
        item => item.authenticated === false || item.showAlways,
      );
    }
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

  renderPopupItems() {
    return (
      <div className="v-mid tc">
        {this.props.username &&
          this.menuItems
            .filter(item => item.authenticated === true)
            .map((item, n) => (
              <p key={n}>
                <Link to={item.link} className={this.linkCombo}>
                  <FormattedMessage {...item.label} />
                </Link>
              </p>
            ))}
        {this.props.username && (
          <>
            <p>
              <Link to={'/settings'} className={this.linkCombo}>
                <FormattedMessage {...messages.settings} />
              </Link>
            </p>
            <p className="bb b--grey-light"></p>
          </>
        )}
        {this.menuItems
          .filter(item => item.authenticated === false || item.showAlways)
          .map((item, n) => (
            <p key={n}>
              <Link to={item.link} className={this.linkCombo}>
                <FormattedMessage {...item.label} />
              </Link>
            </p>
          ))}
        {this.props.username ? (
          <Button className="bg-blue-dark white" onClick={() => this.props.logout()}>
            <FormattedMessage {...messages.logout} />
          </Button>
        ) : (
          <div>
            <AuthButtons
              aStyle="mh1 mv2 dib"
              logInStyle="bg-red white"
              signUpStyle="bg-blue-dark white mh1 mv2 dib"
              redirectTo={this.props.location.pathname}
            />
          </div>
        )}
      </div>
    );
  }

  onUserMenuSelect = arr => {
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

  onLocaleSelect = arr => {
    if (arr.length === 1) {
      this.props.setLocale(arr[0].value);
    } else if (arr.length > 1) {
      throw new Error('filter select array is big');
    }
  };

  getActiveLanguageNames() {
    const locales = [
      this.props.userPreferences.locale,
      navigator.language,
      navigator.language.substr(0, 2),
    ];
    let supportedLocaleNames = [];
    locales.forEach(locale =>
      supportedLocales
        .filter(i => i.value === locale)
        .forEach(i => supportedLocaleNames.push(i.label)),
    );
    return supportedLocaleNames[0] || 'English';
  }

  renderAuthenticationButtons() {
    return this.props.username ? (
      <Dropdown
        onAdd={() => {}}
        onRemove={() => {}}
        onChange={this.onUserMenuSelect}
        value={[]}
        options={this.userLinks}
        display={<UserDisplay username={this.props.username} />}
        className="blue-dark bg-white mr1 v-mid dn dib-ns pv2 ph3 bn"
      />
    ) : (
      <div className="dib">
        <Dropdown
          onAdd={() => {}}
          onRemove={() => {}}
          onChange={this.onLocaleSelect}
          value={this.getActiveLanguageNames()}
          options={supportedLocales}
          display={<FormattedMessage {...messages.language} />}
          className="blue-dark bg-white mr1 v-mid dn dib-66rem pv2 ph3 bn"
        />
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
      <header className="w-100 bb b--grey-light">
        <div className="cf ph2 red pt3 pb2 bb b--grey-light">
          <div className="fl w-50">
            <span className="barlow-condensed f5 ml2 ">
              <FormattedMessage {...messages.slogan} />
            </span>
          </div>
          <div className="tr red">
            <a className="link red f6 mr2" href={`http://${ORG_URL}`}>
              {ORG_URL}
              <LinkIcon className="pl2 v-btm" style={{ height: '15px' }} />
            </a>
          </div>
        </div>
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
              <Popup trigger={open => <BurgerMenu open={open} />} modal closeOnDocumentClick>
                <div>{this.renderPopupItems()}</div>
              </Popup>
            </div>
          </div>
        </div>
      </header>
    );
  }
}

const mapStateToProps = state => ({
  userPreferences: state.preferences,
  username: state.auth.getIn(['userDetails', 'username']),
  token: state.auth.get('token'),
});

Header = connect(
  mapStateToProps,
  { logout, setLocale },
)(Header);

export { Header, menuItems, AuthButtons };

import React from 'react';
import { connect } from "react-redux";
import { Link, navigate } from "@reach/router";
import Popup from "reactjs-popup";
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { ORG_URL, ORG_NAME, API_URL } from '../../config';
import logo from '../../assets/img/main-logo.svg';
import { LinkIcon } from '../svgIcons';
import { Dropdown } from '../dropdown';
import { Button } from '../button';
import { BurgerMenu } from './burgerMenu';
import { logout } from '../../store/actions/auth';


const menuItems = [
  {label: messages.exploreProjects, link: "contribute"},
  {label: messages.howItWorks, link: "learn"},
  {label: messages.about, link: "about"},
  {label: messages.help, link: "help"}
];

class Header extends React.Component {
  menuItems = menuItems;
  linkCombo = "link ph3 barlow-condensed blue-dark f4 ttu";

  renderMenuItems() {
    return(
      <div className="v-mid">
        {this.menuItems.map((item, n) =>
          <Link to={item.link} key={n} className={ this.linkCombo }>
            <FormattedMessage {...item.label} />
          </Link>
        )}
      </div>
    );
  }

  renderPopupItems() {
    return(
      <div className="v-mid tc">
        {this.menuItems.map((item, n) =>
          <p key={n}>
            <Link to={item.link} className={ this.linkCombo }>
              <FormattedMessage {...item.label} />
            </Link>
          </p>
        )}
        {this.props.username ?
          <Button className="bg-blue-dark white" onClick={() => this.props.logout()}>
            <FormattedMessage {...messages.logout}/>
          </Button>
          :
          <div>
            <a href={`${API_URL}auth/login?redirect_to=/login/`} className="mh1 mv2 dib">
            <Button className="bg-red white"><FormattedMessage {...messages.logIn}/></Button>
            </a>
            <Button className="bg-blue-dark white mh1 mv2 dib"><FormattedMessage {...messages.signUp}/></Button>
          </div>
        }
      </div>
    );
  }

  onUserMenuSelect = (arr) => {
    if (arr.length === 1) {
      if (arr[0].url === 'logout') {
        this.props.logout();
      } else {
        console.log(this.props.push);
        navigate(arr[0].url);
      }
    } else if (arr.length > 1) {
      throw new Error('filter select array is big');
    }
  };

  renderAuthenticationButtons() {
    return(
      this.props.username ?
        <Dropdown
          onAdd={() => {}}
          onRemove={() => {}}
          onChange={this.onUserMenuSelect}
          value={[]}
          options={[
            {label: <FormattedMessage {...messages.settings}/>, url: 'settings'},
            {label: <FormattedMessage {...messages.logout}/>, url: 'logout'}
          ]}
          display={this.props.username}
          className="blue-dark bg-white mr1 v-mid dn dib-ns"
        />
        :
        <div className="dib">
          <Dropdown
            onAdd={() => {}}
            onRemove={() => {}}
            onChange={() => {}}
            value={this.props.userPreferences.language || 'English'}
            options={[{label: 'English'}, {label: 'Portuguese (pt)'}]}
            display={this.props.userPreferences.language || <FormattedMessage {...messages.language}/>}
            className="ba b--grey-light blue-dark bg-white mr1 v-mid dn dib-66rem"
          />
          <a href={`${API_URL}auth/login?redirect_to=/login/`} className="mh1 v-mid dn dib-ns">
            <Button className="blue-dark bg-white"><FormattedMessage {...messages.logIn}/></Button>
          </a>
          <Button className="bg-blue-dark white ml1 v-mid dn dib-ns"><FormattedMessage {...messages.signUp}/></Button>
        </div>
    );
  }

  render() {
    return (
      <header className="w-100 mb1 mb2-ns">
        <div className="cf ph2 bb b--grey-light red pt3 pb2">
          <div className="fl w-50">
            <span className="barlow-condensed f5 ml2 "><FormattedMessage {...messages.slogan}/></span>
          </div>
          <div className="tr red">
            <a className="link red f6 mr2" href={`http://${ORG_URL}`}>
              {ORG_URL}
              <LinkIcon className="pl2 v-btm" style={{height: "15px"}}/>
            </a>
          </div>
        </div>
        <div className="mt3 mb2 ph2 dib w-100">
          <div className="cf fl mt1 dib">
            <Link to={'/'} className="link mv-1">
              <img src={logo} alt={`${ORG_NAME} logo`} className="ml2 v-mid pb2"
                style={{width: '54px'}}
              />
              <span className="barlow-condensed f3 fw6 ml2 blue-dark">
                Tasking Manager
              </span>
            </Link>
          </div>
          <nav className="dn dib-l pl4-l pl6-xl pt1 mt1">
            { this.renderMenuItems() }
          </nav>

          <div className="fr dib tr">
            { this.renderAuthenticationButtons() }
            <div className="dib v-mid dn-l">
              <Popup
                trigger={<BurgerMenu />}
                modal
                closeOnDocumentClick
                >
                <div>{ this.renderPopupItems() }</div>
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
  token: state.auth.get('token')
});

Header = connect(mapStateToProps, { logout })(Header);

export { Header , menuItems };

import React from 'react';
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import Popup from "reactjs-popup";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

import { ORG_URL, ORG_NAME, API_URL } from '../config';
import logo from '../assets/img/main-logo.svg';
import { Dropdown } from './dropdown';
import { Button } from './button';
import { BurgerMenu } from './burgerMenu';



class Header extends React.Component {
  menuItems = [
    {label: "Explore projects", link: "/projects"},
    {label: "How it works", link: "/learn"},
    {label: "About", link: "/about"},
    {label: "Help", link: "/help"}
  ];

  renderMenuItems() {
    const linkCombo = "link ph3 barlow-condensed blue-dark f4 ttu";
    return(
      <div className="v-mid">
        {this.menuItems.map((item, n) =>
          <Link to={item.link} key={n} className={ linkCombo }>
            {item.label}
          </Link>
        )}
      </div>
    );
  }

  renderPopupItems() {
    const linkCombo = "link ph3 barlow-condensed blue-dark f4 ttu";
    return(
      <div className="v-mid tc">
        {this.menuItems.map((item, n) =>
          <p key={n}>
            <Link to={item.link} className={ linkCombo }>
              {item.label}
            </Link>
          </p>
        )}
        <a href={`${API_URL}auth/login?redirect_to=/login/`} className="mh1 mv2 dib">
          <Button className="bg-red white">Log in</Button>
        </a>
        <Button className="bg-blue-dark white mh1 mv2 dib">Sign in</Button>
      </div>
    );
  }

  render() {
    return (
      <header className="w-100">
        <div className="cf ph2 bb b--grey-light red pt3 pb2">
          <div className="fl w-50">
            <span className="barlow-condensed f5 ml2 ">Mapping our world together</span>
          </div>
          <div className="tr">
            <a className="link red f6 mr2" href={`http://${ORG_URL}`}>
              {ORG_URL} <FontAwesomeIcon icon={faExternalLinkAlt} />
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
            <Dropdown
              onAdd={() => {}}
              onRemove={() => {}}
              onChange={() => {}}
              value={this.props.userPreferences.language || 'English'}
              options={[{label: 'English'}, {label: 'Portuguese (pt)'}]}
              display={this.props.userPreferences.language || 'Language'}
              className="blue-dark bg-white mr1 v-mid dn dib-66rem"
            />
            <a href={`${API_URL}auth/login?redirect_to=/login/`} className="mh1 v-mid dn dib-ns">
              <Button className="blue-dark bg-white">Log in</Button>
            </a>
            <Button className="bg-blue-dark white ml1 v-mid dn dib-ns">Sign in</Button>
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
  userPreferences: state.preferences
});

Header = connect(mapStateToProps)(Header);

export { Header };

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

import { ORG_URL, ORG_NAME } from '../config';
import logo from '../assets/img/main-logo.svg';
import { Dropdown } from './dropdown';
import { Button } from './button';


export class Header extends React.Component {
  render() {
    return (
      <header>
        <div className="grid-2 top-header mb-neg6 border-b border-b--2 border-b--lightgray">
          <div className="header-slogan">
            <span className="txt--red txt-m special-font ml24">Mapping our world together</span>
          </div>
          <div className="header-org-link">
            <a className="txt--red txt-m mr24" href={`http://${ORG_URL}`}>
              {ORG_URL} <FontAwesomeIcon icon={faExternalLinkAlt} />
          </a>
        </div>
      </div>
      <div className="grid-12 mt18 nav">
        <div className="header-brand align-middle">
          <img src={logo} alt={`${ORG_NAME} logo`} className="ml24 align-middle"
            style={{width: '54px'}}
            />
          <span className="tm-title ml12 txt--secondary align-middle special-font">
            Tasking Manager
          </span>
        </div>
        <nav className="header-menu special-font txt--secondary align-middle">
          <ul>
            <li>Explore projects</li>
            <li>How it works</li>
            <li>About</li>
            <li>Help</li>
          </ul>
        </nav>
        <div className="header-user btn-group btn-group--sidebyside align-r mr24">
          <Dropdown
            onAdd={() => {}}
            onRemove={() => {}}
            onChange={() => {}}
            value={'English'}
            options={[{label: 'English'}, {label: 'Portuguese (pt)'}]}
            display={'Language'}
            className="btn-tertiary"
            widthClass="w160"
          />
          <Button className="btn-tertiary">Log in</Button>
          <Button className="btn-secondary">Sign in</Button>
        </div>
      </div>
    </header>
    );
  }
}

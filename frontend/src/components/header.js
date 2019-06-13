import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

import { ORG_URL, ORG_NAME } from '../config';
import logo from '../assets/img/main-logo.svg';


export class Header extends React.Component {
  render() {
    return (
      <header className="grid-12">
          <div className="header-slogan mb-neg6 border-b border-b--2 border-b--lightgray">
            <span className="txt--red txt-m special-font ml24">Mapping our world together</span>
          </div>
          <div className="header-org-link mb-neg6 border-b border-b--2 border-b--lightgray">
              <a className="txt--red txt-m mr24" href={`http://${ORG_URL}`}>
                {ORG_URL} <FontAwesomeIcon icon={faExternalLinkAlt}/>
            </a>
          </div>
          <div className="header-brand align-middle mt18">
            <img src={logo} alt={`${ORG_NAME} logo`} className="ml24 align-middle"
              style={{width: '54px'}}
            />
            <span className="tm-title ml12 txt--darkest-grey align-middle special-font">
              Tasking Manager
            </span>
          </div>
          <nav className="header-menu mt18 special-font txt--darkest-grey">
            <ul>
              <li>Explore projects</li>
              <li>How it works</li>
              <li>About</li>
              <li>Help</li>
            </ul>
          </nav>
          <div className="header-user mt18">
            <button>Log in</button>
            <button>Sign in</button>
          </div>
      </header>
    );
  }
}

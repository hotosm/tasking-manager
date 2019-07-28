import React from 'react';
import { connect } from "react-redux";
import { Link, navigate } from "@reach/router";
import NavLink from '../header/NavLink'
import Popup from "reactjs-popup";
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { API_URL } from '../../config';
import { SearchIcon } from '../svgIcons';
import { Dropdown } from '../dropdown';
import { logout } from '../../store/actions/auth';

import cards from '../projectcard/demoProjectCardsData';
import { ProjectCard } from '../../components/projectcard/projectCard';

const navMenuItems = [
  {label: messages.projectTitle, link: "./"},
  {label: messages.campaign, link: "./moreFilters"},
  {label: messages.moreFilters, link: "./moreFilters"}
];

function MoreFilters() {
   return (
       <div className="absolute left-0 w-30 bg-blue-grey h6">Hello World</div>
   )
}

class ProjectNav extends React.Component {
  navMenuItems = navMenuItems;
  linkCombo = "link ph3 grey-light f6 pv2 mh2 ba b--grey-light";

  renderMenuItems() {
    return(
      <div className="v-mid  ">
        {this.navMenuItems.map((item, n) =>
          <NavLink to={item.link} key={n} className={ this.linkCombo }>
            <FormattedMessage {...item.label} />
          </NavLink>
        )}
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


  render() {
    return (
     <>
      <header className="bt bb b--tan  w-100 mb1 mb2-ns">
        <div className="mt2 mb1 ph2 dib w-100">
           <div className="fl dib tr">
            <div className="dib">
            <Dropdown
                onAdd={() => {}}
                onRemove={() => {}}
                onChange={() => {}}
                value={this.props.userPreferences.language || 'English'}
                options={[{label: <FormattedMessage {...messages.projectMapperLevelBEGINNER}/>},
                     {label: <FormattedMessage {...messages.projectMapperLevelINTERMEDIATE}/>},
                     {label: <FormattedMessage {...messages.projectMapperLevelADVANCED}/>}
                    ]}
                display={this.props.userPreferences.language || <FormattedMessage {...messages.mappingDifficulty}/>}
                className="ba b--grey-light blue-dark bg-white  v-mid dib"
            />
            <NavLink to="./moreFilters" className={this.linkCombo+" fr mt1"}>Sort By</NavLink>

            <nav className="fr relative"> {/* USE REACT DOWNSHIFT FOR AUTOCOMPLETE */}
                <SearchIcon className="absolute grey-light left-1 top-1"/>
                <input id="name" class=" input-reset ba b--grey-light pa2 db mt1" style={{'textIndent':"30px"}} type="text" aria-describedby="name-desc" />
            </nav>
          <nav className="dib pl4 pl6-xl ">
            { this.renderMenuItems() }
          </nav>
          </div>
          </div>         
            <div className="relative fr mt3 mr5 pv2 dib-l dn">

            <div class="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center bg-grey-dark">
                <div class="dib mr1 f6 blue-grey">
                  <FormattedMessage {...messages.showMapToggle}/>
                </div>
                <div class="relative dib">
                <input class="absolute z-5 w-100 h-100 o-0 pointer checkbox" type="checkbox" />
                <div class="relative z-4 dib w3 h2 bg-mid-gray overflow-hidden br4 v-mid bg-animate checkbox-wrapper">
                <div class="absolute right-auto left-0 w2 h2 br4 bg-white ba b-grey-light shadow-4 t-cb bg-animate checkbox-toggle"></div>
                </div>
                </div>
                </div>

            </div>
        </div>
      </header>
      {this.props.children}
      <p className="blue-grey ml2 f7">Showing x projects</p>
      <div className="cf">
          {cards.map((card, n) => <ProjectCard { ...card } key={n} />)}
        </div>
      </>
    );
  }
}

const mapStateToProps = state => ({
  userPreferences: state.preferences,
  username: state.auth.getIn(['userDetails', 'username']),
  token: state.auth.get('token')
});

ProjectNav = connect(mapStateToProps, { logout })(ProjectNav);

export { ProjectNav , navMenuItems, MoreFilters };

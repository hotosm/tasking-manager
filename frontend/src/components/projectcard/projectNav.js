import React from 'react';
import NavLink from '../header/NavLink'
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { API_URL } from '../../config';
import { SearchIcon } from '../svgIcons';
import { Dropdown } from '../dropdown';

import cards from '../projectcard/demoProjectCardsData';
import { ProjectCard } from '../../components/projectcard/projectCard';

import {
  stringify,
  useQueryParams,
  StringParam,
  NumberParam,
} from 'use-query-params';

import { CommaArrayParam } from '../../utils/CommaArrayParam'
 

function ShowMapToggle() {
  return (
    <div className="relative fr mt3 mr5 pv2 dib-l dn">

    <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center bg-grey-dark">
      <div className="dib mr1 f6 blue-grey">
        <FormattedMessage {...messages.showMapToggle} />
      </div>
      <div className="relative dib">
        <input className="absolute z-5 w-100 h-100 o-0 pointer checkbox" type="checkbox" />
        <div className="relative z-4 dib w3 h2 bg-mid-gray overflow-hidden br4 v-mid bg-animate checkbox-wrapper">
          <div className="absolute right-auto left-0 w2 h2 br4 bg-white ba b-grey-light shadow-4 t-cb bg-animate checkbox-toggle"></div>
        </div>
      </div>
    </div>

  </div>
  );
}

const RenderMenuItems = ({navMenuItems}: Object) => {
  const [query, setQuery] = useQueryParams({
    difficulty: StringParam,
    organization: StringParam,
    campaign: StringParam,
    types: CommaArrayParam,
    x: NumberParam,
    });
  const linkCombo = "link ph3 grey-light f6 pv2 mh2 ba b--grey-light";
  const encodedParams = stringify(query) ? "?"+stringify(query) : ""
  return (
    <div className="v-mid  ">
      {navMenuItems.map((item, n) =>
        <NavLink to={item.link+encodedParams} key={n} className={ linkCombo } replace={item.replace}>
          <FormattedMessage {...item.label} />
        </NavLink>
      )}
    </div>
  );
}


const PaginationsPageFlex = ({Data}: Object) => {
  const pagerStyle = "f5 items-center br2 justify-center no-underline  bg-animate hover-bg-blue-grey hover-white inline-flex items-center w2 h2 ba ma1 border-box";
  const activeStyle = "bg-blue-dark white"
  const inactiveStyle = "blue-grey"
return (
<div className="flex items-center justify-center pa4">
  <a href="#0" className={`${pagerStyle} ${activeStyle}`}>
    <span >1</span>
  </a>
  <a href="#0" className={`${inactiveStyle} ${pagerStyle} `}>
    <span >2</span>
  </a>
  <a href="#0" className={`${inactiveStyle} ${pagerStyle} `}>
    <span >…</span>
  </a>
  <a href="#0" className={`${inactiveStyle} ${pagerStyle} `}>
    <span >6</span>
  </a>
  <a href="#0" className={`${inactiveStyle} ${pagerStyle} `}>
    <span >7</span>
  </a>
</div>)
}


export const ProjectNav = props => {

  const linkCombo = "link ph3 grey-light f6 pv2 mh2 ba b--grey-light";
  const navMenuItems = [
    {label: messages.projectTitle, link: "/contribute", replace: false},
    {label: messages.campaign, link: "/contribute/moreFilters/"},
    {label: messages.moreFilters, link: "/contribute/moreFilters/"}
  ];
    return (
     <>
      <header className="bt bb b--tan  w-100 mb1 mb2-ns">
        <div className="mt2 mb1 ph2 dib w-100">
           <div className="fl dib tr">
            <div className="dib mt2">
            <Dropdown
                onAdd={() => {}}
                onRemove={() => {}}
                onChange={() => {}}
                value={'Beginner'}
                options={[{label: <FormattedMessage {...messages.projectMapperLevelBEGINNER}/>},
                     {label: <FormattedMessage {...messages.projectMapperLevelINTERMEDIATE}/>},
                     {label: <FormattedMessage {...messages.projectMapperLevelADVANCED}/>}
                    ]}
                display={ <FormattedMessage {...messages.mappingDifficulty}/>}
                className="ba b--grey-light pv1 blue-dark bg-white  v-mid dib"
            />
            <NavLink to="./moreFilters" className={linkCombo+" fr mt1"}>Sort By</NavLink>

            <nav className="fr relative"> {/* USE REACT DOWNSHIFT FOR AUTOCOMPLETE */}
                <SearchIcon className="absolute grey-light left-1 top-1"/>
                <input id="name" className=" input-reset ba b--grey-light pa2 db mt1" style={{'textIndent':"30px"}} type="text" aria-describedby="name-desc" />
            </nav>
          <nav className="dib pl4 pl6-xl ">
            <RenderMenuItems navMenuItems={navMenuItems} />
          </nav>
          </div>
          </div>         
           <ShowMapToggle />
        </div>
        {props.children}
      </header>
      
      <p className="blue-grey ml2 f7">Showing x projects</p>
      <div className="cf">
          {cards.map((card, n) => <ProjectCard { ...card } key={n} />)}
        </div>
      <PaginationsPageFlex/>
      </>
    );
}
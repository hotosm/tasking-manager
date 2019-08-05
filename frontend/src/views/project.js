import React from 'react';
import {ProjectNav} from '../components/projectcard/projectNav.js';

import { HomeIcon, RoadIcon, WavesIcon, TaskIcon, ChevronDownIcon  } from '../components/svgIcons';

export const ProjectsPage = props => {
  return (
    <div className="pt180 pull-center">
      <ProjectNav>
        {props.children}
      </ProjectNav>
    </div>
  );
}

export const ProjectsPageIndex = props => {
  return null;
}
export const MoreFilters = props => {
   const pagerStyle = "link br1 h2 w2 pa1 ma1 dib";
   const activeStyle = "b--red ba bw1";
   const inactiveStyle = "pb1";
   const titleStyle = "tc ttu fw5 blue-grey";
   const ShowAllCampaignsButton = props => (
    <button className="input-reset dim base-font bg-white button-reset f6 bn pn red">
    <span className="pr2 ttu f6">Show All Campaigns</span>
    <ChevronDownIcon className="pt2" />
    </button>
   )

   return (
     <>
       <div className="absolute left-0 z-1 mt1 w-40-l w-100 h-100 bg-white h4 pa3">
        <h5 className={titleStyle}>Types of Mapping</h5>
          <div className="tc ma2">
              <RoadIcon title="Roads" className={`${pagerStyle} ${activeStyle}`}/>
              <HomeIcon title="Buildings" className={`${pagerStyle} ${inactiveStyle}`} />
              <WavesIcon title="Waterways" className={`${pagerStyle} ${inactiveStyle}`} />
              <TaskIcon title="Land use" className={`${pagerStyle} ${inactiveStyle}`}/>
          </div>

        <h5 className={titleStyle}>Campaigns</h5>
        <ShowAllCampaignsButton />
        <h5 className={titleStyle}>Location</h5>
        <ShowAllCampaignsButton /> 
          {props.children}
         </div>
       <div className="absolute right-0 z-1 br w-60-l w-0 h-100 bg-blue-dark o-90 h6">

       </div>
       </>
   )
}

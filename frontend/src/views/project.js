import React from 'react';
import {ProjectNav} from '../components/projectcard/projectNav.js';

import { HomeIcon, RoadIcon, WavesIcon, TaskIcon  } from '../components/svgIcons';

export const ProjectsPage = props => {
    return(
      <div className="pt180 pull-center">
        <ProjectNav/> 
          {props.children}
          </div>
    );
}

export const ProjectsPageIndex = props => {
  return(
    <div className="">
        x{props.children}x
        This is the Explore Projects page
        </div>
  );
}
export const MoreFilters = props => {
   const pagerStyle = "link fl ph2 blue-grey br2 f6 pv2 mh1 ba b--blue-grey";
   const activeStyle = "bg-blue-dark grey-light";

        //Mockup for styling
   return (
       <div className="absolute left-0 top-0 w-20 h-100 bg-white h6">
        <h5 className="tc">Types of Mapping</h5>
          <div className="db ma2 cf">
            <div className={`${pagerStyle} ${activeStyle}`}>
              <RoadIcon />
            </div>
            <div className={pagerStyle}>
              <HomeIcon />
            </div>
            <div className={pagerStyle}>
              <WavesIcon />
            </div>
            <div className={pagerStyle}>
              <TaskIcon/>
            </div>
          </div>

        <h5 className="tc">Campaigns</h5>
        <h5 className="tc">Location</h5>
         
          {props.children}
         </div>
       
   )
}

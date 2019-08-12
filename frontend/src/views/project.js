import React  from 'react';
import {ProjectNav} from '../components/projectcard/projectNav';
import { MoreFiltersForm } from '../components/projectcard/moreFiltersForm';
import { useFullProjectsQuery } from '../hooks/UseFullProjectFilterQueryParams'
import {
  stringify
} from 'use-query-params';

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
   const [fullProjectsQuery] = useFullProjectsQuery();
  
   /* These two divs define the More Filters page. */
   /* z-2 is needed because the progress bar hide-child hover popups are z-1.  */
   const leftpanelDivStyle = "absolute left-0 z-2 mt1 w-40-l w-100 h-100 bg-white h4 pa3";
   const rightpanelShadowDivStyle = "absolute right-0 z-2 br w-60-l w-0 h-100 bg-blue-dark o-90 h6";

   return (
      <>
      <div className={leftpanelDivStyle}>
        <MoreFiltersForm />
        {props.children}
      </div>

       <div 
        onClick={() => props.navigate(`/contribute?${stringify(fullProjectsQuery)}`)}
        className={rightpanelShadowDivStyle}>
       </div>
       </>
   )
}

import React from 'react';
import 'react-placeholder/lib/reactPlaceholder.css';
import { ProjectCard } from '../projectCard/projectCard';
import {
  useProjectsQueryAPI,
  useExploreProjectsQueryParams,
  stringify,
} from '../../hooks/UseProjectsQueryAPI';
import useForceUpdate from '../../hooks/UseForceUpdate';

import Carousel from "react-multi-carousel";      //this is redefined carousel
import "react-multi-carousel/lib/styles.css";
import "./cardshow.css";



const responsive = {
  superLargeDesktop: {
    // the naming can be any, depends on you.
    breakpoint: { max: 4000, min: 3000 },
    items: 5
  },
  desktop: {
    breakpoint: { max: 3000, min: 1500 },
    items: 5
  },
  middesktop:{
    breakpoint: { max: 1500, min: 1200 },
    items: 4
  },
  smalldesktop:{
    breakpoint: { max: 1200, min: 900 },
    items: 3
  },
  tablet: {
    breakpoint: { max: 900, min: 600 },
    items: 2
  },
  mobile: {
    breakpoint: { max: 600, min: 0 },
    items: 1
  }
};

export const ProjectToShow = (props) => {
  const initialData = {
    mapResults: {
      features: [],
      type: 'FeatureCollection',
    },
    results: [],
    pagination: { hasNext: false, hasPrev: false, page: 1 },
  };

  const [fullProjectsQuery, setProjectQuery] = useExploreProjectsQueryParams();
  const [forceUpdated, forceUpdate] = useForceUpdate();
  const [state] = useProjectsQueryAPI(initialData, fullProjectsQuery, forceUpdated);
  {console.log(state.projects)};

 return(
  <div className="projectCards">
  <ExploreProjectCards
              pageOfCards={state.projects}
              cardWidthClass="w-third-l"
              showBottomButtons={false}
            />
  </div>
 );
}

const ExploreProjectCards = (props) => {
  if (props.pageOfCards && props.pageOfCards.length === 0) {
    return null;
  }
  //  console.log(props.pageOfCards);
  return( 
    <Carousel responsive={responsive} 
  centerMode={false}> 
    {props.pageOfCards.map((card, n) => (<div className="cards">
    <ProjectCard
      cardWidthClass={props.cardWidthClass}
      {...card}
      key={n}
      showBottomButtons={props.showBottomButtons}
    />
  </div>))}
  {props.pageOfCards.map((card, n) => (<div className="cards">
    <ProjectCard
      cardWidthClass={props.cardWidthClass}
      {...card}
      key={n}
      showBottomButtons={props.showBottomButtons}
    />
  </div>))}
  {props.pageOfCards.map((card, n) => (<div className="cards">
    <ProjectCard
      cardWidthClass={props.cardWidthClass}
      {...card}
      key={n}
      showBottomButtons={props.showBottomButtons}
    />
  </div>))}
  </Carousel>
  )
};
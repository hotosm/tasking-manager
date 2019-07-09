import React from 'react';

import { Jumbotron, SecondaryJumbotron } from '../components/homepage/jumbotron';
import { StatsSection } from '../components/homepage/stats';
import { MappingFlow } from '../components/homepage/mappingFlow';


export class Home extends React.Component {
  render() {
    return(
      <div className="pull-center">
        <Jumbotron />
        <StatsSection />
        <MappingFlow />
        <SecondaryJumbotron />
      </div>
    );
  }
}

import React from 'react';

import { Jumbotron } from '../components/homepage/jumbotron';
import { StatsSection } from '../components/homepage/stats';


export class Home extends React.Component {
  render() {
    return(
      <div className="pull-center">
        <Jumbotron />
        <StatsSection />
      </div>
    );
  }
}

import React from 'react';
import {ProjectNav} from '../components/projectcard/projectNav.js';

export class ProjectPage extends React.Component {
  render() {
    return(
      <div className="pt180 pull-center">
          <ProjectNav/>
          This is the Explore Projects page
          </div>
    );
  }
}

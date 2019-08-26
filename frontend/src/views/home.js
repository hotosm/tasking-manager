import React from 'react';

import { Jumbotron, SecondaryJumbotron } from '../components/homepage/jumbotron';
import { StatsSection } from '../components/homepage/stats';
import { MappingFlow } from '../components/homepage/mappingFlow';
import { WhoIsMapping } from '../components/homepage/whoIsMapping';
import { Testimonials } from '../components/homepage/testimonials/index';
import { FeaturedProjects } from '../components/homepage/featuredProjects';
import { MATOMO_ID } from '../config';

export class Home extends React.Component {
  componentDidMount() {
    if (MATOMO_ID != '') {
      const s = document.createElement('script');
      s.type = 'text/javascript';
      s.async = true;
      s.innerHTML = "var site_id = { MATOMO_ID };";
      document.body.appendChild(s);

      const s2 = document.createElement('script');
      s2.src = "https://cdn.hotosm.org/tracking-v3.js";
      s2.async = true;
      document.body.appendChild(s2);
    }
    
  }

  render() {
    return(
      <div className="pull-center">
        <Jumbotron />
        <StatsSection />
        <MappingFlow />
        <FeaturedProjects />
        <WhoIsMapping />
        <Testimonials />
        <SecondaryJumbotron />
      </div>
    );
  }
}

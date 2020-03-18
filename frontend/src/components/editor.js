import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import * as iD from '@hotosm/id/dist/index';
import '@hotosm/id/dist/iD.css';

import { OSM_CONSUMER_KEY, OSM_CONSUMER_SECRET } from '../config';

export default function Editor() {
  const session = useSelector(state => state.auth.get('session'));
  useEffect(() => {
    if (session && window && iD) {
      let idContext = window.iD.coreContext();
      idContext.embed(true).assetPath('/static/');
      idContext.init();

      let osm = idContext.connection();
      const auth = {
        urlroot: 'https://www.openstreetmap.org',
        oauth_consumer_key: OSM_CONSUMER_KEY,
        oauth_secret: OSM_CONSUMER_SECRET,
        oauth_token: session.osm_oauth_token,
        oauth_token_secret: session.osm_oauth_token_secret,
      };
      osm.switch(auth);

      idContext.ui()(document.getElementById('id-container'), function() {
        idContext
          .container()
          .select('#about-list')
          .insert('li', '.user-list')
          .attr('class', 'source-switch');
      });
    }
  }, [session]);

  return <div style={{ height: '1000px' }} id="id-container"></div>;
}

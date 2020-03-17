import React, { useEffect } from 'react';
import * as iD from 'id/dist/index';
import 'id/dist/iD.css';

import { OSM_CONSUMER_KEY, OSM_CONSUMER_SECRET } from '../config';

export default function Editor() {
  useEffect(() => {
    if (window && iD) {
      let idContext = window.iD.coreContext();
      idContext.embed(true).assetPath('/static/');
      idContext.init();

      let osm = idContext.connection();
      const auth = {
        urlroot: 'https://www.openstreetmap.org',
        oauth_consumer_key: 'i8tL0Au8a2BDPCqypVpiHIOKgQhnjmEBQiB2Fz2d',
        oauth_secret: 'enqogy2opGrx981i3UquvXeuqtE9tUdkeaS7khLb',
        oauth_token: '1lRWVsYKr11DIJTRnB3wXROlBqrqMFtnwBk0VpIX',
        oauth_token_secret: 'Xfsx63wlDNoFibKy13XMssnrUa9fg1iDeLH5rUJ8',
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
  }, []);

  return <div style={{ height: '1000px' }} id="id-container"></div>;
}

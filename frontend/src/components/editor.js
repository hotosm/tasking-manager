import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import * as iD from '@hotosm/id/dist/index';
import '@hotosm/id/dist/iD.css';

import { OSM_CONSUMER_KEY, OSM_CONSUMER_SECRET } from '../config';

export default function Editor({ editorRef, setEditorRef, setDisable }) {
  const session = useSelector(state => state.auth.get('session'));

  useEffect(() => {
    setEditorRef(window.iD.coreContext());
  }, [setEditorRef]);

  useEffect(() => {
    if (session && window && iD && editorRef) {
      editorRef.embed(true).assetPath('/static/');
      editorRef.init();

      let osm = editorRef.connection();
      const auth = {
        urlroot: 'https://www.openstreetmap.org',
        oauth_consumer_key: OSM_CONSUMER_KEY,
        oauth_secret: OSM_CONSUMER_SECRET,
        oauth_token: session.osm_oauth_token,
        oauth_token_secret: session.osm_oauth_token_secret,
      };
      osm.switch(auth);

      editorRef.ui()(document.getElementById('id-container'), function() {
        editorRef
          .container()
          .select('#about-list')
          .insert('li', '.user-list')
          .attr('class', 'source-switch');
      });

      editorRef.history().on('change', () => {
        setDisable(true);
      });
    }
  }, [session, editorRef, setDisable]);

  return <div style={{ height: '1000px' }} id="id-container"></div>;
}

import React, { useLayoutEffect } from 'react';
import { useSelector } from 'react-redux';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxLanguage from '@mapbox/mapbox-gl-language';

import { MAPBOX_TOKEN, MAP_STYLE, MAPBOX_RTL_PLUGIN_URL } from '../../config';

mapboxgl.accessToken = MAPBOX_TOKEN;
try {
  mapboxgl.setRTLTextPlugin(MAPBOX_RTL_PLUGIN_URL);
} catch {
  console.log('RTLTextPlugin is loaded');
}

const ProjectCreationMap = ({ mapObj, setMapObj, metadata, updateMetadata }) => {
  const mapRef = React.createRef();
  const locale = useSelector(state => state.preferences['locale']);

  useLayoutEffect(() => {
    setMapObj({
      ...mapObj,
      map: new mapboxgl.Map({
        container: mapRef.current,
        style: MAP_STYLE,
        zoom: 0,
        attributionControl: false,
      })
        .addControl(new mapboxgl.AttributionControl({ compact: false }))
        .addControl(new MapboxLanguage({ defaultLanguage: locale.substr(0, 2) || 'en' })),
    });

    return () => {
      mapObj.map && mapObj.map.remove();
    };
    // eslint-disable-next-line
  }, []);

  useLayoutEffect(() => {
    if (mapObj.map !== null) {
      mapObj.map.on('load', () => {
        mapObj.map.addControl(new mapboxgl.NavigationControl());
        mapObj.map.addControl(mapObj.draw);
      });

      // Remove area and geometry when aoi is deleted.
      mapObj.map.on('draw.delete', event => {
        updateMetadata({ ...metadata, geom: null, area: 0 });
      });
    }
  }, [mapObj, metadata, updateMetadata]);

  return <div id="map" className="vh-50 h-100-l w-100" ref={mapRef}></div>;
};

export { ProjectCreationMap };

import React, { useLayoutEffect } from 'react';
import mapboxgl from 'mapbox-gl';

import { fallbackRasterStyle } from '../projects/projectsMap';
import { MAPBOX_TOKEN } from '../../config';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = MAPBOX_TOKEN;

const ProjectCreationMap = ({ mapObj, setMapObj, metadata, updateMetadata }) => {
  const mapRef = React.createRef();

  useLayoutEffect(() => {
    setMapObj({
      ...mapObj,
      map: new mapboxgl.Map({
        container: mapRef.current,
        // style: 'mapbox://styles/mapbox/bright-v9',
        style: MAPBOX_TOKEN ? 'mapbox://styles/mapbox/streets-v11' : fallbackRasterStyle,
        zoom: 0,
        attributionControl: false,
      }).addControl(new mapboxgl.AttributionControl({ compact: false })),
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

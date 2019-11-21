import React, { useLayoutEffect } from 'react';
import { fallbackRasterStyle } from '../projects/projectsMap';
import mapboxgl from 'mapbox-gl';
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
      }),
    });

    return () => {
      mapObj.map && mapObj.map.remove();
    };
    // eslint-disable-next-line
  }, []);

  useLayoutEffect(() => {
    if (mapObj.map !== null) {
      mapObj.map.on('load', () => {
        mapObj.map.addControl(mapObj.draw);
      });

      // Remove area and geometry when aoi is deleted.
      mapObj.map.on('draw.delete', event => {
        updateMetadata({ ...metadata, geom: null, area: 0 });
      });
    }
  }, [mapObj, metadata, updateMetadata]);

  return <div id="map" className="w-70 vh-75-l" ref={mapRef}></div>;
};

export { ProjectCreationMap };

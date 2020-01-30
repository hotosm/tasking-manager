import React, { useLayoutEffect, useState } from 'react';
import { navigate } from '@reach/router';
import mapboxgl from 'mapbox-gl';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { MAPBOX_TOKEN, MAP_STYLE, MAPBOX_RTL_PLUGIN_URL } from '../../config';
import { mapboxLayerDefn } from '../projects/projectsMap';
import { ListElements } from './topProjects';

mapboxgl.accessToken = MAPBOX_TOKEN;
try {
  mapboxgl.setRTLTextPlugin(MAPBOX_RTL_PLUGIN_URL);
} catch {
  console.log('RTLTextPlugin is loaded');
}

const UserCountriesMap = ({ projects }) => {
  const geojson = {
    type: 'FeatureCollection',
    features: projects.mappedProjects.map(f => {
      return { type: 'Feature', geometry: f.centroid, properties: { projectId: f.projectId } };
    }),
  };

  const [map, setMap] = useState(null);

  const mapRef = React.createRef();

  useLayoutEffect(() => {
    if (map === null) {
      setMap(
        new mapboxgl.Map({
          container: mapRef.current,
          style: MAP_STYLE,
          zoom: 0,
        }),
      );
    } else {
      map.resize(); //https://docs.mapbox.com/help/troubleshooting/blank-tiles/
      map.on('load', () => mapboxLayerDefn(map, geojson, id => navigate(`/projects/${id}/`)));
    }
    return () => {
      map && map.remove();
    };
  }, [map, mapRef, geojson]);

  return <div id="map" className="w-70" ref={mapRef}></div>;
};

export const CountriesMapped = ({ user }) => {
  const projects = user.projects.read();
  const stats = user.stats.read();

  const countries = stats.countriesContributed.countries.slice(0, 5);
  const tasksNo = countries.map(c => c.total);
  const maxTaskNo = Math.max(...tasksNo);

  const countriesPercent = countries.map(c => {
    return { ...c, percent: c.total / maxTaskNo };
  });

  return (
    <div className="bg-white blue-dark shadow-4 flex items-stretch">
      <div style={{ height: '25rem' }} className="w-33-l pb3 pt2 ph3">
        <h3 className="f4 mt0 fw6 pt3">
          <FormattedMessage {...messages.topCountriesTitle} />
        </h3>
        <ListElements data={countriesPercent} valueField={'total'} nameField={'name'} />
      </div>
      <UserCountriesMap projects={projects} />
    </div>
  );
};

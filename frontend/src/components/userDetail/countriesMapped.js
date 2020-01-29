import React, { useLayoutEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN, MAP_STYLE, MAPBOX_RTL_PLUGIN_URL } from '../../config';
import { mapboxLayerDefn } from '../projects/projectsMap';
import { ListElements } from './topProjects';
import { navigate } from '@reach/router';
import { FormattedMessage } from 'react-intl';
import messages from './messages';

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

  return (
    <div className="bg-white shadow-4 flex items-stretch">
      <div style={{ height: '25rem' }} className="w-30 mr3 pv3 pl3">
        <h3 className="f4 blue-dark mt0 fw6 pt3">
          <FormattedMessage {...messages.topCountriesTitle} />
        </h3>
        <ListElements
          data={stats.countriesContributed.countries.slice(0, 5)}
          valueField={'total'}
          nameField={'name'}
          barWidth={true}
        />
      </div>
      <UserCountriesMap projects={projects} />
    </div>
  );
};

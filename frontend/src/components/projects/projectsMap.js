import { createRef, useLayoutEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxLanguage from '@mapbox/mapbox-gl-language';

import WebglUnsupported from '../webglUnsupported';
import { MAPBOX_TOKEN, MAP_STYLE, MAPBOX_RTL_PLUGIN_URL } from '../../config';
import mapMarker from '../../assets/img/mapMarker.png';

let markerIcon = new Image(17, 20);
markerIcon.src = mapMarker;

mapboxgl.accessToken = MAPBOX_TOKEN;
try {
  mapboxgl.setRTLTextPlugin(MAPBOX_RTL_PLUGIN_URL);
} catch {
  console.log('RTLTextPlugin is loaded');
}

const licensedFonts = MAPBOX_TOKEN
  ? ['DIN Offc Pro Medium', 'Arial Unicode MS Bold']
  : ['Open Sans Semibold'];

export const mapboxLayerDefn = (map, mapResults, clickOnProjectID, disablePoiClick = false) => {
  map.addImage('mapMarker', markerIcon, { width: 15, height: 15, data: markerIcon });
  map.addSource('projects', {
    type: 'geojson',
    data: mapResults,
    cluster: true,
    clusterRadius: 35,
  });

  map.addLayer({
    id: 'projectsClusters',
    filter: ['has', 'point_count'],
    type: 'circle',
    source: 'projects',
    layout: {},
    paint: {
      'circle-color': 'rgba(104,112,127,0.5)',
      'circle-radius': ['step', ['get', 'point_count'], 14, 10, 22, 50, 30, 500, 37],
    },
  });

  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'projects',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': licensedFonts,
      'text-size': 16,
    },
    paint: {
      'text-color': '#FFF',
      'text-halo-width': 10,
      'text-halo-blur': 1,
    },
  });

  map.addLayer({
    id: 'projects-unclustered-points',
    type: 'symbol',
    source: 'projects',
    filter: ['!', ['has', 'point_count']],
    layout: {
      'icon-image': 'mapMarker',
      'text-field': '#{projectId}',
      'text-font': licensedFonts,
      'text-offset': [0, 0.6],
      'text-anchor': 'top',
    },
    paint: {
      'text-color': '#2c3038',
      'text-halo-width': 1,
      'text-halo-color': '#fff',
    },
  });
  map.on('mouseenter', 'projects-unclustered-points', function (e) {
    // Change the cursor style as a UI indicator.
    if (!disablePoiClick) {
      map.getCanvas().style.cursor = 'pointer';
    }
  });
  map.on('mouseleave', 'projects-unclustered-points', function (e) {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = '';
  });

  map.on('click', 'projects-unclustered-points', (e) => {
    const value = e.features && e.features[0].properties && e.features[0].properties.projectId;
    clickOnProjectID(value);
  });
};

export const ProjectsMap = ({ mapResults, fullProjectsQuery, setQuery, className }) => {
  const mapRef = createRef();
  const locale = useSelector((state) => state.preferences['locale']);
  const [map, setMapObj] = useState(null);

  const clickOnProjectID = useCallback(
    (projectIdSearch) =>
      setQuery(
        {
          ...fullProjectsQuery,
          page: undefined,
          text: ['#', projectIdSearch].join(''),
        },
        'pushIn',
      ),
    [fullProjectsQuery, setQuery],
  );

  useLayoutEffect(() => {
    /* May be able to refactor this to just take
     * advantage of useRef instead inside other useLayoutEffect() */

    /* List of non-mapbox Glyph names is at
     https://github.com/openmaptiles/fonts/tree/gh-pages/Open%20Sans%20Regular */

    /* I referenced this initially https://philipprost.com/how-to-use-mapbox-gl-with-react-functional-component/ */
    mapboxgl.supported() &&
      setMapObj(
        new mapboxgl.Map({
          container: mapRef.current,
          style: MAP_STYLE,
          center: [0, 0],
          zoom: 0.5,
          attributionControl: false,
        })
          .addControl(new mapboxgl.AttributionControl({ compact: false }))
          .addControl(new MapboxLanguage({ defaultLanguage: locale.substr(0, 2) || 'en' })),
      );

    return () => {
      map && map.remove();
    };
    // eslint-disable-next-line
  }, []);

  useLayoutEffect(() => {
    /* docs: https://docs.mapbox.com/mapbox-gl-js/example/cluster/ */

    const someResultsReady = mapResults && mapResults.features && mapResults.features.length > 0;

    const mapReadyProjectsReady =
      map !== null &&
      map.isStyleLoaded() &&
      map.getSource('projects') === undefined &&
      someResultsReady;
    const projectsReadyMapLoading =
      map !== null &&
      !map.isStyleLoaded() &&
      map.getSource('projects') === undefined &&
      someResultsReady;

    /* set up style/sources for the map, either immediately or on base load */
    if (mapReadyProjectsReady) {
      mapboxLayerDefn(map, mapResults, clickOnProjectID);
    } else if (projectsReadyMapLoading) {
      map.on('load', () => mapboxLayerDefn(map, mapResults, clickOnProjectID));
    }

    /* refill the source on mapResults changes */
    if (map !== null && map.getSource('projects') !== undefined && someResultsReady) {
      map.getSource('projects').setData(mapResults);
    }
  }, [map, mapResults, clickOnProjectID]);

  if (!mapboxgl.supported()) {
    return <WebglUnsupported className={`h-100 w-100  ${className || ''}`} />;
  } else {
    return <div id="map" className={`h-100 w-100 ${className || ''}`} ref={mapRef}></div>;
  }
};

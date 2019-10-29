import React, { useLayoutEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN } from '../../config';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = MAPBOX_TOKEN;

export const fallbackRasterStyle = {
  version: 8,
  // "glyphs": "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    'raster-tiles': {
      type: 'raster',
      tiles: ['https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'],
      tileSize: 128,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright/">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'simple-tiles',
      type: 'raster',
      source: 'raster-tiles',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

export const ProjectsMap = ({
  state,
  state: { mapResults },
  fullProjectsQuery,
  setQuery,
  className,
}) => {
  const mapRef = React.createRef();
  const [map, setMapObj] = useState(null);

  const clickOnProjectID = useCallback(
    projectIdSearch =>
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
    setMapObj(
      new mapboxgl.Map({
        container: mapRef.current,
        style: MAPBOX_TOKEN ? 'mapbox://styles/mapbox/bright-v9' : fallbackRasterStyle,
        zoom: 0,
      }),
    );

    return () => {
      map && map.remove();
    };
    // eslint-disable-next-line
  }, []);

  useLayoutEffect(() => {
    const licensedFonts = MAPBOX_TOKEN
      ? ['DIN Offc Pro Medium', 'Arial Unicode MS Bold']
      : ['Open Sans Semibold'];
    /* docs: https://docs.mapbox.com/mapbox-gl-js/example/cluster/ */
    const mapboxLayerDefn = () => {
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
          'icon-image': 'marker-15',
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
      map.on('mouseenter', 'projects-unclustered-points', function(e) {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'projects-unclustered-points', function(e) {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = '';
      });

      map.on('click', 'projects-unclustered-points', e => {
        const value = e.features && e.features[0].properties && e.features[0].properties.projectId;
        clickOnProjectID(value);
      });
    };

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
      mapboxLayerDefn();
    } else if (projectsReadyMapLoading) {
      map.on('load', mapboxLayerDefn);
    }

    /* refill the source on mapResults changes */
    if (map !== null && map.getSource('projects') !== undefined && someResultsReady) {
      map.getSource('projects').setData(mapResults);
    }
  }, [map, mapResults, clickOnProjectID]);

  return <div id="map" className={`vh-75-l vh-50 fr ${className}`} ref={mapRef}></div>;
};

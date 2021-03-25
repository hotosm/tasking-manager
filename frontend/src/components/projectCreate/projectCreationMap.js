import React, { useLayoutEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { featureCollection } from '@turf/helpers';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

import {
  MAPBOX_TOKEN,
  BASEMAP_OPTIONS,
  MAP_STYLE,
  CHART_COLOURS,
  MAPBOX_RTL_PLUGIN_URL,
} from '../../config';
import { useDropzone } from 'react-dropzone';

mapboxgl.accessToken = MAPBOX_TOKEN;
try {
  mapboxgl.setRTLTextPlugin(MAPBOX_RTL_PLUGIN_URL);
} catch {
  console.log('RTLTextPlugin is loaded');
}

const BasemapMenu = ({ map }) => {
  // Remove elements that require mapbox token;
  let styles = BASEMAP_OPTIONS;
  if (!MAPBOX_TOKEN) {
    styles = BASEMAP_OPTIONS.filter((s) => typeof s.value === 'object');
  }

  const [basemap, setBasemap] = useState(styles[0].label);

  const handleClick = (style) => {
    let styleValue = style.value;

    if (typeof style.value === 'string') {
      styleValue = 'mapbox://styles/mapbox/' + style.value;
    }
    map.setStyle(styleValue);
    setBasemap(style.label);
  };

  return (
    <div className="bg-white blue-dark flex mt2 ml2 f7 br1 shadow-1">
      {styles.map((style, k) => {
        return (
          <div
            key={k}
            onClick={() => handleClick(style)}
            className={`ttc pv2 ph3 pointer link + ${
              basemap === style.label ? 'bg-grey-light fw6' : ''
            }`}
          >
            {style.label}
          </div>
        );
      })}
    </div>
  );
};

const ProjectCreationMap = ({ mapObj, setMapObj, metadata, updateMetadata, step, uploadFile }) => {
  const mapRef = React.createRef();
  const locale = useSelector((state) => state.preferences['locale']);
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: step === 1 ? uploadFile : () => {}, // drag&drop is activated only on the first step
    noClick: true,
    noKeyboard: true,
  });

  useLayoutEffect(() => {
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: MAP_STYLE,
      center: [0, 0],
      zoom: 1.3,
      attributionControl: false,
    })
      .addControl(new mapboxgl.AttributionControl({ compact: false }))
      .addControl(new MapboxLanguage({ defaultLanguage: locale.substr(0, 2) || 'en' }))
      .addControl(new mapboxgl.ScaleControl({ unit: 'metric' }));
    if (MAPBOX_TOKEN) {
      map.addControl(
        new MapboxGeocoder({
          accessToken: MAPBOX_TOKEN,
          mapboxgl: mapboxgl,
          marker: false,
          collapsed: true,
          language: locale.substr(0, 2) || 'en',
        }),
        'top-right',
      );
    }

    setMapObj({ ...mapObj, map: map });
    return () => {
      mapObj.map && mapObj.map.remove();
    };
    // eslint-disable-next-line
  }, []);

  const addMapLayers = (map) => {
    if (map.getSource('aoi') === undefined) {
      map.addSource('aoi', {
        type: 'geojson',
        data: featureCollection([]),
      });
      map.addLayer({
        id: 'aoi',
        type: 'fill',
        source: 'aoi',
        paint: {
          'fill-color': CHART_COLOURS.orange,
          'fill-outline-color': '#929db3',
          'fill-opacity': 0.3,
        },
      });
    }

    if (map.getSource('grid') === undefined) {
      map.addSource('grid', {
        type: 'geojson',
        data: featureCollection([]),
      });
      map.addLayer({
        id: 'grid',
        type: 'fill',
        source: 'grid',
        paint: {
          'fill-color': '#68707f',
          'fill-outline-color': '#00f',
          'fill-opacity': 0.3,
        },
      });
    }

    if (map.getSource('tiny-tasks') === undefined) {
      map.addSource('tiny-tasks', {
        type: 'geojson',
        data: featureCollection([]),
      });
      map.addLayer({
        id: 'tiny-tasks',
        type: 'fill',
        source: 'tiny-tasks',
        paint: {
          'fill-color': '#f0f',
          'fill-outline-color': '#f0f',
          'fill-opacity': 0.3,
        },
      });
    }
  };

  useLayoutEffect(() => {
    if (mapObj.map !== null) {
      mapObj.map.on('load', () => {
        mapObj.map.addControl(new mapboxgl.NavigationControl());
        mapObj.map.addControl(mapObj.draw);
        addMapLayers(mapObj.map);
      });

      // Remove area and geometry when aoi is deleted.
      mapObj.map.on('draw.delete', (event) => {
        updateMetadata({ ...metadata, geom: null, area: 0 });
      });

      mapObj.map.on('style.load', (event) => {
        if (!MAPBOX_TOKEN) {
          return;
        }
        addMapLayers(mapObj.map);
        const features = mapObj.draw.getAll();
        if (features.features.length === 0 && mapObj.map.getSource('aoi') !== undefined) {
          mapObj.map.getSource('aoi').setData(metadata.geom);
        }

        if (metadata.taskGrid && step !== 1 && mapObj.map.getSource('grid') !== undefined) {
          mapObj.map.getSource('grid').setData(metadata.taskGrid);
        } else {
          mapObj.map.getSource('grid') &&
            mapObj.map.getSource('grid').setData(featureCollection([]));
        }
      });
    }
  }, [mapObj, metadata, updateMetadata, step]);

  return (
    <div className="w-100 h-100-l relative" {...getRootProps()}>
      <div className="absolute top-0 right-0 z-5 mr2">
        <BasemapMenu map={mapObj.map} />
        <input style={{ display: 'null' }} {...getInputProps()} />
      </div>
      <div id="project-creation-map" className="vh-50 h-100-l w-100" ref={mapRef}></div>
    </div>
  );
};

export default ProjectCreationMap;

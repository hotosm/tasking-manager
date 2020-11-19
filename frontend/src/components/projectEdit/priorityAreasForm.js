import React, { useState, useContext, useLayoutEffect } from 'react';
import { useSelector } from 'react-redux';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import DrawRectangle from 'mapbox-gl-draw-rectangle-mode';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { StateContext, styleClasses } from '../../views/projectEdit';
import { Button } from '../button';
import { MAPBOX_TOKEN, MAP_STYLE, MAPBOX_RTL_PLUGIN_URL } from '../../config';

mapboxgl.accessToken = MAPBOX_TOKEN;
try {
  mapboxgl.setRTLTextPlugin(MAPBOX_RTL_PLUGIN_URL);
} catch {
  console.log('RTLTextPlugin is loaded');
}

export const PriorityAreasForm = () => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);
  const mapRef = React.createRef();
  const locale = useSelector((state) => state.preferences['locale']);
  const [map, setMap] = useState(null);
  const [activeMode, setActiveMode] = useState('draw_polygon');

  const modes = MapboxDraw.modes;
  modes.draw_rectangle = DrawRectangle;

  const draw = useState(
    new MapboxDraw({
      displayControlsDefault: false,
      modes: modes,
      styles: [
        {
          id: 'gl-draw-polygon-fill-inactive',
          type: 'fill',
          paint: {
            'fill-color': '#00004d',
            'fill-opacity': 0.6,
          },
        },
      ],
    }),
  );

  useLayoutEffect(() => {
    setMap(
      new mapboxgl.Map({
        container: mapRef.current,
        style: MAP_STYLE,
        center: [0, 0],
        zoom: 1,
        attributionControl: false,
      })
        .addControl(new mapboxgl.AttributionControl({ compact: false }))
        .addControl(new MapboxLanguage({ defaultLanguage: locale.substr(0, 2) || 'en' }))
        .addControl(new mapboxgl.NavigationControl()),
    );

    return () => {
      map && map.remove();
    };
    // eslint-disable-next-line
  }, []);

  useLayoutEffect(() => {
    if (map !== null) {
      map.getCanvas().style.cursor = 'crosshair';
      map.on('load', () => {
        let priorityAreas = projectInfo.priorityAreas;
        if (priorityAreas === null) {
          priorityAreas = [];
        }

        // update As features
        const drawPriorityAreas = priorityAreas.map((a) => ({
          type: 'Feature',
          properties: {},
          geometry: a,
        }));

        map.addControl(draw[0]);
        draw[0].changeMode('draw_polygon');
        map.addSource('aoi', {
          type: 'geojson',
          data: projectInfo.areaOfInterest,
        });

        map.addLayer({
          id: 'aoi',
          source: 'aoi',
          type: 'fill',
          paint: {
            'fill-color': '#00004d',
            'fill-opacity': 0.2,
          },
        });

        map.fitBounds(projectInfo.aoiBBOX, { duration: 0, padding: 100 });

        // Render priority areas.
        map.addSource('priority_areas', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: drawPriorityAreas },
        });

        map.addLayer({
          id: 'priority_areas',
          source: 'priority_areas',
          type: 'fill',
          paint: {
            'fill-color': '#00004d',
            'fill-opacity': 0.4,
          },
        });

        map.on('draw.create', (e) => {
          priorityAreas.push(e.features[0].geometry);
          setProjectInfo({ ...projectInfo, priorityAreas: priorityAreas });
        });
      });
    }
  }, [map, draw, projectInfo, setProjectInfo]);

  const clearAll = (e) => {
    draw[0].deleteAll();
    map.removeLayer('priority_areas');
    map.removeSource('priority_areas');
    setProjectInfo({ ...projectInfo, priorityAreas: [] });
  };

  return (
    <div className="w-100">
      <p className={styleClasses.pClass}>
        <FormattedMessage {...messages.priorityAreasDescription} />
      </p>
      <div className="pb2">
        {['draw_polygon', 'draw_rectangle'].map((option) => (
          <label className="di pr3" key={option}>
            <input
              value={option}
              checked={activeMode === option}
              onChange={() => {
                draw[0].changeMode(option);
                setActiveMode(option);
              }}
              type="radio"
              className={`radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light`}
            />
            <FormattedMessage {...messages[`priorityAreas_${option}`]} />
          </label>
        ))}
        <Button onClick={clearAll} className={`ml2 ${styleClasses.redButtonClass}`}>
          <FormattedMessage {...messages.clearAll} />
        </Button>
      </div>

      <div id="map" ref={mapRef} className="vh-75 w-100"></div>
    </div>
  );
};

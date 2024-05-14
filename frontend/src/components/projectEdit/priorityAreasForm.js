import React, { useState, useContext, useLayoutEffect } from 'react';
import { useSelector } from 'react-redux';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import DrawRectangle from 'mapbox-gl-draw-rectangle-mode';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import { featureCollection } from '@turf/helpers';
import { FormattedMessage } from 'react-intl';
import { useDropzone } from 'react-dropzone';

import messages from './messages';
import { StateContext, styleClasses } from '../../views/projectEdit';
import { CustomButton } from '../button';
import { MappedIcon, WasteIcon, MappedSquareIcon, FileImportIcon } from '../svgIcons';
import { MAPBOX_TOKEN, MAP_STYLE, MAPBOX_RTL_PLUGIN_URL, CHART_COLOURS } from '../../config';
import { BasemapMenu } from '../basemapMenu';
import {
  verifyGeometry,
  readGeoFile,
  verifyFileFormat,
  verifyFileSize,
} from '../../utils/geoFileFunctions';
import { getErrorMsg } from '../projectCreate/fileUploadErrors';
import { Alert } from '../alert';
import WebglUnsupported from '../webglUnsupported';

mapboxgl.accessToken = MAPBOX_TOKEN;
try {
  mapboxgl.setRTLTextPlugin(MAPBOX_RTL_PLUGIN_URL);
} catch {
  console.log('RTLTextPlugin is loaded');
}

export const PriorityAreasForm = () => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);
  const locale = useSelector((state) => state.preferences['locale']);
  const mapRef = React.createRef();
  const [error, setError] = useState({ error: false, message: null });

  const modes = MapboxDraw.modes;
  modes.draw_rectangle = DrawRectangle;
  const drawOptions = {
    displayControlsDefault: false,
    modes: modes,
    styles: [
      {
        id: 'gl-draw-polygon-fill-inactive',
        type: 'fill',
        paint: {
          'fill-color': '#d73f3f',
          'fill-opacity': 0.3,
        },
      },
      {
        id: 'gl-draw-polygon-line-inactive',
        type: 'line',
        paint: {
          'line-color': '#d73f3f',
          'line-dasharray': [2, 2],
          'line-width': 2,
          'line-opacity': 0.7,
        },
      },
    ],
  };
  const [mapObj, setMapObj] = useState({
    map: null,
    draw: new MapboxDraw(drawOptions),
  });
  const [activeMode, setActiveMode] = useState(null);

  let priorityAreas = projectInfo.priorityAreas ? projectInfo.priorityAreas : [];
  // update priority areas as features
  const drawPriorityAreas = priorityAreas.map((a) => ({
    type: 'Feature',
    properties: {},
    geometry: a,
  }));

  const uploadFile = (files) => {
    const file = files[0];
    if (!file) return;

    try {
      setError({ error: false, message: null }); //reset error on new file upload

      verifyFileSize(file);
      verifyFileFormat(file);

      readGeoFile(file)
        .then((geometry) => {
          verifyAndRenderPriorityArea(geometry);
        })
        .catch((e) => setError({ error: true, message: getErrorMsg(e.message) || e.message }));
    } catch (err) {
      setError({ error: true, message: getErrorMsg(err.message) || err.message });
    }
  };

  const verifyAndRenderPriorityArea = (geom) => {
    const supportedGeoms = ['Polygon'];
    try {
      let validGeometry = verifyGeometry(geom, supportedGeoms);
      priorityAreas = validGeometry.features.map((g) => g.geometry);

      setProjectInfo({ ...projectInfo, priorityAreas: priorityAreas });
      mapObj.map.getSource('priority_areas').setData(validGeometry);
    } catch (err) {
      setError({ error: true, message: getErrorMsg(err.message) || err.message });
    }
  };

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop: uploadFile,
    noClick: true,
    noKeyboard: true,
  });

  useLayoutEffect(() => {
    const map =
      mapboxgl.supported() &&
      new mapboxgl.Map({
        container: mapRef.current,
        style: MAP_STYLE,
        center: [0, 0],
        zoom: 1,
        attributionControl: false,
      })
        .addControl(new mapboxgl.AttributionControl({ compact: false }))
        .addControl(new MapboxLanguage({ defaultLanguage: locale.substr(0, 2) || 'en' }))
        .addControl(new mapboxgl.NavigationControl());

    setMapObj({ ...mapObj, map: map });

    return () => map && map.remove();
    // eslint-disable-next-line
  }, []);

  const addMapLayers = (map) => {
    if (map.getSource('aoi') === undefined) {
      map.addSource('aoi', {
        type: 'geojson',
        data: projectInfo.areaOfInterest,
      });

      map.addLayer({
        id: 'aoi',
        source: 'aoi',
        type: 'fill',
        paint: {
          'fill-color': CHART_COLOURS.orange,
          'fill-outline-color': '#929db3',
          'fill-opacity': 0.4,
        },
      });
    }

    if (map.getSource('priority_areas') === undefined) {
      // Render priority areas.
      map.addSource('priority_areas', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: drawPriorityAreas },
      });

      map.addLayer({
        id: 'priority_area_border',
        type: 'line',
        source: 'priority_areas',
        paint: {
          'line-color': '#d73f3f',
          'line-dasharray': [2, 2],
          'line-width': 2,
          'line-opacity': 0.7,
        },
        layout: {
          visibility: 'visible',
        },
      });

      map.addLayer({
        id: 'priority_areas',
        type: 'fill',
        source: 'priority_areas',
        paint: {
          'fill-color': '#d73f3f',
          'fill-opacity': 0.3,
        },
        layout: {
          visibility: 'visible',
        },
      });
    }
  };

  const updatePriorityAreas = (event) => {
    priorityAreas.push(event.features[0].geometry);
    setProjectInfo({ ...projectInfo, priorityAreas: priorityAreas });
    setActiveMode(null);
  };

  const drawPolygonHandler = () => {
    if (activeMode === 'draw_polygon') {
      setActiveMode(null);
      mapObj.draw.changeMode('simple_select');
      return;
    }

    setActiveMode('draw_polygon');
    mapObj.map.on('draw.update', updatePriorityAreas);
    mapObj.map.once('draw.create', updatePriorityAreas);
    mapObj.draw.changeMode('draw_polygon');
  };

  const drawRectangleHandler = () => {
    if (activeMode === 'draw_rectangle') {
      setActiveMode(null);
      mapObj.draw.changeMode('simple_select');
      return;
    }

    setActiveMode('draw_rectangle');
    mapObj.map.on('draw.update', updatePriorityAreas);
    mapObj.map.once('draw.create', updatePriorityAreas);
    mapObj.draw.changeMode('draw_rectangle');
  };

  useLayoutEffect(() => {
    if (mapObj.map !== null && mapboxgl.supported()) {
      mapObj.map.on('load', () => {
        mapObj.map.addControl(mapObj.draw);
        addMapLayers(mapObj.map);
        mapObj.map.fitBounds(projectInfo.aoiBBOX, { duration: 0, padding: 100 });
      });

      mapObj.map.on('styledata', () => {
        addMapLayers(mapObj.map);
        if (mapObj.map.getSource('priority_areas') !== undefined) {
          mapObj.map
            .getSource('priority_areas')
            .setData({ type: 'FeatureCollection', features: drawPriorityAreas });
        }
      });
    }
    // eslint-disable-next-line
  }, [mapObj.map, mapObj.draw, projectInfo, setProjectInfo, drawPriorityAreas]);

  const clearAll = () => {
    const currentDrawMode = mapObj.draw.getMode();
    mapObj.draw.deleteAll();
    mapObj.draw.changeMode(currentDrawMode);
    mapObj.map.getSource('priority_areas').setData(featureCollection([]));
    setProjectInfo({ ...projectInfo, priorityAreas: [] });
  };

  if (!mapboxgl.supported()) {
    return <WebglUnsupported className="vh-75 w-100 bg-white" />;
  } else {
    return (
      <div className="w-100" {...getRootProps()}>
        <div className="relative">
          <div className="cf absolute bg-white o-90 top-1 left-1 pa3 mw6 z-4 br1">
            <p className={styleClasses.pClass}>
              <FormattedMessage {...messages.priorityAreasDescription} />
            </p>
            <div>
              <CustomButton
                className={`bg-white ph3 pv2 mr2 ba ${
                  activeMode === 'draw_polygon' ? 'red b--red' : 'blue-dark b--grey-light'
                }`}
                onClick={drawPolygonHandler}
              >
                <MappedIcon className="h1 w1 pb1 v-mid mr2" />
                <FormattedMessage {...messages.drawPolygon} />
              </CustomButton>

              <CustomButton
                className={`bg-white ph3 pv2 mr2 ba ${
                  activeMode === 'draw_rectangle' ? 'red b--red' : 'blue-dark b--grey-light'
                }`}
                onClick={drawRectangleHandler}
              >
                <MappedSquareIcon className="h1 w1 pb1 v-mid mr2" />
                <FormattedMessage {...messages.drawRectangle} />
              </CustomButton>
              <CustomButton className="bg-white blue-dark ba b--grey-light ph3 pv2" onClick={open}>
                <FileImportIcon className="h1 w1 v-mid mr2" />
                <FormattedMessage {...messages.selectFile} />
              </CustomButton>
              <input {...getInputProps()} />
              <p className="f6 blue-grey lh-title mt3">
                <FormattedMessage {...messages.importDescription} />
              </p>
              <p className="f5 mb0">
                <CustomButton
                  onClick={clearAll}
                  className="bg-white ph3 pv2 mr2 blue-dark ba b--grey-light"
                >
                  <WasteIcon className="h1 w1 pb1 v-mid mr2" />
                  <FormattedMessage {...messages.clearAll} />
                </CustomButton>
              </p>
            </div>
            {error.error === true && <Alert type="error">{error.message}</Alert>}
          </div>
          <div className="absolute top-0 right-0 z-5 mr2">
            <BasemapMenu map={mapObj.map} />
          </div>

          <div id="priority-area-map" ref={mapRef} className="vh-75 w-100 bg-white"></div>
        </div>
      </div>
    );
  }
};

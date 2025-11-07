import { useLayoutEffect, useEffect, useCallback, useState, createRef } from 'react';
import { useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { featureCollection } from '@turf/helpers';
import '@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css';
import { useDropzone } from 'react-dropzone';
import { maplibreLayerDefn } from '../projects/projectsMap';

import { CHART_COLOURS, TASK_COLOURS, baseLayers, DEFAULT_MAP_STYLE } from '../../config';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { useDebouncedCallback } from '../../hooks/UseThrottle';
import isWebglSupported from '../../utils/isWebglSupported';
import useSetRTLTextPlugin from '../../utils/useSetRTLTextPlugin';
import { BasemapMenu } from '../basemapMenu';
import { ProjectsAOILayerCheckBox } from './projectsAOILayerCheckBox';
import WebglUnsupported from '../webglUnsupported';
import '../projectEdit/style.scss';

const ProjectCreationMap = ({
  mapObj,
  setMapObj,
  metadata,
  updateMetadata,
  step,
  uploadFile,
}: Object) => {
  const mapRef = createRef();
  const token = useSelector((state) => state.auth.token);
  const [showProjectsAOILayer, setShowProjectsAOILayer] = useState(true);
  const [aoiCanBeActivated, setAOICanBeActivated] = useState(false);
  const [existingProjectsList, setExistingProjectsList] = useState([]);
  const [isAoiLoading, setIsAoiLoading] = useState(false);
  const [debouncedGetProjectsAOI] = useDebouncedCallback(() => getProjectsAOI(), 1500);
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: step === 1 ? uploadFile : () => {}, // drag&drop is activated only on the first step
    noClick: true,
    noKeyboard: true,
  });
  const minZoomLevelToAOIVisualization = 9;

  useSetRTLTextPlugin();

  useEffect(() => {
    fetchLocalJSONAPI('projects/').then((res) => setExistingProjectsList(res.mapResults));
  }, []);

  const getProjectsAOI = () => {
    if (aoiCanBeActivated && showProjectsAOILayer && step === 1) {
      setIsAoiLoading(true);
      let bounds = mapObj.map.getBounds();
      let bbox = `${bounds._sw.lng},${bounds._sw.lat},${bounds._ne.lng},${bounds._ne.lat}`;
      fetchLocalJSONAPI(`projects/queries/bbox/?bbox=${bbox}&srid=4326`, token).then((res) => {
        mapObj.map.getSource('otherProjects')?.setData(res);
        setIsAoiLoading(false);
      });
    }
  };

  const clearProjectsAOI = useCallback(() => {
    if (mapObj && mapObj.map && mapObj.map.getSource('otherProjects')) {
      mapObj.map.getSource('otherProjects').setData(featureCollection([]));
    }
  }, [mapObj]);

  useEffect(() => {
    if (showProjectsAOILayer && step === 1) {
      debouncedGetProjectsAOI();
    } else {
      clearProjectsAOI();
    }
  }, [showProjectsAOILayer, debouncedGetProjectsAOI, clearProjectsAOI, step]);

  useLayoutEffect(() => {
    if (!isWebglSupported()) return;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: DEFAULT_MAP_STYLE,
      center: [0, 0],
      zoom: 1.3,
      attributionControl: false,
    })
      .addControl(new maplibregl.AttributionControl({ compact: false }))
      .addControl(new maplibregl.ScaleControl({ unit: 'metric' }));

    setMapObj({ ...mapObj, map: map });
    return () => {
      mapObj.map && mapObj.map.remove();
    };
    // eslint-disable-next-line
  }, []);

  const addMapLayers = (map) => {
    // load all base layer and toggle visibility
    for (const [key, value] of Object.entries(baseLayers)) {
      if (mapObj.map.getSource(`${key}-source`) === undefined) {
        mapObj.map.addSource(`${key}-source`, value.source);
        mapObj.map.addLayer(value.layer);
      }
    }

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
    if (map.getSource('otherProjects') === undefined) {
      const colorByStatus = [
        'match',
        ['get', 'projectStatus'],
        'DRAFT',
        TASK_COLOURS.MAPPED,
        'PUBLISHED',
        TASK_COLOURS.VALIDATED,
        'ARCHIVED',
        TASK_COLOURS.BADIMAGERY,
        'rgba(0,0,0,0)', // fallback option required by mapbox-gl
      ];
      map.addSource('otherProjects', {
        type: 'geojson',
        data: featureCollection([]),
      });
      map.addLayer({
        id: 'otherProjectsLine',
        type: 'line',
        source: 'otherProjects',
        paint: {
          'line-color': colorByStatus,
          'line-width': 2,
          'line-opacity': 1,
        },
      });
      map.addLayer({
        id: 'otherProjectsFill',
        type: 'fill',
        source: 'otherProjects',
        paint: {
          'fill-color': colorByStatus,
          'fill-opacity': ['match', ['get', 'projectStatus'], 'PUBLISHED', 0.1, 0.3],
        },
      });
    }
  };

  const noop = () => {};

  useLayoutEffect(() => {
    /* docs: https://docs.mapbox.com/mapbox-gl-js/example/cluster/ */
    const { map } = mapObj;

    const someResultsReady =
      existingProjectsList &&
      existingProjectsList.features &&
      existingProjectsList.features.length > 0;

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
      maplibreLayerDefn(map, existingProjectsList, noop, true);
    } else if (projectsReadyMapLoading) {
      map.on('load', () => maplibreLayerDefn(map, existingProjectsList, noop, true));
    }

    /* refill the source on existingProjectsList changes */
    if (map !== null && map.getSource('projects') !== undefined && someResultsReady) {
      map.getSource('projects').setData(existingProjectsList);
    }
  }, [mapObj, existingProjectsList]);

  useLayoutEffect(() => {
    if (mapObj.map !== null && isWebglSupported()) {
      mapObj.map.on('moveend', (event) => {
        debouncedGetProjectsAOI();
      });
    }
  });

  useLayoutEffect(() => {
    if (mapObj.map !== null && isWebglSupported()) {
      mapObj.map.on('load', () => {
        mapObj.map.addControl(new maplibregl.NavigationControl());
        addMapLayers(mapObj.map);
        mapObj.map.addControl(mapObj.draw);
      });

      // Remove area and geometry when aoi is deleted.
      mapObj.map.on('delete', (event) => {
        updateMetadata({ ...metadata, geom: null, area: 0 });
      });
      // enable disable the project AOI visualization checkbox
      mapObj.map.on('zoomend', (event) => {
        if (mapObj.map.getZoom() < minZoomLevelToAOIVisualization) {
          setAOICanBeActivated(false);
        } else {
          setAOICanBeActivated(true);
        }
      });
    }
    // eslint-disable-next-line
  }, [mapObj, metadata, updateMetadata, step]);

  if (!isWebglSupported()) {
    return <WebglUnsupported className="vh-50 h-100-l w-100" />;
  } else {
    return (
      <div className="w-100 h-100-l relative" {...getRootProps()}>
        <div className="absolute top-0 right-0 z-5 mr2">
          {step === 1 && (
            <ProjectsAOILayerCheckBox
              isActive={showProjectsAOILayer}
              setActive={setShowProjectsAOILayer}
              disabled={!aoiCanBeActivated}
              isAoiLoading={isAoiLoading}
            />
          )}
          <BasemapMenu map={mapObj.map} />
          <input className="dn" {...getInputProps()} />
        </div>
        <div id="project-creation-map" className="vh-50 h-100-l w-100" ref={mapRef}></div>
      </div>
    );
  }
};

export default ProjectCreationMap;

import React, { useState, useLayoutEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from '@reach/router';
import { useQueryParam, NumberParam } from 'use-query-params';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

import messages from './messages';
import SetAOI from './setAOI';
import { ProjectCreationMap } from './projectCreationMap';
import SetTaskSizes from './setTaskSizes';
import TrimProject from './trimProject';
import NavButtons from './navButtons';
import Review from './review';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { MAX_AOI_AREA } from '../../config';
import { AlertIcon } from '../svgIcons';

import area from '@turf/area';
import bbox from '@turf/bbox';
import { featureCollection } from '@turf/helpers';
import lineToPolygon from '@turf/line-to-polygon';
import { makeGrid } from './setTaskSizes';
import { MAX_FILESIZE } from '../../config';

var tj = require('@mapbox/togeojson');
var osmtogeojson = require('osmtogeojson');
var shp = require('shpjs');

const aoiPaintOptions = {
  'fill-color': '#00004d',
  'fill-opacity': 0.3,
};

const taskGridPaintOptions = {
  'fill-color': '#fff',
  'fill-outline-color': '#00f',
  'fill-opacity': 0.5,
};

export const addLayer = (layerName, data, map) => {
  if (map.getLayer(layerName)) {
    map.removeLayer(layerName);
  }
  if (map.getSource(layerName)) {
    map.removeSource(layerName);
  }

  let options = aoiPaintOptions;
  if (layerName === 'grid') {
    options = taskGridPaintOptions;
  }

  map.addLayer({
    id: layerName,
    type: 'fill',
    source: {
      type: 'geojson',
      data: data,
    },
    paint: options,
  });
};

const AlertMessage = ({ err }) => {
  if (err.error === true) {
    return (
      <p className={'w-80 pv2 tc f6 fw6 red ba b--red br1 lh-copy'}>
        <span className="ph1">
          <AlertIcon className="red mr2" height="15px" width="15px" />
          {err.message}
        </span>
      </p>
    );
  } else {
    return null;
  }
};

const ProjectCreate = (props) => {
  const token = useSelector((state) => state.auth.get('token'));
  const layer_name = 'aoi';

  const setDataGeom = (geom, display) => {
    mapObj.map.fitBounds(bbox(geom), { padding: 20 });
    const geomArea = area(geom) / 1e6;
    const zoomLevel = 11;
    const grid = makeGrid(geom, zoomLevel, {});
    updateMetadata({
      ...metadata,
      geom: geom,
      area: geomArea.toFixed(2),
      zoomLevel: zoomLevel,
      taskGrid: grid,
      tempTaskGrid: grid,
    });

    if (display === true) {
      addLayer('aoi', geom, mapObj.map);
    }
  };

  const validateFeature = (e, supportedGeoms, err) => {
    if (supportedGeoms.includes(e.geometry.type) === false) {
      err.message = (
        <FormattedMessage {...messages.unsupportedGeom} values={{ geometry: e.geometry.type }} />
      );

      throw err;
    }

    // Transform lineString to polygon
    if (e.geometry.type === 'LineString') {
      const coords = e.geometry.coordinates;
      if (JSON.stringify(coords[0]) !== JSON.stringify(coords[coords.length - 1])) {
        err.message = <FormattedMessage {...messages.closedLinestring} />;
        throw err;
      }
      const polygon = lineToPolygon(e);
      return polygon;
    }

    return e;
  };

  const verifyAndSetData = (event) => {
    let err = { code: 403, message: null };

    try {
      if (event.type !== 'FeatureCollection') {
        err.message = <FormattedMessage {...messages.noFeatureCollection} />;
        throw err;
      }
      // Validate geometry for each feature.
      const supportedGeoms = ['Polygon', 'MultiPolygon', 'LineString'];
      const features = event.features.map((e) => validateFeature(e, supportedGeoms, err));

      event.features = features;
      setDataGeom(event, true);
    } catch (e) {
      deleteHandler();
      setErr({ error: true, message: e.message });
    }
  };

  const uploadFile = (files) => {
    let file = files[0];
    if (!file) {
      return null;
    }
    if (file.size >= MAX_FILESIZE) {
      setErr({
        error: true,
        message: (
          <FormattedMessage {...messages.fileSize} values={{ fileSize: MAX_FILESIZE / 1000000 }} />
        ),
      });
      return null;
    }

    const format = file.name.split('.')[1].toLowerCase();

    const readFile = (e) => {
      let geom = null;
      switch (format) {
        case 'json':
        case 'geojson':
          geom = JSON.parse(e.target.result);
          break;
        case 'kml':
          let kml = new DOMParser().parseFromString(e.target.result, 'text/xml');
          geom = tj.kml(kml);
          break;
        case 'osm':
          let osm = new DOMParser().parseFromString(e.target.result, 'text/xml');
          geom = osmtogeojson(osm);
          break;
        case 'xml':
          let xml = new DOMParser().parseFromString(e.target.result, 'text/xml');
          geom = osmtogeojson(xml);
          break;
        case 'zip':
          shp(e.target.result).then(function (geom) {
            verifyAndSetData(geom);
          });
          break;
        default:
          break;
      }
      if (format !== 'zip') {
        verifyAndSetData(geom);
      }
    };

    let fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        readFile(e);
      } catch (err) {
        setErr({
          error: true,
          message: <FormattedMessage {...messages.invalidFile} />,
        });
      }
    };

    if (format === 'zip') {
      fileReader.readAsArrayBuffer(file);
    } else {
      fileReader.readAsText(file);
    }
  };

  const deleteHandler = () => {
    const features = mapObj.draw.getAll();
    if (features.features.length > 0) {
      const id = features.features[0].id;
      mapObj.draw.delete(id);
    }

    if (mapObj.map.getLayer(layer_name)) {
      mapObj.map.removeLayer(layer_name);
    }
    if (mapObj.map.getSource(layer_name)) {
      mapObj.map.removeSource(layer_name);
    }
    updateMetadata({ ...metadata, area: 0, geom: null });
  };

  const drawHandler = () => {
    const updateArea = (event) => {
      const features = mapObj.draw.getAll();
      if (features.features.length > 1) {
        const id = features.features[0].id;
        mapObj.draw.delete(id);
      }

      // Validate area first.
      const geom = featureCollection(event.features);
      setDataGeom(geom, false);
    };

    mapObj.map.on('draw.update', updateArea);
    mapObj.map.once('draw.create', updateArea);
    mapObj.draw.changeMode('draw_polygon');
  };
  // eslint-disable-next-line
  const [cloneFromId, setCloneFromId] = useQueryParam('cloneFrom', NumberParam);
  const [step, setStep] = useState(1);
  const [cloneProjectName, setCloneProjectName] = useState(null);
  const [err, setErr] = useState({ error: false, message: null });

  const fetchCloneProjectInfo = useCallback(
    async (cloneFromId) => {
      const res = await fetchLocalJSONAPI(`projects/${cloneFromId}/`, token);
      setCloneProjectName(res.projectInfo.name);
    },
    [setCloneProjectName, token],
  );

  useLayoutEffect(() => {
    if (cloneFromId && !isNaN(Number(cloneFromId))) {
      fetchCloneProjectInfo(cloneFromId);
    }
  }, [cloneFromId, fetchCloneProjectInfo]);

  let cloneProjectData = {
    id: cloneFromId,
    name: cloneProjectName,
  };

  // Project information.
  const [metadata, updateMetadata] = useState({
    geom: null,
    area: 0,
    tasksNo: 0,
    taskGrid: null,
    projectName: '',
    zoomLevel: 9,
    tempTaskGrid: null,
    arbitraryTasks: false,
  });

  useLayoutEffect(() => {
    let err = { error: false, message: null };
    if (metadata.area > MAX_AOI_AREA) {
      err = {
        error: true,
        message: <FormattedMessage {...messages.areaOverLimitError} values={{ n: MAX_AOI_AREA }} />,
      };
    }

    setErr(err);
  }, [metadata]);

  const drawOptions = {
    displayControlsDefault: false,
  };
  const [mapObj, setMapObj] = useState({
    map: null,
    draw: new MapboxDraw(drawOptions),
  });

  if (!token) {
    return <Redirect to={'/login'} noThrow />;
  }

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return (
          <SetAOI
            metadata={metadata}
            updateMetadata={updateMetadata}
            uploadFile={uploadFile}
            drawHandler={drawHandler}
            deleteHandler={deleteHandler}
          />
        );
      case 2:
        return <SetTaskSizes mapObj={mapObj} metadata={metadata} updateMetadata={updateMetadata} />;
      case 3:
        return <TrimProject mapObj={mapObj} metadata={metadata} updateMetadata={updateMetadata} />;
      case 4:
        return (
          <Review
            metadata={metadata}
            updateMetadata={updateMetadata}
            token={token}
            cloneProjectData={cloneProjectData}
          />
        );
      default:
        return;
    }
  };

  return (
    <div className="cf vh-minus-122-ns h-100 pr0-l">
      <div className="fl pt3 w-30-l cf w-100">
        <h2 className="f2 fw6 mt2 mb3 ttu barlow-condensed blue-dark">
          <FormattedMessage {...messages.createProject} />
        </h2>
        {cloneFromId && (
          <p className="fw6 pv2 blue-grey">
            <FormattedMessage
              {...messages.cloneProject}
              values={{ id: cloneFromId, name: cloneProjectName }}
            />
          </p>
        )}
        {renderCurrentStep()}
        <AlertMessage err={err} />

        <NavButtons
          index={step}
          setStep={setStep}
          metadata={metadata}
          mapObj={mapObj}
          updateMetadata={updateMetadata}
          maxArea={MAX_AOI_AREA}
          setErr={setErr}
        />
      </div>
      <div className="w-70-l w-100 h-100-l h-50 pt3 pt0-l fr relative">
        <ProjectCreationMap
          metadata={metadata}
          updateMetadata={updateMetadata}
          mapObj={mapObj}
          setMapObj={setMapObj}
          step={step}
          uploadFile={uploadFile}
        />
        <div className="cf absolute" style={{ bottom: '3.5rem', left: '0.6rem' }}>
          <p
            className={`fl mr2 pa1 f7-ns white ${
              metadata.area > MAX_AOI_AREA || metadata.area === 0 ? 'bg-red' : 'bg-green'
            }`}
          >
            <FormattedMessage
              {...messages.areaSize}
              values={{
                area: <FormattedNumber value={metadata.area} unit="kilometer" />,
                sq: <sup>2</sup>,
              }}
            />
          </p>
          <p className="fl bg-blue-light white mr2 pa1 f7-ns">
            <FormattedMessage
              {...messages.taskNumber}
              values={{ n: <FormattedNumber value={metadata.tasksNo} /> }}
            />
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreate;

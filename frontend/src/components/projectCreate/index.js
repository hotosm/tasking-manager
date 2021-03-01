import React, { useState, useLayoutEffect, useCallback, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from '@reach/router';
import ReactPlaceholder from 'react-placeholder';
import area from '@turf/area';
import bbox from '@turf/bbox';
import { featureCollection } from '@turf/helpers';
import lineToPolygon from '@turf/line-to-polygon';
import { useQueryParam, NumberParam } from 'use-query-params';
import { FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { createProject } from '../../store/actions/project';
import { store } from '../../store';
import { pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import messages from './messages';
import SetAOI from './setAOI';
import SetTaskSizes from './setTaskSizes';
import TrimProject from './trimProject';
import NavButtons from './navButtons';
import Review from './review';
import { AlertMessage } from './alertMessage';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { MAX_AOI_AREA } from '../../config';
import { navigate } from '@reach/router';
import truncate from '@turf/truncate';
import { makeGrid } from './setTaskSizes';
import { MAX_FILESIZE } from '../../config';

const ProjectCreationMap = React.lazy(() =>
  import('./projectCreationMap' /* webpackChunkName: "projectCreationMap" */),
);

var toGeojson = require('@mapbox/togeojson');
var osmToGeojson = require('osmtogeojson');
var shpjs = require('shpjs');

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

const ProjectCreate = (props) => {
    const intl = useIntl();

  const token = useSelector((state) => state.auth.get('token'));
  const [drawModeIsActive, setDrawModeIsActive] = useState(false);
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
      return lineToPolygon(e);
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
      event.features = event.features.map((e) => validateFeature(e, supportedGeoms, err));
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
          geom = toGeojson.kml(kml);
          break;
        case 'osm':
          let osm = new DOMParser().parseFromString(e.target.result, 'text/xml');
          geom = osmToGeojson(osm);
          break;
        case 'xml':
          let xml = new DOMParser().parseFromString(e.target.result, 'text/xml');
          geom = osmToGeojson(xml);
          break;
        case 'zip':
          shpjs(e.target.result).then((geom) => verifyAndSetData(geom));
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
    updateMetadata({ ...metadata, area: 0, geom: null, arbitraryTasks: false });
  };

  const drawHandler = () => {
    if (drawModeIsActive) {
      setDrawModeIsActive(false);
      mapObj.draw.changeMode('simple_select');
      return;
    }
    setDrawModeIsActive(true);
    const updateArea = (event) => {
      const features = mapObj.draw.getAll();
      if (features.features.length > 1) {
        const id = features.features[0].id;
        mapObj.draw.delete(id);
      }

      // Validate area first.
      setDataGeom(featureCollection(event.features), false);
      setDrawModeIsActive(false);
    };

    mapObj.map.on('draw.update', updateArea);
    mapObj.map.once('draw.create', updateArea);
    mapObj.draw.changeMode('draw_polygon');
  };
  // eslint-disable-next-line
  const [cloneFromId, setCloneFromId] = useQueryParam('cloneFrom', NumberParam);
  const [step, setStep] = useState(1);
  const [cloneProjectName, setCloneProjectName] = useState(null);
  const [cloneProjectOrg, setCloneProjectOrg] = useState(null);
  const [err, setErr] = useState({ error: false, message: null });

  const fetchCloneProjectInfo = useCallback(
    async (cloneFromId) => {
      const res = await fetchLocalJSONAPI(`projects/${cloneFromId}/`, token);
      setCloneProjectName(res.projectInfo.name);
      setCloneProjectOrg(res.organisation);
    },
    [setCloneProjectName, setCloneProjectOrg, token],
  );

  useLayoutEffect(() => {
    if (cloneFromId && !isNaN(Number(cloneFromId))) {
      fetchCloneProjectInfo(cloneFromId);
    }
  }, [cloneFromId, fetchCloneProjectInfo]);

  let cloneProjectData = {
    id: cloneFromId,
    name: cloneProjectName,
    organisation: cloneProjectOrg,
  };

  // Project information.
  const [metadata, updateMetadata] = useState({
    geom: null,
    area: 0,
    tasksNumber: 0,
    taskGrid: null,
    projectName: '',
    zoomLevel: 9,
    tempTaskGrid: null,
    arbitraryTasks: false,
    organisation: '',
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

  const handleCreate = useCallback((cloneProjectData) => {
      if (!metadata.geom) {
        setErr({error: true, message: intl.formatMessage(messages.noGeometry)});
        return;
      }
      if (!metadata.organisation && !cloneProjectData.organisation) {
        setErr({error: true, message:intl.formatMessage(messages.noOrganization)});
        return;
      }

      store.dispatch(createProject(metadata));
      let projectParams = {
        areaOfInterest: truncate(metadata.geom, { precision: 6 }),
        projectName: metadata.projectName,
        organisation: metadata.organisation || cloneProjectData.organisation,
        tasks: truncate(metadata.taskGrid, { precision: 6 }),
        arbitraryTasks: metadata.arbitraryTasks,
      };

      if (cloneProjectData.name !== null) {
        projectParams.projectName = '';
        projectParams.cloneFromProjectId = cloneProjectData.id;
      }
      pushToLocalJSONAPI('projects/', JSON.stringify(projectParams), token)
        .then((res) => navigate(`/manage/projects/${res.projectId}`))
        .catch((e) => setErr({
              error: true,
              message: <FormattedMessage {...messages.creationFailed} values={{ error: e }} />,
            }) );
    }, [metadata, setErr, intl, token]);


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
            drawIsActive={drawModeIsActive}
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
      <div className="fl pt3 cf w-100">
        <h2 className="f2 fw6 mt2 mb3 ttu barlow-condensed blue-dark">
          <FormattedMessage {...messages.createProject} />
        </h2>
      </div>
      <div className="w-100 h-100-l h-50 pt3 pt0-l fr relative">
        <Suspense fallback={<ReactPlaceholder showLoadingAnimation={true} rows={30} delay={300} />}>
          <ProjectCreationMap
            metadata={metadata}
            updateMetadata={updateMetadata}
            mapObj={mapObj}
            setMapObj={setMapObj}
            step={step}
            uploadFile={uploadFile}
          />
        </Suspense>
        <div className="cf absolute bg-white o-90 top-1 left-1 pa3 mw6">
          {cloneFromId && (
            <p className="fw6 pv2 blue-grey">
              <FormattedMessage
                {...messages.cloneProject}
                values={{ id: cloneFromId, name: cloneProjectName }}
              />
            </p>
          )}
          {renderCurrentStep()}
          <AlertMessage error={err} />
          <NavButtons
            index={step}
            setStep={setStep}
            metadata={metadata}
            mapObj={mapObj}
            updateMetadata={updateMetadata}
            maxArea={MAX_AOI_AREA}
            setErr={setErr}
            cloneProjectData={cloneProjectData}
            handleCreate={() => handleCreate(cloneProjectData)}
          />
        </div>
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
              values={{ n: <FormattedNumber value={metadata.tasksNumber} /> }}
            />
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreate;

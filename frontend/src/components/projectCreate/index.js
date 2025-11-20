import { lazy, useState, useLayoutEffect, useCallback, Suspense, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQueryParam, NumberParam } from 'use-query-params';
import { FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import area from '@turf/area';
import bbox from '@turf/bbox';
import { featureCollection } from '@turf/helpers';
import truncate from '@turf/truncate';
import toast from 'react-hot-toast';
import { MaplibreTerradrawControl } from '@watergis/maplibre-gl-terradraw';
import '@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css';
import { TerraDrawPolygonMode } from 'terra-draw';

import messages from './messages';
import viewsMessages from '../../views/messages';
import { createProject } from '../../store/actions/project';
import { store } from '../../store';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import SetAOI from './setAOI';
import SetTaskSizes from './setTaskSizes';
import TrimProject from './trimProject';
import NavButtons from './navButtons';
import Review from './review';
import { Alert } from '../alert';
import { makeGrid } from '../../utils/taskGrid';
import isWebglSupported from '../../utils/isWebglSupported';
import { MAX_AOI_AREA } from '../../config';
import {
  verifyGeometry,
  readGeoFile,
  verifyFileFormat,
  verifyFileSize,
} from '../../utils/geoFileFunctions';
import { getErrorMsg } from './fileUploadErrors';
import { getAllFeatures, removeFeaturesById } from '../../utils/terrawDraw';

const ProjectCreationMap = lazy(() =>
  import('./projectCreationMap' /* webpackChunkName: "projectCreationMap" */),
);

const polygonModeStyles = {
  fillColor: '#F1EE8E',
  fillOpacity: 0.3,
  outlineColor: '#E69B00',
  outlineWidth: 1,
  closingPointColor: '#F1EE8E',
  closingPointWidth: 1,
  closingPointOutlineColor: '#E69B00',
  closingPointOutlineWidth: 1,
};

//this function Overrides default Terra Draw polygon layer styles to match our theme
const setPolygonStyle = (map) => {
  const defaultTdPolygonLayerId = 'td-polygon';
  const defaultTdPolygonOutlineLayerId = 'td-polygon-outline';
  const defaultTdPolygonPointLayerId = 'td-point';

  map.setPaintProperty(defaultTdPolygonLayerId, 'fill-color', '#F1EE8E');
  map.setPaintProperty(defaultTdPolygonLayerId, 'fill-opacity', 0.3);
  map.setPaintProperty(defaultTdPolygonOutlineLayerId, 'line-color', '#E69B00');
  map.setPaintProperty(defaultTdPolygonOutlineLayerId, 'line-width', 1);
  map.setPaintProperty(defaultTdPolygonPointLayerId, 'circle-color', '#E69B00');
};

const ProjectCreate = () => {
  const intl = useIntl();
  const token = useSelector((state) => state.auth.token);
  const navigate = useNavigate();
  const [drawModeIsActive, setDrawModeIsActive] = useState(false);
  const [showProjectsAOILayer, setShowProjectsAOILayer] = useState(false);

  const setDataGeom = (geom, display) => {
    const supportedGeoms = ['Polygon', 'MultiPolygon', 'LineString'];

    try {
      let validGeometry = verifyGeometry(geom, supportedGeoms);

      mapObj.map.fitBounds(bbox(validGeometry), { padding: 200 });
      const zoomLevel = 11;
      const grid = makeGrid(validGeometry, zoomLevel);
      updateMetadata({
        ...metadata,
        geom: validGeometry,
        area: (area(validGeometry) / 1e6).toFixed(2),
        zoomLevel: zoomLevel,
        taskGrid: grid,
        tempTaskGrid: grid,
      });

      if (display === true) {
        mapObj.map.getSource('aoi').setData(validGeometry);
      }
    } catch (err) {
      setErr({ error: true, message: getErrorMsg(err.message) || err.message });
    }
  };

  const uploadFile = (files) => {
    const file = files[0];
    if (!file) return null;
    try {
      setErr({ code: 403, message: null }); //reset error on new file upload

      verifyFileFormat(file);
      verifyFileSize(file);

      readGeoFile(file)
        .then((geometry) => {
          setDataGeom(geometry, true);
        })
        .catch((error) =>
          setErr({ error: true, message: getErrorMsg(error.message) || error.message }),
        );
    } catch (e) {
      deleteHandler();
      setErr({ error: true, message: getErrorMsg(e.message) || e.message });
    }
  };

  const deleteHandler = () => {
    const drawInstance = mapObj.draw.getTerraDrawInstance();
    drawInstance.clear();
    if (mapObj.map.getSource('aoi')) {
      mapObj.map.getSource('aoi').setData(featureCollection([]));
    }
    updateMetadata({ ...metadata, area: 0, geom: null, arbitraryTasks: false, tasksNumber: 0 });
  };

  const drawHandler = () => {
    const drawInstance = mapObj.draw.getTerraDrawInstance();
    if (!drawInstance) return;
    if (drawModeIsActive) {
      setDrawModeIsActive(false);
      drawInstance.setMode('select');
      return;
    }
    setDrawModeIsActive(true);

    drawInstance.setMode('polygon');
    drawInstance.on('finish', (id) => {
      const allFeatures = getAllFeatures(drawInstance);
      //  keep the latest one and remove everything else
      const previousFeatureIds = allFeatures.reduce(
        (prev, curr) => (curr.id !== id ? [...prev, curr.id] : prev),
        [],
      );
      const newFeature = allFeatures.filter((f) => f.id === id);

      if (previousFeatureIds.length > 0) {
        removeFeaturesById(drawInstance, previousFeatureIds);
      }
      setDataGeom(featureCollection(newFeature), false);
      drawInstance.setMode('select');
      drawInstance.selectFeature(id);
      setDrawModeIsActive(false);

      // Note: We are manually overriding Terra Draw's default layer paint properties
      // because the “select” mode style config may not apply as expected.
      setPolygonStyle(mapObj.map);
    });
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
  }, [metadata.area]);

  const drawOptions = {
    modes: ['delete', 'polygon', 'select'],
    open: true,
    modeOptions: {
      polygon: new TerraDrawPolygonMode({ styles: polygonModeStyles }),
    },
  };

  const [mapObj, setMapObj] = useState({
    map: null,
    draw: new MaplibreTerradrawControl(drawOptions),
  });

  const handleCreate = useCallback(
    (cloneProjectData) => {
      if (!cloneProjectData.name) {
        if (!metadata.projectName.trim()) {
          setErr({ error: true, message: intl.formatMessage(messages.noProjectName) });
          throw new Error('Missing project name.');
        }
        if (!/^[a-zA-Z]/.test(metadata.projectName)) {
          setErr({ error: true, message: intl.formatMessage(messages.projectNameValidationError) });
          throw new Error('Project name validation error.');
        }
      }
      if (!metadata.geom) {
        setErr({ error: true, message: intl.formatMessage(messages.noGeometry) });
        throw new Error('Missing geom.');
      }
      if (!metadata.organisation && !cloneProjectData.organisation) {
        setErr({ error: true, message: intl.formatMessage(messages.noOrganization) });
        throw new Error('Missing organization information.');
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
        .then((res) => {
          toast.success(
            <FormattedMessage
              {...viewsMessages.entityCreationSuccess}
              values={{
                entity: 'project',
              }}
            />,
          );
          navigate(`/manage/projects/${res.projectId}`);
        })
        .catch((e) => {
          setErr({
            error: true,
            message: <FormattedMessage {...messages.creationFailed} values={{ error: e }} />,
          });
        });
    },
    [metadata, token, intl, navigate],
  );

  useEffect(() => {
    if (!token) {
      return navigate('/login');
    }
  }, [navigate, token]);

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
            showProjectsAOILayer={showProjectsAOILayer}
            setShowProjectsAOILayer={setShowProjectsAOILayer}
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
            showProjectsAOILayer={showProjectsAOILayer}
          />
        </Suspense>
        {isWebglSupported() && (
          <>
            <div className="cf absolute bg-white o-90 top-1 left-1 pa3 mw6">
              {cloneFromId && (
                <p className="fw6 pv2 blue-grey">
                  <FormattedMessage
                    {...messages.cloneProject}
                    values={{ id: cloneFromId, name: cloneProjectName }}
                  />
                </p>
              )}
              <div className="pb2">{renderCurrentStep()}</div>
              {err.error === true && <Alert type="error">{err.message}</Alert>}
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
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectCreate;

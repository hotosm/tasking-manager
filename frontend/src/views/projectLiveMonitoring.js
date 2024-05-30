import React, { useState, useRef, useEffect } from 'react';
import ReactPlaceholder from 'react-placeholder';
import Select from 'react-select';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import centroid from '@turf/centroid';
import {
  UnderpassFeatureList,
  UnderpassMap,
  HOTTheme,
  UnderpassFeatureStats,
  UnderpassValidationStats,
} from '@hotosm/underpass-ui';

import { ProjectVisibilityBox } from '../components/projectDetail/visibilityBox';
import { ProjectStatusBox } from '../components/projectDetail/statusBox';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { useFetch } from '../hooks/UseFetch';
import useHasLiveMonitoringFeature from '../hooks/UseHasLiveMonitoringFeature';
import {
  underpassConfig,
  availableImageryOptions,
  statusList,
  mappingTypesTags,
  mappingTypesFeatureTypes,
} from '../config/underpass';
import './projectLiveMonitoring.css';

const availableImageryValues = availableImageryOptions.map((item) => item.value);

export function ProjectLiveMonitoring() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [coords, setCoords] = useState([0, 0]);
  const [activeFeature, setActiveFeature] = useState(null);
  const [tags, setTags] = useState('building');
  const [featureType, setFeatureType] = useState('polygon');
  const [mapSource, setMapSource] = useState('osm');
  const [imageryOptions, setImageryOptions] = useState(availableImageryOptions);
  const [mapConfig, setMapConfig] = useState(underpassConfig);
  const [realtimeList, setRealtimeList] = useState(false);
  const [realtimeMap, setRealtimeMap] = useState(false);
  const [listAll, setListAll] = useState(false);
  // eslint-disable-next-line
  const [status, setStatus] = useState(statusList.UNSQUARED);
  // eslint-disable-next-line
  const [area, setArea] = useState(null);
  const tagsInputRef = useRef('');

  useSetTitleTag(`Project #${id} Live Monitoring`);
  const [error, loading, data] = useFetch(`projects/${id}/`, id);

  const [areaOfInterest, setAreaOfInterest] = useState(null);
  const [project, setProject] = useState(null);

  const hasLiveMonitoringFeature = useHasLiveMonitoringFeature();

  // navigate to homepage when a project without live monitoring feature
  // is accessed directly from the route
  useEffect(() => {
    if (hasLiveMonitoringFeature === null || hasLiveMonitoringFeature) return;
    navigate('/');
  }, [navigate, hasLiveMonitoringFeature]);

  useEffect(() => {
    if (!Object.keys(data).length) return;
    setProject(data);
    // add custom to config sources if the project has custom imagery
    const hasCustomImagery = data.imagery?.includes('http');
    if (hasCustomImagery) {
      setMapConfig((prev) => ({
        ...prev,
        sources: {
          ...prev.sources,
          custom: {
            type: 'raster',
            tiles: [data.imagery],
            tileSize: 256,
            attribution: 'custom',
            maxzoom: 19,
          },
        },
      }));
      setImageryOptions((prev) => [...prev, { label: 'Custom', value: 'custom' }]);
    }
    // set mapSource after data fetch
    const mapSourceValue = hasCustomImagery
      ? 'custom'
      : availableImageryValues.includes(data.imagery)
      ? data.imagery
      : 'osm';
    setMapSource(mapSourceValue);
  }, [data]);

  useEffect(() => {
    if (project && project.aoiBBOX && project.areaOfInterest) {
      const bbox = [
        [project.aoiBBOX[0], project.aoiBBOX[1]],
        [project.aoiBBOX[0], project.aoiBBOX[3]],
        [project.aoiBBOX[2], project.aoiBBOX[3]],
        [project.aoiBBOX[2], project.aoiBBOX[1]],
        [project.aoiBBOX[0], project.aoiBBOX[1]],
      ];
      setCoords(
        centroid({
          type: 'MultiPolygon',
          coordinates: [[bbox]],
        }).geometry.coordinates,
      );
      setAreaOfInterest(
        [
          bbox[0].join(' '),
          bbox[1].join(' '),
          bbox[2].join(' '),
          bbox[3].join(' '),
          bbox[4].join(' '),
        ].join(','),
      );
      setTags(mappingTypesTags[project.mappingTypes] || 'building');
      setFeatureType(mappingTypesFeatureTypes[project.mappingTypes] || 'polygon');
    }
  }, [project]);

  // set organization bar visibility to false
  useEffect(() => {
    dispatch({ type: 'SET_VISIBILITY', isVisible: false });
    return () => {
      dispatch({ type: 'SET_VISIBILITY', isVisible: true });
    };
  }, [dispatch]);

  const hottheme = HOTTheme();

  const defaultMapStyle = {
    waysLine: {
      ...hottheme.map.waysLine,
      'line-opacity': 0.8,
    },
    waysFill: {
      ...hottheme.map.waysFill,
      'fill-opacity': ['match', ['get', 'type'], 'LineString', 0, 0.3],
    },
    nodesSymbol: {
      ...hottheme.map.nodesSymbol,
      'icon-opacity': ['match', ['get', 'type'], 'Point', 0.8, 0],
    },
  };

  // eslint-disable-next-line
  const [demoTheme, setDemoTheme] = useState({
    map: defaultMapStyle,
  });

  const handleFilterClick = (e) => {
    e.preventDefault();
    setTags(tagsInputRef.current.value);
    return false;
  };

  const handleMapSourceSelect = (selectedItem) => {
    setMapSource(selectedItem.value);
  };

  const handleMapMove = ({ bbox }) => {
    setArea(bbox);
  };
  const handleMapLoad = ({ bbox }) => {
    setArea(bbox);
  };

  return (
    <ReactPlaceholder
      showLoadingAnimation={true}
      rows={26}
      ready={!error && !loading}
      className="pr3"
    >
      <div className="cf w-100" style={{ height: 'calc(100vh - 5.5rem)' }}>
        <div className="flex p-2" style={{ gap: '0.685rem' }}>
          <div style={{ flex: 2, position: 'relative' }}>
            <div className="top">
              <form>
                <input
                  className="border px-2 py-2 text-sm rounded"
                  type="text"
                  placeholder="key (ex: building=yes)"
                  ref={tagsInputRef}
                  defaultValue="building"
                  style={{ height: '36px' }}
                />
                &nbsp;
                <button
                  className="inline-flex items-center rounded bg-primary px-2 py-2 text-sm font-medium text-white"
                  onClick={handleFilterClick}
                >
                  Search
                </button>
              </form>
              <Select
                classNamePrefix="react-select"
                isClearable={true}
                value={imageryOptions.find((item) => item.value === mapSource)}
                options={imageryOptions}
                // placeholder={<FormattedMessage {...messages.selectImagery} />}
                onChange={handleMapSourceSelect}
                className="w-60 z-2 mt-2"
              />
            </div>
            <UnderpassMap
              center={coords}
              tags={tags}
              hashtag={'hotosm-project-' + id}
              featureType={featureType}
              highlightDataQualityIssues
              popupFeature={activeFeature}
              source={mapSource}
              config={mapConfig}
              realtime={realtimeMap}
              theme={demoTheme}
              zoom={17}
              onMove={handleMapMove}
              onLoad={handleMapLoad}
            />
          </div>
          <div
            style={{
              flex: 1,
              padding: 5,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: `rgb(${hottheme.colors.white})`,
            }}
          >
            {project && (
              <>
                <div className="flex flex-column flex-row-ns justify-start justify-between-ns items-start items-center-ns flex-wrap">
                  <div className="pt2 title-text">
                    <span className="blue-light">
                      <Link to={`/projects/${project.projectId}`} className="no-underline pointer">
                        <span className="blue-light">#{project.projectId}</span>
                      </Link>
                    </span>
                    {project.organisationName ? (
                      <span className="blue-dark"> | {project.organisationName} </span>
                    ) : null}
                  </div>
                </div>
                <div className="w-100 fl pv1 bg-white blue-dark">
                  <div>
                    <h3
                      className="f2 fw5 ttu barlow-condensed blue-dark dib title-text"
                      lang={project.projectInfo.locale}
                    >
                      {project.projectInfo && project.projectInfo.name}
                    </h3>
                    {project.private && (
                      <ProjectVisibilityBox className="pv2 ph3 mb3 mr3 v-mid dib" />
                    )}
                    {['DRAFT', 'ARCHIVED'].includes(project.status) && (
                      <ProjectStatusBox
                        status={project.status}
                        className="pv2 ph3 mb3 v-mid dib mr3"
                      />
                    )}
                  </div>
                </div>
              </>
            )}
            <div className="border-b-2 pb-5 space-y-3">
              <UnderpassFeatureStats
                tags={tags}
                hashtag={'hotosm-project-' + id}
                featureType={featureType}
                apiUrl={underpassConfig.API_URL}
                area={areaOfInterest}
              />
              <UnderpassValidationStats
                tags={tags}
                hashtag={'hotosm-project-' + id}
                featureType={featureType}
                apiUrl={underpassConfig.API_URL}
                status="badgeom"
                area={areaOfInterest}
              />
            </div>
            <div className="border-b-2 py-5 mb-4">
              <form className="space-x-2">
                <input
                  onChange={() => {
                    setRealtimeList(!realtimeList);
                  }}
                  name="liveListCheckbox"
                  type="checkbox"
                />
                <label target="liveListCheckbox">Live list</label>
                <input
                  onChange={() => {
                    setRealtimeMap(!realtimeMap);
                  }}
                  name="liveMapCheckbox"
                  type="checkbox"
                />
                <label target="liveMapCheckbox">Live map</label>
                <input
                  onChange={() => {
                    setListAll(!listAll);
                  }}
                  name="listAllCheckbox"
                  type="checkbox"
                />
                <label target="listAllCheckbox">List all</label>
              </form>
            </div>
            <UnderpassFeatureList
              style={{
                display: 'flex',
                flexFlow: 'column',
                height: '8px',
                flex: '1 1 auto',
                overflowY: 'auto',
              }}
              tags={tags}
              hashtag={'hotosm-project-' + id}
              featureType={featureType}
              page={0}
              area={areaOfInterest}
              onSelect={(feature) => {
                setCoords([feature.lat, feature.lon]);
                const tags = JSON.stringify(feature.tags);
                const status = feature.status;
                setActiveFeature({ properties: { tags, status }, ...feature });
              }}
              realtime={realtimeList}
              config={underpassConfig}
              status={listAll ? '' : status}
              orderBy="created_at"
              onFetchFirstTime={(mostRecentFeature) => {
                if (mostRecentFeature) {
                  setCoords([mostRecentFeature.lat, mostRecentFeature.lon]);
                }
              }}
            />
          </div>
        </div>
      </div>
    </ReactPlaceholder>
  );
}

export default ProjectLiveMonitoring;

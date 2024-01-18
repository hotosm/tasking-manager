import React, { useState, useRef, useEffect } from 'react';
import ReactPlaceholder from 'react-placeholder';
import Select from 'react-select';
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
import { useParams } from 'react-router-dom';
import { useFetch } from '../hooks/UseFetch';
import './projectLiveMonitoring.css';
import { MAPBOX_TOKEN } from '../config';

const availableImageryOptions = [
  { label: 'OSM', value: 'osm' },
  { label: 'Bing', value: 'Bing' },
  { label: 'Mapbox Satellite', value: 'Mapbox' },
  { label: 'ESRI World Imagery', value: 'EsriWorldImagery' },
];

const availableImageryValues = availableImageryOptions.map((item) => item.value);

const config = {
  API_URL: `https://underpass.live:8000`,
  MAPBOX_TOKEN: MAPBOX_TOKEN,
  // set default sources of Tasking Manager
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap Contributors',
      maxzoom: 19,
    },
    Mapbox: {
      type: 'raster',
      tiles: [
        `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
      ],
      tileSize: 512,
      attribution: '&copy; OpenStreetMap Contributors &copy; Mapbox',
      maxzoom: 19,
    },
    EsriWorldImagery: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap Contributors &copy; ESRI',
      maxzoom: 18,
    },
    Bing: {
      type: 'raster',
      tiles: ['http://ecn.t3.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=1'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap Contributors',
      maxzoom: 18,
    },
  },
};

const statusList = {
  ALL: '',
  UNSQUARED: 'badgeom',
  OVERLAPPING: 'overlapping',
  BADVALUE: 'badvalue',
};

const mappingTypesTags = {
  ROADS: 'highway',
  BUILDINGS: 'building',
  WATERWAYS: 'waterway',
};

const mappingTypesFeatureTypes = {
  ROADS: 'line',
  BUILDINGS: 'polygon',
  WATERWAYS: 'line',
};

export function ProjectLiveMonitoring() {
  const { id } = useParams();
  const [coords, setCoords] = useState([0, 0]);
  const [activeFeature, setActiveFeature] = useState(null);
  const [tags, setTags] = useState('building');
  const [featureType, setFeatureType] = useState('polygon');
  const [mapSource, setMapSource] = useState('osm');
  const [imageryOptions, setImageryOptions] = useState(availableImageryOptions);
  const [mapConfig, setMapConfig] = useState(config);
  const [realtimeList, setRealtimeList] = useState(false);
  const [realtimeMap, setRealtimeMap] = useState(false);
  // eslint-disable-next-line
  const [status, setStatus] = useState(statusList.UNSQUARED);
  // eslint-disable-next-line
  const [area, setArea] = useState(null);
  const tagsInputRef = useRef('');

  useSetTitleTag(`Project #${id} Live Monitoring`);
  const [error, loading, data] = useFetch(`projects/${id}/`, id);

  const [areaOfInterest, setAreaOfInterest] = useState(null);
  const [project, setProject] = useState(null);

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
      <div>
        <div className="flex p-2">
          <div style={{ flex: 2 }}>
            <div className="top">
              <form>
                <input
                  className="border px-2 py-2 text-sm"
                  type="text"
                  placeholder="key (ex: building=yes)"
                  ref={tagsInputRef}
                  defaultValue="building"
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
              <div className="w-100 fl pv1 bg-white blue-dark">
                <div>
                  <h3
                    className="f2 fw5 mt3 mt2-ns mb3 ttu barlow-condensed blue-dark dib mr3"
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
            )}
            <div className="border-b-2 pb-5 space-y-3">
              <UnderpassFeatureStats
                tags={tags}
                hashtag={'hotosm-project-' + id}
                featureType={featureType}
                apiUrl={config.API_URL}
                area={areaOfInterest}
              />
              <UnderpassValidationStats
                tags={tags}
                hashtag={'hotosm-project-' + id}
                featureType={featureType}
                apiUrl={config.API_URL}
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
              </form>
            </div>
            <UnderpassFeatureList
              style={{
                display: 'flex',
                flexFlow: 'column',
                height: '100px',
                flex: '1 1 auto',
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
              config={config}
              status={status}
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

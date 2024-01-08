import React, { useState, useRef, useEffect } from 'react';
import ReactPlaceholder from 'react-placeholder';
import centroid from '@turf/centroid';
import {
  UnderpassFeatureList,
  UnderpassMap,
  HOTTheme,
  UnderpassFeatureStats,
  UnderpassValidationStats,
} from '@hotosm/underpass-ui';

import { ProjectHeader } from '../components/projectDetail/header';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { useParams } from 'react-router-dom';
import { useFetch } from '../hooks/UseFetch';
import './projectLiveMonitoring.css';
import { MAPBOX_TOKEN } from '../config';

const config = {
  API_URL: `https://underpass.live:8000`,
  MAPBOX_TOKEN: MAPBOX_TOKEN,
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

export function ProjectLiveMonitoring() {
  const { id } = useParams();
  const [coords, setCoords] = useState([0, 0]);
  const [activeFeature, setActiveFeature] = useState(null);
  const [tags, setTags] = useState('building');
  const [hashtag, setHashtag] = useState('hotosm-project-' + id);
  const [mapSource, setMapSource] = useState('osm');
  const [realtimeList, setRealtimeList] = useState(false);
  const [realtimeMap, setRealtimeMap] = useState(false);
  const [status, setStatus] = useState(statusList.UNSQUARED);
  // eslint-disable-next-line
  const [area, setArea] = useState(null);
  const tagsInputRef = useRef('');
  const hashtagInputRef = useRef('');
  const styleSelectRef = useRef();

  useSetTitleTag(`Project #${id} Live Monitoring`);
  const [error, loading, data] = useFetch(`projects/${id}/`, id);

  const [areaOfInterest, setAreaOfInterest] = useState(null);
  const [project, setProject] = useState(null);

  useEffect(() => {
    setProject(data);
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
    setHashtag(hashtagInputRef.current.value);
    return false;
  };

  const handleMapSourceSelect = (e) => {
    setMapSource(e.target.options[e.target.selectedIndex].value);
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
        <div className="w-100 fl pv3 ph2 ph4-ns bg-white blue-dark">
          <ProjectHeader project={project} showEditLink={true} />
        </div>
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
                <input
                  className="border px-2 py-2 text-sm"
                  type="text"
                  placeholder="hashtag (ex: hotosm-project)"
                  ref={hashtagInputRef}
                  defaultValue={'hotosm-project-' + id}
                />
                &nbsp;
                <button
                  className="inline-flex items-center rounded bg-primary px-2 py-2 text-sm font-medium text-white"
                  onClick={handleFilterClick}
                >
                  Search
                </button>
              </form>
              <select
                onChange={handleMapSourceSelect}
                ref={styleSelectRef}
                className="border mt-2 bg-white px-2 py-2 text-sm"
              >
                <option value="osm">OSM</option>
                <option value="bing">Bing</option>
                <option value="esri">ESRI</option>
                <option value="mapbox">Mapbox</option>
                <option value="oam">OAM</option>
              </select>
            </div>
            <UnderpassMap
              center={coords}
              tags={tags}
              hashtag={hashtag}
              highlightDataQualityIssues
              popupFeature={activeFeature}
              source={mapSource}
              config={config}
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
              padding: 10,
              backgroundColor: `rgb(${hottheme.colors.white})`,
            }}
          >
            <div className="border-b-2 pb-5 space-y-3">
              <UnderpassFeatureStats
                tags={tags}
                hashtag={hashtag}
                apiUrl={config.API_URL}
                area={areaOfInterest}
              />
              <UnderpassValidationStats
                tags={tags}
                hashtag={hashtag}
                apiUrl={config.API_URL}
                status="badgeom"
                area={areaOfInterest}
              />
            </div>
            <div className="border-b-2 py-5 mb-5">
              <form className="space-x-2 mb-3">
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
              <form className="space-x-2">
                <input
                  checked={status === statusList.ALL}
                  onChange={() => {
                    setStatus(statusList.ALL);
                  }}
                  name="allCheckbox"
                  id="allCheckbox"
                  type="radio"
                />
                <label htmlFor="allCheckbox">All</label>
                <input
                  checked={status === statusList.UNSQUARED}
                  onChange={() => {
                    setStatus(statusList.UNSQUARED);
                  }}
                  name="geospatialCheckbox"
                  id="geospatialCheckbox"
                  type="radio"
                />
                <label htmlFor="geospatialCheckbox">Geospatial</label>
                <input
                  checked={status === statusList.BADVALUE}
                  onChange={() => {
                    setStatus(statusList.BADVALUE);
                  }}
                  name="semanticCheckbox"
                  id="semanticCheckbox"
                  type="radio"
                />
                <label htmlFor="semanticCheckbox">Semantic</label>
              </form>
            </div>
            <div style={{ height: '512px', overflow: 'hidden' }}>
              <UnderpassFeatureList
                tags={tags}
                hashtag={hashtag}
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
      </div>
    </ReactPlaceholder>
  );
}

export default ProjectLiveMonitoring;

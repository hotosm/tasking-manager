import React, { useLayoutEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { extent } from 'geojson-bounds';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { MAPBOX_TOKEN } from '../../config';
import lock from '../../assets/img/lock.png';

mapboxgl.accessToken = MAPBOX_TOKEN;

export const TasksMap = ({
  mapResults,
  className,
  projectId,
}) => {
  const mapRef = React.createRef();
  const [map, setMapObj] = useState(null);
  const activeTasks = useSelector(state => state.tasks.get('activeTasks'));
  const activeProject = useSelector(state => state.tasks.get('activeProject'));
  const dispatch = useDispatch();

  useLayoutEffect(() => {
    /* May be able to refactor this to just take
     * advantage of useRef instead inside other useLayoutEffect() */
    /* I referenced this initially https://philipprost.com/how-to-use-mapbox-gl-with-react-functional-component/ */
    if (MAPBOX_TOKEN) {
      setMapObj(
        new mapboxgl.Map({
          container: mapRef.current,
          // style: 'mapbox://styles/mapbox/bright-v9',
          style: 'mapbox://styles/mapbox/bright-v9',
          zoom: 0,
        }),
      );
    }

    return () => {
      map && map.remove();
    };
    // eslint-disable-next-line
  }, []);

  useLayoutEffect(() => {
    /* docs: https://docs.mapbox.com/mapbox-gl-js/example/cluster/ */
    const mapboxLayerDefn = () => {
      map.addSource('tasks', {
        type: 'geojson',
        data: mapResults,
      });
      const lockIcon = new Image(17, 20);
      lockIcon.src = lock;
      map.addImage('lock', lockIcon, {width: 17, height: 20, data: lockIcon})

      map.addLayer({
        id: 'tasks-icon',
        type: 'symbol',
        source: 'tasks',
        layout: {
          'icon-image': [
            'match',
            ['get', 'taskStatus'],
            'LOCKED_FOR_MAPPING', 'lock',
            'LOCKED_FOR_VALIDATION', 'lock',
            ''
          ],
          'icon-size': 0.7
        }
      });
      map.addLayer({
        id: 'tasks-fill',
        type: 'fill',
        source: 'tasks',
        paint: {
          'fill-color': [
            'match',
            ['get', 'taskStatus'],
            'READY', '#fff',
            'LOCKED_FOR_MAPPING', '#fff',
            'MAPPED', '#a1d7e5',
            'LOCKED_FOR_VALIDATION', '#a1d7e5',
            'VALIDATED', '#6cb570',
            'INVALIDATED', '#e6e6e6',
            'BADIMAGERY', '#e04141',
            'rgba(0,0,0,0)'
          ],
        }
      }, 'tasks-icon');
      map.addLayer({
        id: 'selected-tasks-border',
        type: 'line',
        source: 'tasks',
        paint: {
          'line-color': '#2c3038',
          'line-width': 2
        },
        filter: ['in', 'taskId', ''],
      });
      map.addLayer({
        id: 'unselected-tasks-border',
        type: 'line',
        source: 'tasks',
        paint: {
          'line-color': '#f6f6f6',
          'line-width': 2
        },
      }, 'selected-tasks-border');

      if (projectId === activeProject) {
        map.setFilter('selected-tasks-border', ['in', 'taskId'].concat(activeTasks));
      }

      map.fitBounds(extent(mapResults), {padding: 40});

      map.on('mouseenter', 'tasks-fill', function(e) {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'tasks-fill', function(e) {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = '';
      });

      map.on('click', 'tasks-fill', e => {
        const value = e.features && e.features[0].properties && e.features[0].properties.taskId;
        console.log(value);
        map.setFilter('selected-tasks-border', ['in', 'taskId'].concat(activeTasks.concat(value)));
        dispatch({
          type: 'SET_ACTIVE_TASKS',
          activeTasks: [value]
        });
        dispatch({
          type: 'SET_ACTIVE_PROJECT',
          activeProject: projectId
        });
      });
    };

    const someResultsReady = mapResults && mapResults.features && mapResults.features.length > 0;

    const mapReadyTasksReady =
      map !== null &&
      map.isStyleLoaded() &&
      map.getSource('tasks') === undefined &&
      someResultsReady;
    const tasksReadyMapLoading =
      map !== null &&
      !map.isStyleLoaded() &&
      map.getSource('tasks') === undefined &&
      someResultsReady;

    /* set up style/sources for the map, either immediately or on base load */
    if (mapReadyTasksReady) {
      mapboxLayerDefn();
    } else if (tasksReadyMapLoading) {
      map.on('load', mapboxLayerDefn);
    }

    /* refill the source on mapResults changes */
    if (map !== null && map.getSource('tasks') !== undefined && someResultsReady) {
      map.getSource('tasks').setData(mapResults);
    }
  }, [map, mapResults, activeProject, activeTasks, projectId, dispatch]);

  return <div id="map" className={`vh-75-l vh-50 fr ${className}`} ref={mapRef}></div>;
};

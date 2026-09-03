import { createRef, useLayoutEffect, useMemo, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import bbox from '@turf/bbox';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { FormattedMessage, useIntl } from 'react-intl';

import { NineCellsGridIcon, LoadingIcon } from '../svgIcons';

import WebglUnsupported from '../webglUnsupported';
import isWebglSupported from '../../utils/isWebglSupported';
import useSetRTLTextPlugin from '../../utils/useSetRTLTextPlugin';
import messages from './messages';
import { TASK_COLOURS, MAP_STYLE } from '../../config';
import lock from '../../assets/img/lock.png';
import redlock from '../../assets/img/red-lock.png';

let lockIcon = new Image(17, 20);
lockIcon.src = lock;

let redlockIcon = new Image(17, 20);
redlockIcon.src = redlock;

export const TasksMap = ({
  className,
  mapResults,
  taskBordersMap,
  priorityAreas,
  taskBordersOnly,
  taskCentroidMap,
  disableScrollZoom,
  selectTask,
  zoomedTaskId,
  navigate,
  animateZoom = true,
  showTaskIds = false,
  selected: selectedOnMap,
  invalidatedTasksData,
  showChoropleth = false,
  isChoroplethLoading = false,
  showHoverTooltip = false,
  onToggleChoropleth,
}) => {
  const intl = useIntl();
  const mapRef = createRef();
  const authDetails = useSelector((state) => state.auth.userDetails);
  const [hoveredTaskId, setHoveredTaskId] = useState(null);

  // taskId -> invalidation count, shared by the choropleth layer and its hover tooltip
  const invalidationCountMap = useMemo(() => {
    const countMap = {};
    (invalidatedTasksData || []).forEach(({ taskId, invalidatedCount }) => {
      countMap[taskId] = invalidatedCount;
    });
    return countMap;
  }, [invalidatedTasksData]);
  // Distinguishes "counts haven't loaded yet" from "every task has zero invalidations"
  const hasInvalidationData = Array.isArray(invalidatedTasksData);

  const [map, setMapObj] = useState(null);
  const lastZoomedIdRef = useRef(null);

  useSetRTLTextPlugin();

  useLayoutEffect(() => {
    /* May be able to refactor this to just take
     * advantage of useRef instead inside other useLayoutEffect() */
    /* I referenced this initially https://philipprost.com/how-to-use-mapbox-gl-with-react-functional-component/ */
    isWebglSupported() &&
      setMapObj(
        new maplibregl.Map({
          container: mapRef.current,
          style: MAP_STYLE,
          center: [0, 0],
          zoom: 1,
          attributionControl: false,
        }).addControl(new maplibregl.AttributionControl({ compact: false })),
      );

    return () => {
      map && map.remove();
    };
    // eslint-disable-next-line
  }, []);

  useLayoutEffect(() => {
    // scale to a specific task or a group of tasks
    if (map && zoomedTaskId && mapResults?.features) {
      // Avoid re-zooming to the same task ID(s) repeatedly
      // if mapResults or other dependencies change.
      const serializedId = JSON.stringify(zoomedTaskId);
      if (lastZoomedIdRef.current === serializedId) return;

      const ids = Array.isArray(zoomedTaskId) ? zoomedTaskId : [zoomedTaskId];
      const selectedFeatures = mapResults.features.filter((feature) =>
        ids.includes(feature.properties.taskId),
      );

      if (selectedFeatures.length > 0) {
        const fc = {
          type: 'FeatureCollection',
          features: selectedFeatures,
        };
        map.fitBounds(bbox(fc), { padding: 40, animate: animateZoom, maxZoom: 22 });
        lastZoomedIdRef.current = serializedId;
      }
    }

    if (!zoomedTaskId || (Array.isArray(zoomedTaskId) && zoomedTaskId.length === 0)) {
      lastZoomedIdRef.current = null;
    }
  }, [zoomedTaskId, map, mapResults, animateZoom]);

  useLayoutEffect(() => {
    const onSelectTaskClick = (e) => {
      const task = e.features?.[0].properties;
      selectTask?.(task.taskId, task.taskStatus);
    };

    const countryMapLayers = [
      taskBordersMap && 'outerhull-tasks-border',
      taskBordersMap && 'point-tasks-centroid',
      taskBordersMap && 'point-tasks-centroid-inner',
    ];
    const taskMapLayers = [
      'tasks-icon',
      'tasks-fill',
      'selected-tasks-border',
      'unselected-tasks-border',
      taskBordersMap && 'outerhull-tasks-border',
    ];

    const updateTMZoom = () => {
      // if zoomedTaskId is present, the effect above handles it.
      // otherwise, fit bounds to all tasks.
      if (!zoomedTaskId || (Array.isArray(zoomedTaskId) && zoomedTaskId.length === 0)) {
        if (!taskBordersOnly) {
          map.fitBounds(bbox(mapResults), { padding: 40, animate: animateZoom });
        } else {
          map.fitBounds(bbox(mapResults), { padding: 220, maxZoom: 6.5, animate: animateZoom });
        }
      }
    };

    const maplibreLayerDefn = () => {
      map.once('load', () => {
        map.resize();
      });
      if (map.getSource('tasks') === undefined) {
        map.addImage('lock', lockIcon, { width: 17, height: 20, data: lockIcon });
        map.addImage('redlock', redlockIcon, { width: 30, height: 30, data: redlockIcon });

        map.addSource('tasks', {
          type: 'geojson',
          data: mapResults,
        });

        map.addControl(new maplibregl.NavigationControl());
        if (disableScrollZoom) {
          // disable map zoom when using scroll
          map.scrollZoom.disable();
        } else {
          map.scrollZoom.enable();
        }
        const locked = [
          'any',
          ['==', ['to-string', ['get', 'taskStatus']], 'LOCKED_FOR_MAPPING'],
          ['==', ['to-string', ['get', 'taskStatus']], 'LOCKED_FOR_VALIDATION'],
        ];

        let taskStatusCondition = ['case'];

        if (authDetails.id !== undefined) {
          const all_condition = ['all', locked, ['==', ['get', 'lockedBy'], authDetails.id]];
          taskStatusCondition = [...taskStatusCondition, ...[all_condition, 'redlock']];
        }
        taskStatusCondition = [...taskStatusCondition, ...[locked, 'lock', '']];

        map.addLayer({
          id: 'tasks-icon',
          type: 'symbol',
          source: 'tasks',
          layout: {
            'icon-image': taskStatusCondition,
            'icon-size': 0.7,
          },
        });

        map.addLayer(
          {
            id: 'tasks-fill',
            type: 'fill',
            source: 'tasks',
            paint: {
              'fill-color': [
                'match',
                ['get', 'taskStatus'],
                'READY',
                TASK_COLOURS.READY,
                'LOCKED_FOR_MAPPING',
                TASK_COLOURS.LOCKED_FOR_MAPPING,
                'MAPPED',
                TASK_COLOURS.MAPPED,
                'LOCKED_FOR_VALIDATION',
                TASK_COLOURS.LOCKED_FOR_VALIDATION,
                'VALIDATED',
                TASK_COLOURS.VALIDATED,
                'INVALIDATED',
                TASK_COLOURS.INVALIDATED,
                'BADIMAGERY',
                TASK_COLOURS.BADIMAGERY,
                'rgba(0,0,0,0)',
              ],
              'fill-opacity': 0.8,
            },
          },
          'tasks-icon',
        );

        map.addLayer({
          id: 'selected-tasks-border',
          type: 'line',
          source: 'tasks',
          paint: {
            'line-color': '#2c3038',
            'line-width': 2,
          },
          filter:
            selectedOnMap === undefined || selectedOnMap.length === 0
              ? ['in', 'taskId', '']
              : ['in', 'taskId'].concat(selectedOnMap),
        });

        map.addLayer(
          {
            id: 'unselected-tasks-border',
            type: 'line',
            source: 'tasks',
            paint: {
              'line-color': '#999db6',
              'line-width': 1,
            },
          },
          'selected-tasks-border',
        );
      }

      if (map.getSource('tasks-outline') === undefined && taskBordersMap) {
        map.addSource('tasks-outline', {
          type: 'geojson',
          data: taskBordersMap,
        });

        map.addLayer({
          id: 'outerhull-tasks-border',
          type: 'line',
          source: 'tasks-outline',
          paint: {
            'line-color': '#68707f',
            'line-width': {
              base: 0.3,
              stops: [
                [1, 4],
                [10, 1],
                [12, 0.3],
              ],
            },
          },
          layout: {
            visibility: 'visible',
          },
        });
      }

      if (map.getSource('priority-area') === undefined && priorityAreas) {
        const priorityFeatureCollection = {
          type: 'FeatureCollection',
          features: priorityAreas.map((poly) => ({ type: 'Feature', geometry: poly })),
        };
        map.addSource('priority-area', {
          type: 'geojson',
          data: priorityFeatureCollection,
        });

        map.addLayer({
          id: 'priority-area-border',
          type: 'line',
          source: 'priority-area',
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

        map.addLayer(
          {
            id: 'priority-area',
            type: 'fill',
            source: 'priority-area',
            paint: {
              'fill-color': '#d73f3f',
              'fill-outline-color': '#d73f3f',
              'fill-opacity': 0.4,
            },
            layout: {
              visibility: 'visible',
            },
          },
          'tasks-fill',
        );
      }

      if (map.getSource('tasks-centroid') === undefined && taskBordersMap && taskCentroidMap) {
        map.addSource('tasks-centroid', {
          type: 'geojson',
          data: taskCentroidMap,
        });

        map.addLayer({
          id: 'point-tasks-centroid-inner',
          type: 'circle',
          source: 'tasks-centroid',
          paint: {
            'circle-radius': {
              base: 3,
              stops: [
                [12, 4],
                [22, 180],
              ],
            },
            'circle-color': '#FFF',
          },
          layout: {
            visibility: 'visible',
          },
        });

        map.addLayer(
          {
            id: 'point-tasks-centroid',
            type: 'circle',
            source: 'tasks-centroid',
            paint: {
              'circle-radius': {
                base: 5,
                stops: [
                  [12, 10],
                  [22, 180],
                ],
              },
              'circle-color': '#d73f3f',
            },
            layout: {
              visibility: 'visible',
            },
          },
          'point-tasks-centroid-inner',
        );
      }
      map.on('mousemove', 'tasks-fill', function (e) {
        // To now allow validators to select tasks that they mapped
        if (
          !(
            e.features[0].properties.mappedBy === authDetails.id &&
            e.features[0].properties.taskStatus === 'MAPPED'
          )
        ) {
          map.getCanvas().style.cursor = 'pointer';
        }
        if (showTaskIds) {
          // when the user hover on a task they are validating, enable the task id dialog
          if (e.features[0].properties.lockedBy === authDetails.id) {
            setHoveredTaskId(e.features[0].properties.taskId);
          } else {
            setHoveredTaskId(null);
          }
        }
      });

      if (taskBordersOnly && navigate) {
        let navigateInProgress = false;
        const navigateToTasks = () => {
          if (!navigateInProgress) {
            navigateInProgress = true;
            navigate('./tasks');
          }
        };
        map.on('mouseenter', 'point-tasks-centroid', function (e) {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'point-tasks-centroid', function (e) {
          map.getCanvas().style.cursor = '';
        });
        map.on('click', 'point-tasks-centroid', navigateToTasks);
        map.on('click', 'point-tasks-centroid-inner', navigateToTasks);
      }

      map.on('click', 'tasks-fill', onSelectTaskClick);
      map.on('mouseleave', 'tasks-fill', function (e) {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = '';
        // disable the task id dialog when the mouse go outside the task grid
        showTaskIds && setHoveredTaskId(null);
      });
      updateTMZoom();
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
    const mapLayersAlreadyDefined = map !== null && map.getSource('tasks') !== undefined;

    /* set up style/sources for the map, either immediately (style already
     * parsed) or on the 'style.load' event. We intentionally do NOT wait for
     * the 'load' event: 'load' only fires after the first visually complete
     * render, which includes the base raster tiles downloading. On a slow
     * connection that would keep the task grid hidden until the imagery
     * appears, so we draw the grid as soon as the style is ready instead. */
    if (mapReadyTasksReady && !mapLayersAlreadyDefined) {
      maplibreLayerDefn();
    } else if (tasksReadyMapLoading && !mapLayersAlreadyDefined) {
      // 'style.load' fires once the style JSON is parsed, before the base
      // raster tiles finish downloading — unlike 'load', which waits for the
      // first complete render (tiles included). Using it keeps the task grid
      // from being blocked behind slow base imagery.
      map.once('style.load', () => {
        if (map.getSource('tasks') === undefined) maplibreLayerDefn();
      });
    } else if (tasksReadyMapLoading || mapReadyTasksReady) {
      console.error('One of the hook dependencies changed and try to redefine the map');
    }

    /* refill the source on mapResults changes */
    if (mapLayersAlreadyDefined && someResultsReady) {
      map.getSource('tasks').setData(mapResults);

      /* update the click event so its functional scope can see the
       *  new selectedOnMap to be able to toggle it off.
       *  These will accumulate and need cleanup. */
      map.on('click', 'tasks-fill', onSelectTaskClick);

      if (taskBordersOnly === true) {
        taskMapLayers.forEach((lr) => lr && map.setLayoutProperty(lr, 'visibility', 'none'));
        countryMapLayers.forEach((lr) => lr && map.setLayoutProperty(lr, 'visibility', 'visible'));
      } else {
        countryMapLayers.forEach((lr) => lr && map.setLayoutProperty(lr, 'visibility', 'none'));
        taskMapLayers.forEach((lr) => lr && map.setLayoutProperty(lr, 'visibility', 'visible'));
        if (disableScrollZoom) {
          updateTMZoom();
        }
        if (selectedOnMap && selectedOnMap.length > 0) {
          map.setFilter('selected-tasks-border', ['in', 'taskId'].concat(selectedOnMap));
        } else {
          map.setFilter('selected-tasks-border', ['in', 'taskId', '']);
        }
      }
    }

    return () => {
      /* cleanup any extra click event listeners after each effect */
      if (map !== null && map.getSource('tasks') !== undefined && someResultsReady) {
        map.off('click', 'tasks-fill', onSelectTaskClick);
        countryMapLayers.forEach((lr) => lr && map.setLayoutProperty(lr, 'visibility', 'none'));
        taskMapLayers.forEach((lr) => lr && map.setLayoutProperty(lr, 'visibility', 'none'));
      }
    };
  }, [
    map,
    mapResults,
    priorityAreas,
    selectedOnMap,
    selectTask,
    taskBordersMap,
    taskCentroidMap,
    taskBordersOnly,
    disableScrollZoom,
    navigate,
    animateZoom,
    authDetails.id,
    showTaskIds,
    zoomedTaskId,
    authDetails.username,
    intl,
  ]);

  /* ------------------------------------------------------------------
   * Choropleth effect: add / update / remove the invalidation-count layer
   * ------------------------------------------------------------------ */
  useLayoutEffect(() => {
    if (!map) return;

    const CHOROPLETH_SOURCE = 'tasks-invalidation-choropleth';
    const CHOROPLETH_LAYER = 'tasks-invalidation-fill';

    const buildChoroplethGeoJSON = () => {
      if (!mapResults || !hasInvalidationData) return null;
      return {
        type: 'FeatureCollection',
        features: mapResults.features.map((f) => ({
          ...f,
          properties: {
            ...f.properties,
            invalidatedCount: invalidationCountMap[f.properties.taskId] || 0,
          },
        })),
      };
    };

    if (!showChoropleth) {
      // Restore the normal task-status fill opacity
      if (map.getLayer('tasks-fill')) {
        map.setPaintProperty('tasks-fill', 'fill-opacity', 0.8);
      }
      // Hide the choropleth overlay
      if (map.getLayer(CHOROPLETH_LAYER)) {
        map.setLayoutProperty(CHOROPLETH_LAYER, 'visibility', 'none');
      }
      return;
    }

    if (!hasInvalidationData || !mapResults?.features?.length) return;

    const geojson = buildChoroplethGeoJSON();
    if (!geojson) return;

    const addOrUpdateLayer = () => {
      try {
        // Make tasks-fill invisible (opacity=0) but keep it in the layer stack
        // so MapLibre click hit-testing still works on it.
        if (map.getLayer('tasks-fill')) {
          map.setPaintProperty('tasks-fill', 'fill-opacity', 0);
        }

        if (map.getSource(CHOROPLETH_SOURCE)) {
          map.getSource(CHOROPLETH_SOURCE).setData(geojson);
          if (map.getLayer(CHOROPLETH_LAYER)) {
            map.setLayoutProperty(CHOROPLETH_LAYER, 'visibility', 'visible');
          }
          return;
        }

        map.addSource(CHOROPLETH_SOURCE, { type: 'geojson', data: geojson });

        const layerDef = {
          id: CHOROPLETH_LAYER,
          type: 'fill',
          source: CHOROPLETH_SOURCE,
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'invalidatedCount'],
              0,
              '#f9fafb', // never invalidated: near-white
              1,
              '#fde68a', // once: light amber
              3,
              '#f97316', // moderate: orange
              6,
              '#b91c1c', // high: deep red
            ],
            'fill-opacity': 1,
          },
          layout: { visibility: 'visible' },
        };

        // Insert BEFORE the border layers so grid lines always render on top.
        // Fall back to appending only if no border layers exist yet.
        const beforeLayer = map.getLayer('unselected-tasks-border')
          ? 'unselected-tasks-border'
          : map.getLayer('selected-tasks-border')
          ? 'selected-tasks-border'
          : undefined;

        if (beforeLayer) {
          map.addLayer(layerDef, beforeLayer);
        } else {
          map.addLayer(layerDef);
        }
      } catch (err) {
        console.error('[Choropleth] Failed to add/update invalidation layer:', err);
      }
    };

    // Attempt to add the layer immediately if the map is fully ready.
    // If not (e.g. style still loading or tasks source not yet registered),
    // defer to the next 'idle' event, which fires once all sources/tiles settle.
    if (map.isStyleLoaded() && map.getSource('tasks') !== undefined) {
      addOrUpdateLayer();
    } else {
      // 'load' only fires once and may already have fired; use 'idle' as
      // a reliable one-shot that fires after all pending operations settle.
      const onIdle = () => {
        addOrUpdateLayer();
        map.off('idle', onIdle);
      };
      map.on('idle', onIdle);
      return () => map.off('idle', onIdle);
    }
  }, [map, showChoropleth, hasInvalidationData, invalidationCountMap, mapResults]);

  /* ------------------------------------------------------------------
   * Task hover: outline the hovered task and show a pointer-following
   * tooltip with its id and status. While the choropleth is on, the
   * tooltip also carries the task's invalidation count.
   * ------------------------------------------------------------------ */
  useLayoutEffect(() => {
    if (!map || !showHoverTooltip) return;

    const HOVER_LAYER = 'hovered-task-border';

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: {
        top: [-12, 0],
        bottom: [0, -12],
        left: [0, -12],
        right: [-12, 0],
      },
    }).trackPointer();

    let lastTaskId = null;

    const buildPopupHTML = ({ taskId, taskStatus, mappedBy }) => {
      const lines = [
        `<div class="fw6">${intl.formatMessage(messages.taskId, { id: taskId })}</div>`,
      ];
      const statusMessage = messages[`taskStatus_${taskStatus}`];
      if (statusMessage) {
        lines.push(`<div>${intl.formatMessage(statusMessage)}</div>`);
      }
      if (showChoropleth && hasInvalidationData) {
        lines.push(
          `<div>${intl.formatMessage(messages.invalidationCountTooltip, {
            count: invalidationCountMap[taskId] || 0,
          })}</div>`,
        );
      }
      // Validators can't select tasks they mapped themselves, so warn on hover
      if (mappedBy === authDetails.id && taskStatus === 'MAPPED') {
        lines.push(`<div class="red">${intl.formatMessage(messages.cantValidateMappedTask)}</div>`);
      }
      return `<div class="base-font f6 dark-gray">${lines.join('')}</div>`;
    };

    const highlightTask = (taskId) => {
      if (!map.getLayer(HOVER_LAYER)) return;
      map.setFilter(
        HOVER_LAYER,
        taskId === null ? ['in', 'taskId', ''] : ['==', ['get', 'taskId'], taskId],
      );
    };

    const onMouseMove = (e) => {
      const properties = e.features?.[0]?.properties;
      if (!properties || properties.taskId === undefined || properties.taskId === null) return;
      // Only rebuild the tooltip and the highlight when the hovered task changes
      if (properties.taskId !== lastTaskId) {
        lastTaskId = properties.taskId;
        popup.setHTML(buildPopupHTML(properties));
        highlightTask(properties.taskId);
      }
      if (!popup.isOpen()) popup.addTo(map);
    };

    const onMouseLeave = () => {
      lastTaskId = null;
      popup.remove();
      highlightTask(null);

      // Cursor style won't change to original state with trackPointer()
      // https://github.com/mapbox/mapbox-gl-js/issues/12223
      if (map._canvasContainer) {
        map._canvasContainer.classList.remove('maplibregl-track-pointer');
      }
    };

    const setup = () => {
      if (!map.getLayer(HOVER_LAYER)) {
        map.addLayer({
          id: HOVER_LAYER,
          type: 'line',
          source: 'tasks',
          paint: {
            'line-color': '#2c3038',
            'line-width': 3,
          },
          filter: ['in', 'taskId', ''],
        });
      }
      map.on('mousemove', 'tasks-fill', onMouseMove);
      map.on('mouseleave', 'tasks-fill', onMouseLeave);
    };

    const teardown = () => {
      map.off('mousemove', 'tasks-fill', onMouseMove);
      map.off('mouseleave', 'tasks-fill', onMouseLeave);
      popup.remove();
      if (map.getLayer(HOVER_LAYER)) map.removeLayer(HOVER_LAYER);
    };

    // Wait for the tasks layer to exist before binding, otherwise MapLibre logs
    // errors when the delegated listener queries a layer that isn't there yet.
    if (map.getLayer('tasks-fill')) {
      setup();
      return teardown;
    }

    const onIdle = () => {
      if (!map.getLayer('tasks-fill')) return;
      map.off('idle', onIdle);
      setup();
    };
    map.on('idle', onIdle);
    return () => {
      map.off('idle', onIdle);
      teardown();
    };
  }, [
    map,
    showHoverTooltip,
    showChoropleth,
    hasInvalidationData,
    invalidationCountMap,
    authDetails.id,
    intl,
  ]);

  let choroplethToggleMessage = messages.invalidationChoroplethToggle;
  if (showChoropleth) choroplethToggleMessage = messages.invalidationChoroplethToggleOff;
  if (isChoroplethLoading) choroplethToggleMessage = messages.invalidationChoroplethLoading;

  if (!isWebglSupported()) {
    return <WebglUnsupported className={`w-100 h-100 fr ${className || ''}`} />;
  } else {
    return (
      <>
        {showTaskIds && hoveredTaskId && (
          <div className="absolute top-1 left-1 bg-red white base-font fw8 f5 ph3 pv2 z-5 mr2">
            <FormattedMessage {...messages.taskId} values={{ id: hoveredTaskId }} />
          </div>
        )}

        {/* Choropleth toggle — icon-only square, grouped below zoom controls */}
        {onToggleChoropleth && (
          <button
            id="invalidation-choropleth-toggle"
            onClick={onToggleChoropleth}
            title={intl.formatMessage(choroplethToggleMessage)}
            aria-busy={isChoroplethLoading}
            style={{
              position: 'absolute',
              top: 103, // 10px margin + 58px zoom cluster + 29px compass + 6px gap
              right: 10,
              zIndex: 5,
              width: 29,
              height: 29,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              border: 'none',
              borderRadius: 4,
              background: showChoropleth ? '#fff0f0' : '#ffffff',
              cursor: 'pointer',
              // Matches MapLibre's .maplibregl-ctrl-group box-shadow exactly
              boxShadow: '0 0 0 2px rgba(0,0,0,.1)',
              transition: 'background 0.15s',
            }}
          >
            {isChoroplethLoading ? (
              <LoadingIcon className="red h1 w1" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <NineCellsGridIcon
                style={{
                  width: 15,
                  height: 15,
                  fill: showChoropleth ? '#d73f3f' : '#404040',
                  transition: 'fill 0.15s',
                }}
              />
            )}
          </button>
        )}

        <div id="map" className={className} ref={mapRef}></div>
      </>
    );
  }
};

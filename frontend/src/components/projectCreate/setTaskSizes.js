import { useEffect, useLayoutEffect, useState, useCallback } from 'react';
import area from '@turf/area';
import transformScale from '@turf/transform-scale';
import { featureCollection } from '@turf/helpers';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { splitTaskGrid, makeGrid } from '../../utils/taskGrid';
import { CustomButton } from '../button';
import {
  UndoIcon,
  MappedIcon,
  CircleIcon,
  FourCellsGridIcon,
  NineCellsGridIcon,
} from '../svgIcons';
import { getAllFeatures, removeFeaturesById } from '../../utils/terrawDraw';

export default function SetTaskSizes({ metadata, mapObj, updateMetadata }) {
  const [splitMode, setSplitMode] = useState(null);

  const splitHandler = useCallback(
    (event) => {
      const taskGrid = mapObj.map.getSource('grid')._data;

      if (metadata.tempTaskGrid === null) {
        updateMetadata({ ...metadata, tempTaskGrid: taskGrid });
      }
      // Make the geom smaller to avoid borders.
      const geom = transformScale(event.features[0].geometry, 0.5);
      const newTaskGrid = splitTaskGrid(taskGrid, geom);

      updateMetadata({
        ...metadata,
        taskGrid: featureCollection(newTaskGrid),
        tasksNumber: featureCollection(newTaskGrid).features.length,
      });
    },
    [updateMetadata, metadata, mapObj.map],
  );

  useEffect(() => {
    if (splitMode === 'click') {
      mapObj.map.on('mouseenter', 'grid', (event) => {
        mapObj.map.getCanvas().style.cursor = 'pointer';
      });
      mapObj.map.on('mouseleave', 'grid', (event) => {
        mapObj.map.getCanvas().style.cursor = '';
      });
      mapObj.map.on('click', 'grid', splitHandler);
    } else {
      mapObj.map.on('mouseenter', 'grid', (event) => {
        mapObj.map.getCanvas().style.cursor = '';
      });
      mapObj.map.off('click', 'grid', splitHandler);
    }
  }, [mapObj, splitHandler, splitMode]);

  const splitDrawing = useCallback(() => {
    const drawInstance = mapObj.draw.getTerraDrawInstance();
    if (!drawInstance) return;

    if (splitMode === 'draw') {
      setSplitMode(null);
      drawInstance.setMode('select');
      return;
    }
    setSplitMode('draw');
    drawInstance.setMode('polygon');

    drawInstance.on('finish', (id) => {
      const allFeatures = getAllFeatures(drawInstance);
      const previousFeatureIds = allFeatures.reduce(
        (prev, curr) => (curr.id !== id ? [...prev, curr.id] : prev),
        [],
      );
      const newFeature = allFeatures.filter((f) => f.id === id);

      if (previousFeatureIds.length > 0) {
        removeFeaturesById(drawInstance, previousFeatureIds);
      }

      if (newFeature.length > 0) {
        const geom = newFeature[0].geometry;
        const taskGrid = mapObj.map.getSource('grid')._data;
        if (metadata.tempTaskGrid === null) {
          updateMetadata({ ...metadata, tempTaskGrid: taskGrid });
        }

        const newTaskGrid = splitTaskGrid(taskGrid, geom);

        updateMetadata({
          ...metadata,
          taskGrid: featureCollection(newTaskGrid),
          tasksNumber: featureCollection(newTaskGrid).features.length,
        });
      }
      removeFeaturesById(drawInstance, [id]);
      drawInstance.setMode('select');
      setSplitMode(null);
    });
  }, [mapObj.draw, mapObj.map, splitMode, metadata, updateMetadata]);

  const resetGrid = () => {
    updateMetadata({ ...metadata, taskGrid: metadata.tempTaskGrid });
  };

  const smallerSize = useCallback(() => {
    const zoomLevel = metadata.zoomLevel + 1;
    const squareGrid = makeGrid(metadata.geom, zoomLevel);
    updateMetadata({
      ...metadata,
      zoomLevel: zoomLevel,
      tempTaskGrid: squareGrid,
      taskGrid: squareGrid,
      tasksNumber: squareGrid.features.length,
    });
  }, [metadata, updateMetadata]);

  const largerSize = useCallback(() => {
    const zoomLevel = metadata.zoomLevel - 1;
    const squareGrid = makeGrid(metadata.geom, zoomLevel);
    if (zoomLevel > 0) {
      updateMetadata({
        ...metadata,
        zoomLevel: zoomLevel,
        tempTaskGrid: squareGrid,
        taskGrid: squareGrid,
        tasksNumber: squareGrid.features.length,
      });
    }
  }, [metadata, updateMetadata]);

  useLayoutEffect(() => {
    if (mapObj.map.getSource('grid') !== undefined) {
      mapObj.map.getSource('grid').setData(metadata.taskGrid);
    } else {
      mapObj.map.addSource('grid', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: metadata.taskGrid },
      });
    }
    return () => {
      // remove the split on click function when leaving the page
      mapObj.map.off('click', 'grid', splitHandler);
    };
  }, [metadata, mapObj, smallerSize, largerSize, splitHandler]);

  return (
    <>
      <h3 className="f3 ttu fw6 mt2 mb3 barlow-condensed blue-dark">
        <FormattedMessage {...messages.step2} />
      </h3>
      <div>
        <div>
          <p>
            <FormattedMessage {...messages.taskSizes} />
          </p>
          <div role="group">
            <CustomButton
              className="bg-white blue-dark ba b--grey-light ph3 pv2 mr2"
              onClick={smallerSize}
              icon={<NineCellsGridIcon className="h1 w1 v-mid" />}
            >
              <FormattedMessage {...messages.smaller} />
            </CustomButton>
            <CustomButton
              className="bg-white blue-dark ba b--grey-light ph3 pv2"
              onClick={largerSize}
              icon={<FourCellsGridIcon className="h1 w1 v-mid" />}
            >
              <FormattedMessage {...messages.larger} />
            </CustomButton>
          </div>
        </div>
        <div className="pt3 pb1">
          <p>
            <FormattedMessage {...messages.splitTaskDescription} />
          </p>
          <div role="group">
            <CustomButton
              className={`bg-white ph3 pv2 mr2 ba ${
                splitMode === 'click' ? 'red b--red' : 'blue-dark b--grey-light'
              }`}
              onClick={() => setSplitMode(splitMode === 'click' ? null : 'click')}
              icon={<CircleIcon className="v-mid" style={{ width: '0.5rem' }} />}
            >
              <FormattedMessage {...messages.splitByClicking} />
            </CustomButton>
            <CustomButton
              className={`bg-white ph3 pv2 mr2 ba ${
                splitMode === 'draw' ? 'red b--red' : 'blue-dark b--grey-light'
              }`}
              onClick={splitDrawing}
              icon={<MappedIcon className="h1 w1 v-mid" />}
            >
              <FormattedMessage {...messages.splitByDrawing} />
            </CustomButton>
            <CustomButton
              className="bg-white blue-dark ba b--grey-light ph3 pv2"
              onClick={resetGrid}
              icon={<UndoIcon className="w1 h1 v-mid" />}
            >
              <FormattedMessage {...messages.reset} />
            </CustomButton>
          </div>
        </div>
        <p className="f6 blue-grey lh-title mt3 mb2">
          <FormattedMessage
            {...messages.taskNumberMessage}
            values={{ n: <strong>{metadata.tasksNumber || 0}</strong> }}
          />
        </p>
        <p className="f6 blue-grey lh-title mt1">
          {metadata.taskGrid && metadata.taskGrid.features && (
            <FormattedMessage
              {...messages.taskAreaMessage}
              values={{
                area: (
                  <strong>{(area(metadata.taskGrid.features[0]) / 1e6).toFixed(2) || 0}</strong>
                ),
                sq: <sup>2</sup>,
              }}
            />
          )}
        </p>
      </div>
    </>
  );
}

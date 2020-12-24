import React, { useLayoutEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { useDropzone } from 'react-dropzone';
import { featureCollection } from '@turf/helpers';
import MapboxDraw from '@mapbox/mapbox-gl-draw';

import messages from './messages';
import { UndoIcon } from '../svgIcons';
import { Button } from '../button';
import { SwitchToggle } from '../formInputs';
import { useContainsMultiplePolygons } from '../../hooks/UseGeomContainsMultiplePolygons';

export default function SetAOI({ mapObj, metadata, updateMetadata, uploadFile, setDataGeom, deleteHandler }) {
  //clean up map draw control and reload
  useLayoutEffect(() => {
    if (mapObj.map !== null) {
      mapObj.map.getLayer('aoi') && mapObj.map.removeControl(mapObj.draw);
      mapObj.draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true
        }
      });
      mapObj.map.addControl(mapObj.draw, 'top-left');
    };
  // eslint-disable-next-line
  },[mapObj.map]);

  useLayoutEffect(() => {
    if (mapObj.map !== null) {
      const updateArea = (event) => {
        const features = mapObj.draw.getAll();
        if (features.features.length > 1) {
          const id = features.features[0].id;
          mapObj.draw.delete(id);
        }
        // Validate area first.
        const geom = featureCollection(event.features);
        setDataGeom(geom, true);
      };

      mapObj.map.on('draw.create', updateArea);
      mapObj.map.on('draw.update', updateArea);
      mapObj.map.on('draw.delete',deleteHandler);
    };
  }, [mapObj, setDataGeom, deleteHandler]);

  const { containsMultiplePolygons } = useContainsMultiplePolygons(metadata.geom);
  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop: uploadFile,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div {...getRootProps()}>
      <h3 className="f3 fw6 mt2 mb3 ttu barlow-condensed blue-dark">
        <FormattedMessage {...messages.step1} />
      </h3>
      <div className="pb4">
        <p>
          <FormattedMessage {...messages.defineAreaDescription} />
        </p>
        <input {...getInputProps()} />
        <Button className="bg-blue-dark white" onClick={open}>
          <FormattedMessage {...messages.selectFile} />
        </Button>
        <p>
          <FormattedMessage {...messages.importDescription} />
        </p>
      </div>

      <div className="pb2">
        {containsMultiplePolygons && (
          <SwitchToggle
            label={<FormattedMessage {...messages.arbitraryTasks} />}
            labelPosition="right"
            isChecked={metadata.arbitraryTasks}
            onChange={() =>
              updateMetadata({ ...metadata, arbitraryTasks: !metadata.arbitraryTasks })
            }
          />
        )}
      </div>
      {metadata.geom && (
        <div className="pv3">
          <Button className="bg-white blue-dark" onClick={deleteHandler}>
            <UndoIcon className="w1 h1 mr2 v-mid pb1" />
            <FormattedMessage {...messages.reset} />
          </Button>
        </div>
      )}
    </div>
  );
}

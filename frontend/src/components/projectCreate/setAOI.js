import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useDropzone } from 'react-dropzone';

import messages from './messages';
import { UndoIcon } from '../svgIcons';
import { Button } from '../button';
import { SwitchToggle } from '../formInputs';
import { useContainsMultiplePolygons } from '../../hooks/UseGeomContainsMultiplePolygons';

export default function SetAOI({
  metadata,
  updateMetadata,
  uploadFile,
  drawHandler,
  deleteHandler,
}) {
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
        <Button className="bg-blue-dark white mr2" onClick={drawHandler}>
          <FormattedMessage {...messages.draw} />
        </Button>
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

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useDropzone } from 'react-dropzone';

import messages from './messages';
import { UndoIcon, MappedIcon, FileImportIcon } from '../svgIcons';
import { CustomButton } from '../button';
import { SwitchToggle } from '../formInputs';
import { useContainsMultiplePolygons } from '../../hooks/UseGeomContainsMultiplePolygons';

export default function SetAOI({
  metadata,
  updateMetadata,
  uploadFile,
  drawHandler,
  deleteHandler,
  drawIsActive,
}) {
  const { containsMultiplePolygons } = useContainsMultiplePolygons(metadata.geom);

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop: uploadFile,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div {...getRootProps()}>
      <h3 className="f3 fw6 mt0 mb3 ttu barlow-condensed blue-dark">
        <FormattedMessage {...messages.step1} />
      </h3>
      <div>
        <p>
          <FormattedMessage {...messages.defineAreaDescription} />
        </p>
        <CustomButton
          className={`bg-white ph3 pv2 mr2 ba ${
            drawIsActive ? 'red b--red' : 'blue-dark b--grey-light'
          }`}
          onClick={drawHandler}
          icon={<MappedIcon className="h1 w1 v-mid" />}
        >
          <FormattedMessage {...messages.draw} />
        </CustomButton>
        <input {...getInputProps()} />
        <CustomButton
          className="bg-white blue-dark ba b--grey-light ph3 pv2"
          onClick={open}
          icon={<FileImportIcon className="h1 w1 v-mid" />}
        >
          <FormattedMessage {...messages.selectFile} />
        </CustomButton>
        <p className="f6 blue-grey lh-title mt3">
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
              updateMetadata({
                ...metadata,
                arbitraryTasks: !metadata.arbitraryTasks,
                tasksNumber:
                  metadata.geom && metadata.geom.features ? metadata.geom.features.length : 0,
              })
            }
          />
        )}
      </div>
      {metadata.geom && (
        <div>
          <CustomButton
            className="bg-white blue-dark ba b--grey-light ph3 pv2"
            onClick={deleteHandler}
            icon={<UndoIcon className="w1 h1 v-top" />}
          >
            <FormattedMessage {...messages.reset} />
          </CustomButton>
        </div>
      )}
    </div>
  );
}

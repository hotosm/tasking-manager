import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import area from '@turf/area';
import { featureCollection } from '@turf/helpers';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import messages from './messages';
import { CustomButton } from '../button';
import { SwitchToggle } from '../formInputs';
import { CutIcon, WasteIcon } from '../svgIcons';
import { pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { useAsync } from '../../hooks/UseAsync';
import { Alert } from '../alert';

const trimTaskGrid = (params) => {
  const { clipStatus, metadata, updateMetadata, token } = params;
  const body = JSON.stringify({
    areaOfInterest: metadata.geom,
    clipToAoi: clipStatus,
    grid: metadata.tempTaskGrid,
  });

  return pushToLocalJSONAPI('projects/actions/intersecting-tiles/', body, token).then((grid) => {
    updateMetadata({ ...metadata, tasksNumber: grid.features.length, taskGrid: grid });
  });
};

const removeTinyTasks = (metadata, updateMetadata) => {
  const newTaskGrid = featureCollection(
    metadata.taskGrid.features.filter((task) => area(task) >= 2000),
  );
  updateMetadata({
    ...metadata,
    tasksNumber: newTaskGrid.features.length,
    taskGrid: newTaskGrid,
  });
};

export default function TrimProject({ metadata, mapObj, updateMetadata }) {
  const token = useSelector((state) => state.auth.token);
  const [clipStatus, setClipStatus] = useState(false);
  const [tinyTasksNumber, setTinyTasksNumber] = useState(0);

  const trimTaskGridAsync = useAsync(trimTaskGrid);

  useEffect(() => {
    mapObj.map
      .getSource('grid')
      .setData(featureCollection(metadata.taskGrid.features.filter((task) => area(task) >= 2000)));
    const tinyTasks = metadata.taskGrid.features.filter((task) => area(task) < 2000);
    mapObj.map.getSource('tiny-tasks').setData(featureCollection(tinyTasks));
    setTinyTasksNumber(tinyTasks.length);
  }, [metadata, mapObj]);

  return (
    <>
      <h3 className="f3 ttu fw6 mt2 mb3 barlow-condensed blue-dark">
        <FormattedMessage {...messages.step3} />
      </h3>
      <div>
        <p>
          <FormattedMessage {...messages.trimTasksDescriptionLine1} />
        </p>
        <p className="pb2">
          <FormattedMessage {...messages.trimTasksDescriptionLine2} />
        </p>
        {tinyTasksNumber === 0 ? (
          <>
            <SwitchToggle
              isChecked={clipStatus}
              labelPosition="right"
              onChange={() => setClipStatus(!clipStatus)}
              label={<FormattedMessage {...messages.trimToAOI} />}
            />
            <div className="pt3">
              <CustomButton
                onClick={() =>
                  trimTaskGridAsync.execute({ clipStatus, metadata, updateMetadata, token })
                }
                className="bg-white blue-dark ba b--grey-light ph3 pv2"
                loading={trimTaskGridAsync.status === 'pending'}
                icon={<CutIcon className="h1 w1 v-mid" />}
              >
                <FormattedMessage {...messages.trim} />
              </CustomButton>
            </div>
            {trimTaskGridAsync.status === 'error' && (
              <div className="mt3">
                <Alert type="error">
                  {`${trimTaskGridAsync.error.message}Error` in messages && (
                    <FormattedMessage {...messages[`${trimTaskGridAsync.error.message}Error`]} />
                  )}
                  {!(`${trimTaskGridAsync.error.message}Error` in messages) && (
                    <FormattedMessage {...messages.trimError} />
                  )}
                </Alert>
              </div>
            )}
          </>
        ) : (
          <div className="pt0 fw6">
            <div className="cf w-100 pb2">
              <div className="w-auto fl di h2">
                <span className="dib v-mid h1 w1 bg-pink mr2"></span>
              </div>
              <div className="w-auto di">
                <FormattedMessage
                  {...messages.tinyTasks}
                  values={{ number: tinyTasksNumber, area: <FormattedNumber value={2000} /> }}
                />
              </div>
            </div>
            <CustomButton
              onClick={() => removeTinyTasks(metadata, updateMetadata)}
              className="bg-white blue-dark ba b--grey-light ph3 pv2"
              icon={<WasteIcon className="h1 w1 v-mid" />}
            >
              <FormattedMessage {...messages.discard} />
            </CustomButton>
          </div>
        )}
      </div>
    </>
  );
}

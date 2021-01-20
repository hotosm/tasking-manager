import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { addLayer } from './index';
import { CustomButton } from '../button';
import { SwitchToggle } from '../formInputs';
import { CutIcon } from '../svgIcons';
import { pushToLocalJSONAPI } from '../../network/genericJSONRequest';

const clipProject = (clip, metadata, map, updateMetadata, token) => {
  const url = 'projects/actions/intersecting-tiles/';
  const body = JSON.stringify({
    areaOfInterest: metadata.geom,
    clipToAoi: clip,
    grid: metadata.tempTaskGrid,
  });

  pushToLocalJSONAPI(url, body, token).then((grid) => {
    updateMetadata({ ...metadata, tasksNo: grid.features.length, taskGrid: grid });
  });
};

export default function TrimProject({ metadata, mapObj, updateMetadata }) {
  useEffect(() => {
    addLayer('grid', metadata.taskGrid, mapObj.map);
  }, [metadata, mapObj]);

  const token = useSelector((state) => state.auth.get('token'));
  const [clipStatus, setClipStatus] = useState(false);

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
        <SwitchToggle
          isChecked={clipStatus}
          labelPosition="right"
          onChange={() => setClipStatus(!clipStatus)}
          label={<FormattedMessage {...messages.trimToAOI} />}
        />
        <div className="pt3">
          <CustomButton
            onClick={() => clipProject(clipStatus, metadata, mapObj.map, updateMetadata, token)}
            className="bg-white blue-dark ba b--grey-light ph3 pv2"
          >
            <CutIcon className="h1 w1 v-mid mr2" />
            <FormattedMessage {...messages.trim} />
          </CustomButton>
        </div>
      </div>
    </>
  );
}

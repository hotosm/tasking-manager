import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { addLayer } from './index';
import { Button } from '../button';

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
      <h3 className="f3 fw6 mt2 mb3 barlow-condensed blue-dark">
        <FormattedMessage {...messages.step3} />
      </h3>
      <div>
        <p>
          <FormattedMessage {...messages.trimTasksDescriptionLine1} />
        </p>
        <p>
          <FormattedMessage {...messages.trimTasksDescriptionLine2} />
        </p>
        <input
          type="checkbox"
          className="v-mid"
          defaultChecked={clipStatus}
          onChange={() => setClipStatus(!clipStatus)}
        />
        <span className="pl2 v-mid">
          <FormattedMessage {...messages.trimToAOI} />
        </span>
        <div className="pt2">
          <Button
            onClick={() => clipProject(clipStatus, metadata, mapObj.map, updateMetadata, token)}
            className="white bg-blue-dark"
          >
            <FormattedMessage {...messages.trim} />
          </Button>
        </div>
      </div>
    </>
  );
}

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from '@reach/router';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import messages from './messages';
import SetAOI from './setAOI';
import { ProjectCreationMap } from './projectCreationMap';
import SetTaskSizes from './setTaskSizes';
import TrimProject from './trimProject';
import NavButtons from './navButtons';
import Review from './review';
import { MAP_MAX_AREA } from '../../config';

import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

const MapboxDraw = require('@mapbox/mapbox-gl-draw');

export const paintOptions = {
  'fill-color': '#00004d',
  'fill-opacity': 0.3,
};

const ProjectCreate = () => {
  const token = useSelector(state => state.auth.get('token'));
  const [step, setStep] = useState(1);

  // Project information.
  const [metadata, updateMetadata] = useState({
    geom: null,
    area: 0,
    tasksNo: 0,
    taskGrid: null,
    projectName: '',
    zoomLevel: 9,
    tempTaskGrid: null,
    arbitraryTasks: false,
  });

  const drawOptions = {
    displayControlsDefault: false,
    styles: [
      {
        id: 'gl-draw-polygon-fill-inactive',
        type: 'fill',
        paint: paintOptions,
      },
    ],
  };
  const [mapObj, setMapObj] = useState({
    map: null,
    draw: new MapboxDraw(drawOptions),
  });

  if (!token) {
    return <Redirect to={'login'} noThrow />;
  }

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return <SetAOI mapObj={mapObj} metadata={metadata} updateMetadata={updateMetadata} />;
      case 2:
        return <SetTaskSizes mapObj={mapObj} metadata={metadata} updateMetadata={updateMetadata} />;
      case 3:
        return <TrimProject mapObj={mapObj} metadata={metadata} updateMetadata={updateMetadata} />;
      case 4:
        return <Review metadata={metadata} updateMetadata={updateMetadata} token={token} />;
      default:
        return;
    }
  };

  return (
    <div className="cf bg-tan pb3 pl4">
      <div className="fl vh-75-l pt3 w-30">
        <h2 className="f2 fw6 mt2 mb3 ttu barlow-condensed blue-dark">
          <FormattedMessage {...messages.createProject} />
        </h2>
        {renderCurrentStep()}
        <NavButtons
          index={step}
          setStep={setStep}
          metadata={metadata}
          mapObj={mapObj}
          updateMetadata={updateMetadata}
          maxArea={MAP_MAX_AREA}
        />
      </div>
      <div className="w-70 fr relative">
        <ProjectCreationMap
          metadata={metadata}
          updateMetadata={updateMetadata}
          mapObj={mapObj}
          setMapObj={setMapObj}
        />
        <div className="cf left-1 bottom-2 absolute">
          <p
            className={`fl mr2 pa1 f7-ns white ${ metadata.area > MAP_MAX_AREA || metadata.area === 0 ? 'bg-red' : 'bg-green'}`}
          >
            <FormattedMessage
              {...messages.areaSize}
              values={{area: <FormattedNumber value={metadata.area} unit="kilometer" />, sq: <sup>2</sup>}}
            />
          </p>
          <p className="fl bg-blue-light white mr2 pa1 f7-ns">
            <FormattedMessage {...messages.taskNumber} values={{n: <FormattedNumber value={metadata.tasksNo} />}} />
          </p>
        </div>
      </div>
    </div>
  );
};

export { ProjectCreate };

import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Button } from '../button';

const validateStep = props => {
  switch (props.index) {
    case 1: // Set Project AOI.
      if (props.metadata.area >= props.maxArea) {
        alert('Project AOI is higher than 5000 squared kilometers');
        return;
      }
      if (props.metadata.area === 0) {
        alert('Project geometry not set');
        return;
      }
      break;
    case 2: // Set Task grid.
      const taskGrid = props.mapObj.map.getSource('grid')._data;
      props.updateMetadata({ ...props.metadata, taskGrid: taskGrid, tempTaskGrid: taskGrid });
      break;
    case 3: // Trim Project.
      break;

    default:
      return;
  }
  let nextStep = props.index + 1;

  // If task is arbitrary. Jump to review.
  if (props.metadata.arbitraryTasks === true) {
    nextStep = 4;
  }
  props.setStep(nextStep);
};

const clearParamsStep = props => {
  switch (props.index) {
    case 2: //clear Tasks
      props.mapObj.map.removeLayer('grid');
      props.updateMetadata({ ...props.metadata, tasksNo: 0 });
      break;
    case 3:
      props.updateMetadata({ ...props.metadata, taskGrid: null, tempTaskGrid: null });
      break;
    default:
      break;
  }

  let prevStep = props.index - 1;

  // If task is arbitrary. Jump to review.
  if (props.metadata.arbitraryTasks === true) {
    prevStep = 1;
  }
  props.setStep(prevStep);
};

const NavButtons = props => {
  return (
    <div className="pt5">
      {props.index === 1 ? null : (
        <Button onClick={() => clearParamsStep(props)} className="white bg-red mr3">
          <FormattedMessage {...messages.backToPrevious} />
        </Button>
      )}
      {props.index === 4 ? null : (
        <Button onClick={() => validateStep(props)} className="white bg-blue-dark">
          <FormattedMessage {...messages.next} />
        </Button>
      )}
    </div>
  );
};

export default NavButtons;

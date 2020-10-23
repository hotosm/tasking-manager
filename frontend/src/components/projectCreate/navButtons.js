import React from 'react';
import { FormattedMessage } from 'react-intl';
import { addLayer } from './index';
import messages from './messages';
import { Button } from '../button';

const validateStep = (props) => {
  switch (props.index) {
    case 1: // Set Project AOI.
      if (props.metadata.area >= props.maxArea) {
        const message = 'Project AOI is higher than 5000 squared kilometers';
        return { error: true, message: message };
      } else if (props.metadata.area === 0) {
        const message = 'Project geometry not set';
        return { error: true, message: message };
      } else {
        const id = props.metadata.geom.features[0].id;
        props.mapObj.draw.delete(id);
        addLayer('aoi', props.metadata.geom, props.mapObj.map);
        props.updateMetadata({
          ...props.metadata,
          tasksNo: props.metadata.taskGrid.features.length,
        });
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
  return { error: false, message: '' };
};

const clearParamsStep = (props) => {
  switch (props.index) {
    case 2: //clear Tasks
      props.mapObj.map.removeLayer('grid');
      props.updateMetadata({ ...props.metadata, tasksNo: 0 });
      break;
    case 3:
      props.updateMetadata({ ...props.metadata, taskGrid: props.metadata.tempTaskGrid });
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

const NavButtons = (props) => {
  const stepHandler = (event) => {
    const resp = validateStep(props);
    props.setErr(resp);
  };

  return (
    <div className="pt3">
      {props.index === 1 ? null : (
        <Button onClick={() => clearParamsStep(props)} className="blue-dark bg-white mr3">
          <FormattedMessage {...messages.backToPrevious} />
        </Button>
      )}
      {props.index === 4 ? null : (
        <Button onClick={stepHandler} className="white bg-red">
          <FormattedMessage {...messages.next} />
        </Button>
      )}
    </div>
  );
};

export default NavButtons;

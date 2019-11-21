import React from 'react';

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
  const values = 'mt2 f5 ph4-l pv2-l white bg-blue-dark';

  return (
    <div className="w-30 fl">
      {props.index === 1 ? null : (
        <button onClick={() => clearParamsStep(props)} className={values}>
          Back to previous
        </button>
      )}
      {props.index === 4 ? null : (
        <button onClick={() => validateStep(props)} className={values}>
          Next
        </button>
      )}
    </div>
  );
};

export default NavButtons;

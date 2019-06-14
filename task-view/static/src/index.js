import React from 'react';
import ReactDOM from "react-dom";

export * from './staticmap';
export * from './vectormap';
export * from './maputil';
export * from './mapdiff';

import { TaskView } from './TaskView';
// import { ProjectOverview } from './ProjectOverview';
import { TaskOverview } from './TaskOverview';


export function renderTaskView(elementId, config) {
  ReactDOM.render(
    <TaskView edits={config.edits} task={config.task}/>,
    document.getElementById(elementId)
  );
}

// export function renderProjectOverview(elementId, config) {
//   ReactDOM.render(
//     <ProjectOverview config={config}/>,
//     document.getElementById(elementId)
//   );
// }

export function renderTaskOverview(elementId, config) {
  ReactDOM.render(
    <TaskOverview config={config}/>,
    document.getElementById(elementId)
  );
}

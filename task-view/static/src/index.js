import React from 'react';
import ReactDOM from "react-dom";

export * from './staticmap';
export * from './vectormap';
export * from './maputil';
export * from './mapdiff';

import { TaskView } from './TaskView';
import { ProjectOverview } from './ProjectOverview';


export function renderTaskView(elementId, config) {
    ReactDOM.render(
        <TaskView edits={config.edits} task={config.task}/>,
        document.getElementById(elementId)
    );
}

export function renderProjectOverview(elementId, config) {
    ReactDOM.render(
            <ProjectOverview config={config}/>,
            document.getElementById(elementId)
    );
}

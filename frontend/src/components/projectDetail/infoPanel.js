import React from 'react';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { MappingTypes } from '../mappingTypes';
import { Imagery } from '../taskSelection/imagery';
import ProjectProgressBar from '../projectCard/projectProgressBar';
import { DueDateBox } from '../projectCard/dueDateBox';
import { MappingLevelMessage } from '../mappingLevel';
import { BigProjectTeaser } from './bigProjectTeaser';
import { useComputeCompleteness } from '../../hooks/UseProjectCompletenessCalc';

const ProjectDetailTypeBar = (props) => {
  const titleClasses = 'db ttu f6 blue-light mb2';
  return (
    <div className="cf">
      <div className="w-50-ns w-70 fl">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.typesOfMapping} />
        </h3>
        <div className="db fl pt1">
          <MappingTypes types={props.mappingTypes} />
        </div>
      </div>
      <div className="w-50-ns w-30 fl">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.imagery} />
        </h3>
        <Imagery value={props.imagery} />
      </div>
    </div>
  );
};

export function ProjectInfoPanel({ project, tasks, contributors, type }: Object) {
  const { percentMapped, percentValidated, percentBadImagery } = useComputeCompleteness(tasks);
  return (
    <ReactPlaceholder
      showLoadingAnimation={true}
      rows={3}
      delay={500}
      ready={typeof project.projectId === 'number'}
    >
      <ProjectDetailTypeBar
        type={type}
        mappingTypes={project.mappingTypes || []}
        imagery={project.imagery}
        editors={project.mappingEditors}
      />
      <ReactPlaceholder rows={1} ready={typeof contributors.length === 'number'}>
        <BigProjectTeaser
          className="pt3"
          totalContributors={contributors.length}
          lastUpdated={project.lastUpdated}
          littleFont="f5"
          bigFont="f4"
        />
      </ReactPlaceholder>
      <ProjectProgressBar
        className="pb2 bg-white"
        percentMapped={percentMapped}
        percentValidated={percentValidated}
        percentBadImagery={percentBadImagery}
      />
      <div className="cf pb1 bg-white">
        <MappingLevelMessage level={project.mapperLevel} className="fl f5 mt1 ttc fw5 blue-dark" />
        <DueDateBox dueDate={project.dueDate} />
      </div>
    </ReactPlaceholder>
  );
}

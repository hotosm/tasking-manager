import React from 'react';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage, useIntl } from 'react-intl';

import messages from './messages';
import { MappingTypes } from '../mappingTypes';
import { Imagery } from '../taskSelection/imagery';
import ProjectProgressBar from '../projectCard/projectProgressBar';
import { DueDateBox } from '../projectCard/dueDateBox';
import { DifficultyMessage } from '../mappingLevel';
import { BigProjectTeaser } from './bigProjectTeaser';
import { useComputeCompleteness } from '../../hooks/UseProjectCompletenessCalc';

const ProjectDetailTypeBar = (props) => {
  const titleClasses = 'db ttu f7 blue-grey mb2 fw5';
  return (
    <div className="cf">
      <div className="w-50-ns w-100 fl">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.typesOfMapping} />
        </h3>
        <div className="db fl pt1">
          <MappingTypes types={props.mappingTypes} />
        </div>
      </div>
      <div className="w-50-ns w-100 fl mt3 mt0-ns">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.imagery} />
        </h3>
        <Imagery value={props.imagery} />
      </div>
    </div>
  );
};

export function ProjectInfoPanel({ project, tasks, contributors, type }: Object) {
  const intl = useIntl();
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
        />
      </ReactPlaceholder>
      <ProjectProgressBar
        small={false}
        className="pb3 bg-white"
        percentMapped={percentMapped}
        percentValidated={percentValidated}
        percentBadImagery={percentBadImagery}
      />
      <div className="pb1 bg-white flex justify-between items-center">
        <DifficultyMessage level={project.difficulty} className="fl f5 mt1 ttc fw5 blue-dark" />
        <DueDateBox
          dueDate={project.dueDate}
          tooltipMsg={intl.formatMessage(messages.dueDateTooltip)}
          isProjectDetailPage
        />
      </div>
    </ReactPlaceholder>
  );
}

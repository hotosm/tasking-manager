import React from 'react';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';

import messages from './messages';

import { getLogoClass } from '../projectcard/projectCard';
import ProjectProgressBar from '../projectcard/projectProgressBar';
import DueDateBox from '../projectcard/dueDateBox';

import { MappingLevelMessage } from '../mappingLevel';

import { TasksMap } from '../taskSelection/map.js';
import { HeaderLine } from '../taskSelection';
import { MappingTypes } from '../taskSelection/mappingTypes';
import { Imagery } from '../taskSelection/imagery';

import { htmlFromMarkdown } from './htmlFromMarkdown';
import { NewMapperFlow } from './newMapperFlow';
import { ShowReadMoreButton } from './showReadMoreButton';
import { ProjectDetailFooter } from './projectDetailFooter';
import { BigProjectTeaser } from './bigProjectTeaser';

/* lazy imports must be last import */
const TaskLineGraphViz = React.lazy(() => import('./taskLineGraphViz'));

function BigProjectOrgLogo(organisationTag) {
  return (
    <div className="bg-black pa1" style={{ filter: 'invert(1)' }}>
      <div
        title={organisationTag.organisationTag}
        className={`contain ${getLogoClass(organisationTag)} w5 h2`}
      ></div>
    </div>
  );
}

const ProjectDetailTypeBar = props => {
  const titleClasses = 'db ttu f6 blue-light mb2';
  return (
    <div className="cf">
      <div className="w-50 fl">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.typesOfMapping} />
        </h3>
        <div className="db fl pt1">
          <MappingTypes types={props.mappingTypes} />
        </div>
      </div>
      <div className="w-50 fl">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.imagery} />
        </h3>
        <Imagery value={props.imagery} />
      </div>
    </div>
  );
};

const ProjectDetailMap = props => {
  return (
    <div className="relative">
      <TasksMap
        mapResults={props.tasks}
        projectId={props.project.projectId}
        type={props.type}
        error={props.tasksError}
        loading={props.tasksLoading}
        className="dib w-100 fl"
      />
      <div className="cf left-1 top-1 absolute">
        <div className="cf ttu bg-white barlow-condensed f4 pv2">
          <span className={`pb2 pointer mh2 br b--grey-light ph2`}>
            <FormattedMessage {...messages.countrymap} />
          </span>
          <span className={`pb2 mh2 pointer bb b--blue-dark ph2`}>
            <FormattedMessage {...messages.taskmap} />
          </span>
        </div>
      </div>
    </div>
  );
};

export const ProjectDetailLeft = props => {
  const htmlDescription =
    props.project.projectInfo && htmlFromMarkdown(props.project.projectInfo.description);

  return (
    <div className={`${props.className}`}>
      <div className="">
        <ReactPlaceholder
          showLoadingAnimation={true}
          rows={3}
          delay={500}
          ready={props.project.projectId}
        >
          <HeaderLine
            author={props.project.author}
            projectId={props.project.projectId}
            priority={props.project.projectPriority}
          />
          <div className="cf pb3">
            <h3 className="f2 fw6 mt2 mb3 ttu barlow-condensed blue-dark">
              {props.project.projectInfo && props.project.projectInfo.name}
            </h3>
            <span className="blue-light">{props.project.campaignTag} &#183; Brazil</span>
          </div>
          <section className={`lh-copy`}>
            {props.project.projectInfo && props.project.projectInfo.shortDescription}
            <div className="pv2">
              <ShowReadMoreButton>
                <div className="pv2" dangerouslySetInnerHTML={htmlDescription} />
              </ShowReadMoreButton>
            </div>
          </section>
          <BigProjectOrgLogo organisationTag={props.project.organisationTag} />
        </ReactPlaceholder>
      </div>

      <div className="cf pr4 pb3 pt4">
        <ReactPlaceholder
          showLoadingAnimation={true}
          rows={3}
          delay={500}
          ready={props.project.projectId}
        >
          <ProjectDetailTypeBar
            type={props.type}
            mappingTypes={props.project.mappingTypes || []}
            imagery={props.project.imagery}
            editors={props.project.mappingEditors}
            defaultUserEditor={props.userPreferences.default_editor}
          />
          <ReactPlaceholder rows={1} ready={props.totalMappers.totalMappers}>
            <BigProjectTeaser
              className={`pt4`}
              totalContributors={props.totalMappers.totalMappers || 0}
              lastUpdated={props.project.lastUpdated}
              littleFont="f5"
              bigFont="f4"
            />
          </ReactPlaceholder>
          <ProjectProgressBar
            className={`pb2`}
            percentMapped={props.project.percentMapped || 50}
            percentValidated={props.project.percentValidated || 25}
          />
          <div className="cf pt2 h2">
            <MappingLevelMessage
              level={props.project.mapperLevel}
              className="fl f5 mt1 ttc fw5 blue-grey"
            />
            <DueDateBox dueDate={props.project.dueDate} />
          </div>
          <DueDateBox />
        </ReactPlaceholder>
      </div>
    </div>
  );
};

export const ProjectDetail = props => {
  const h2Classes = 'pl4 f2 fw6 mt2 mb3 ttu barlow-condensed blue-dar';
  return (
    <div className={`${props.className}`}>
      <div className="bb b--grey-light">
        <div className="cf">
          <ProjectDetailLeft {...props} className={`w-60 w-60-ns fl ph4 pv3`} />

          <div className="w-100 w-40-ns fl">
            <ReactPlaceholder
              showLoadingAnimation={true}
              type={'media'}
              rows={26}
              delay={200}
              ready={props.project.projectId}
            >
              <ProjectDetailMap {...props} />
            </ReactPlaceholder>
          </div>
        </div>

        <ProjectDetailFooter />
      </div>

      <h3 className={`${h2Classes}`}>How to Contribute</h3>
      <NewMapperFlow />

      <h3 className={`${h2Classes} mb6 `}>Contributors</h3>

      <h3 className={`${h2Classes}`}>Contributions Timeline</h3>
      <div className={``}>
        <React.Suspense fallback={<div className={`w7 h5`}>Loading...</div>}>
          <ReactPlaceholder
            showLoadingAnimation={true}
            rows={3}
            delay={500}
            ready={props.percentDoneVisData}
          >
            <TaskLineGraphViz percentDoneVisData={props.percentDoneVisData} />
          </ReactPlaceholder>
        </React.Suspense>
      </div>
    </div>
  );
};

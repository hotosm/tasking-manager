import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import { useMeta, useTitle } from 'react-meta-elements';

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

function BigProjectOrgLogo(props) {
  return (
    <div className={`bg-black pa1 ${props.className}`} style={{ filter: 'invert(1)' }}>
      <div title={props.organisationTag} className={`contain ${getLogoClass(props)} w5 h2`}></div>
    </div>
  );
}

const ProjectDetailTypeBar = props => {
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
      <div className="w-50-n w-30 fl">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.imagery} />
        </h3>
        <Imagery value={props.imagery} />
      </div>
    </div>
  );
};

const ProjectDetailMap = props => {
  const [taskBordersOnly, setTaskBordersOnly] = useState(true);

  var taskBordersGeoJSON = props.project.areaOfInterest && {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: props.project.areaOfInterest,
      },
    ],
  };
  var centroidGeoJSON = props.totalMappers.aoiCentroid && {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: props.totalMappers.aoiCentroid,
      },
    ],
  };
  return (
    <div className="relative">
      {
        /* It disturbs layout otherwise */
        /* eslint-disable-next-line */
        <a name="top" />
      }
      <TasksMap
        mapResults={props.tasks}
        taskBordersMap={taskBordersGeoJSON}
        taskCentroidMap={centroidGeoJSON}
        taskBordersOnly={taskBordersOnly}
        projectId={props.project.projectId}
        disableScrollZoom={true}
        navigate={props.navigate}
        type={props.type}
        error={props.tasksError}
        loading={props.tasksLoading}
        className="dib w-100 fl vh-75"
      />
      {taskBordersOnly && (
        <div className="cf left-1 top-1 absolute">
          <div className="cf ttu bg-white barlow-condensed f4 pv2">
            <span onClick={e => setTaskBordersOnly(false)} className="pb2 mh2 pointer ph2">
              <FormattedMessage {...messages.zoomToTasks} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProjectDetailLeft = props => {
  const htmlDescription =
    props.project.projectInfo && htmlFromMarkdown(props.project.projectInfo.description);
  const htmlShortDescription =
    props.project.projectInfo && htmlFromMarkdown(props.project.projectInfo.shortDescription);
  useTitle(
    `#${props.project.projectId || 'Tasking Manager'}: ${props.project.projectInfo &&
      props.project.projectInfo.name}`,
  );
  useMeta({
    property: 'og:title',
    content: `#${props.project.projectId || 'Tasking Manager'}: ${props.project.projectInfo &&
      props.project.projectInfo.name}`,
  });
  // useMeta({name: 'application-name', content: `#${props.project.projectId || "Tasking Manager"}: ${props.project.projectInfo && props.project.projectInfo.name}` });
  // useMeta({name: 'description', content: `#${props.project.projectId || "Tasking Manager"}: ${props.project.projectInfo && props.project.projectInfo.name}` });
  // useMeta({name: 'og:description', content: `#${props.project.projectId || "Tasking Manager"}: ${props.project.projectInfo && props.project.projectInfo.name}` });
  return (
    <div className={`${props.className}`}>
      <div className="h-75">
        <ReactPlaceholder
          showLoadingAnimation={true}
          rows={3}
          delay={500}
          ready={typeof props.project.projectId === 'number'}
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
            <span className="blue-light">{props.project.campaignTag}</span>
            {props.project.countryTag && (
              <span className="blue-light">
                <span className="ph2">&#183;</span>
                {props.project.countryTag.map(country => country).join(', ')}
              </span>
            )}
          </div>
          <section className={`lh-copy h5 overflow-x-scroll`}>
            <div className="pr2" dangerouslySetInnerHTML={htmlShortDescription} />
            <div className="pv2">
              <ShowReadMoreButton>
                <div className="pv2 pr2" dangerouslySetInnerHTML={htmlDescription} />
              </ShowReadMoreButton>
            </div>
            <BigProjectOrgLogo organisationTag={props.project.organisationTag} />
          </section>
        </ReactPlaceholder>
      </div>

      <div className="cf pr4 pb3 pt0">
        <ReactPlaceholder
          showLoadingAnimation={true}
          rows={3}
          delay={500}
          ready={typeof props.project.projectId === 'number'}
        >
          <ProjectDetailTypeBar
            type={props.type}
            mappingTypes={props.project.mappingTypes || []}
            imagery={props.project.imagery}
            editors={props.project.mappingEditors}
            defaultUserEditor={props.userPreferences.default_editor}
          />
          <ReactPlaceholder rows={1} ready={typeof props.totalMappers.totalMappers === 'number'}>
            <BigProjectTeaser
              className="pt3"
              totalContributors={props.totalMappers.totalMappers || 0}
              lastUpdated={props.project.lastUpdated}
              littleFont="f5"
              bigFont="f4"
            />
          </ReactPlaceholder>
          <ProjectProgressBar
            className="pb2"
            percentMapped={props.project.percentMapped || 50}
            percentValidated={props.project.percentValidated || 25}
          />
          <div className="cf pt1 h2">
            <MappingLevelMessage
              level={props.project.mapperLevel}
              className="fl f5 mt1 ttc fw5 blue-dark"
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
    <div className={`${props.className || ''}`}>
      <div className="bb b--grey-light">
        <div className="cf">
          <ProjectDetailLeft {...props} className={`w-100 w-60-l fl ph4 pv3 vh-75-l vh-110`} />
          <div className="w-100 w-40-l fl">
            <ReactPlaceholder
              showLoadingAnimation={true}
              type={'media'}
              rows={26}
              delay={200}
              ready={typeof props.project.projectId === 'number'}
            >
              <ProjectDetailMap {...props} />
            </ReactPlaceholder>
          </div>
        </div>
        <ProjectDetailFooter projectId={props.project.projectId} />
      </div>

      <a href="#howToContribute" style={{ visibility: 'hidden' }} name="howToContribute">
        <FormattedMessage {...messages.howToContribute} />
      </a>
      <h3 className={`${h2Classes}`}>
        <FormattedMessage {...messages.howToContribute} />
      </h3>
      <NewMapperFlow />

      <a href="#questionsAndComments" style={{ visibility: 'hidden' }} name="questionsAndComments">
        <FormattedMessage {...messages.questionsAndComments} />
      </a>
      <h3 className={`${h2Classes} mb6 `}>
        <FormattedMessage {...messages.questionsAndComments} />
      </h3>

      <a href="#contributions" name="contributions" style={{ visibility: 'hidden' }}>
        <FormattedMessage {...messages.contributors} />
      </a>
      <h3 className={`${h2Classes} mb6 `}>
        <FormattedMessage {...messages.contributors} />
      </h3>

      <a href="#contributionTimeline" style={{ visibility: 'hidden' }} name="contributionTimeline">
        <FormattedMessage {...messages.contributionsTimeline} />
      </a>
      <h3 className={`${h2Classes}`}>
        <FormattedMessage {...messages.contributionsTimeline} />
      </h3>
      <div className={``}>
        <React.Suspense fallback={<div className={`w7 h5`}>Loading...</div>}>
          <ReactPlaceholder
            showLoadingAnimation={true}
            rows={3}
            delay={500}
            ready={typeof props.percentDoneVisData === 'object'}
          >
            <TaskLineGraphViz percentDoneVisData={props.percentDoneVisData} />
          </ReactPlaceholder>
        </React.Suspense>
      </div>
    </div>
  );
};

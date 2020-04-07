import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import centroid from '@turf/centroid';

import messages from './messages';

import ProjectProgressBar from '../projectcard/projectProgressBar';
import DueDateBox from '../projectcard/dueDateBox';

import { MappingLevelMessage } from '../mappingLevel';
import { UserAvatarList } from '../user/avatar';

import { TasksMap } from '../taskSelection/map.js';
import { ProjectHeader } from './header';
import { MappingTypes } from '../mappingTypes';
import { Imagery } from '../taskSelection/imagery';
import { TeamsBoxList } from '../teamsAndOrgs/teams';

import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';
import { ProjectDetailFooter } from './projectDetailFooter';
import { BigProjectTeaser } from './bigProjectTeaser';
import { QuestionsAndComments } from './questionsAndComments';
import { PermissionBox } from './permissionBox';
import { OSMChaButton } from './osmchaButton';
import { useSetProjectPageTitleTag } from '../../hooks/UseMetaTags';

/* lazy imports must be last import */
const TaskLineGraphViz = React.lazy(() => import('./taskLineGraphViz'));

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
      <div className="w-50-n w-30 fl">
        <h3 className={titleClasses}>
          <FormattedMessage {...messages.imagery} />
        </h3>
        <Imagery value={props.imagery} />
      </div>
    </div>
  );
};

const ProjectDetailMap = (props) => {
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
  var centroidGeoJSON = props.project.areaOfInterest && {
    type: 'FeatureCollection',
    features: [centroid(props.project.areaOfInterest)],
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
        priorityAreas={props.project.priorityAreas}
        taskBordersMap={taskBordersGeoJSON}
        taskCentroidMap={centroidGeoJSON}
        taskBordersOnly={taskBordersOnly}
        disableScrollZoom={true}
        navigate={props.navigate}
        type={props.type}
        error={props.tasksError}
        loading={props.projectLoading}
        className="dib w-100 fl vh-75"
      />
      {taskBordersOnly && (
        <div className="cf left-1 top-1 absolute">
          <div className="cf ttu bg-white barlow-condensed f4 pv2">
            <span onClick={(e) => setTaskBordersOnly(false)} className="pb2 mh2 pointer ph2">
              <FormattedMessage {...messages.zoomToTasks} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProjectDetailLeft = (props) => {
  const htmlShortDescription =
    props.project.projectInfo && htmlFromMarkdown(props.project.projectInfo.shortDescription);

  return (
    <div className={`${props.className}`}>
      <div className="h-75 z-1">
        <ReactPlaceholder
          showLoadingAnimation={true}
          rows={3}
          delay={500}
          ready={typeof props.project.projectId === 'number'}
        >
          <ProjectHeader project={props.project} />
          <section className={`lh-copy h-100 overflow-x-scroll`}>
            <div className="pr2" dangerouslySetInnerHTML={htmlShortDescription} />
            <div className="pv2">
              <a href="#description" className="link base-font bg-white f6 bn pn red pointer">
                <span className="pr2 ttu f6 fw6">
                  <FormattedMessage {...messages.readMore} />
                </span>
              </a>
            </div>
            <div className="cf w-100">
              {props.project.organisationName && (
                <>
                  <p>
                    <FormattedMessage
                      {...messages.projectCoordination}
                      values={{
                        organisation: <span className="fw6">{props.project.organisationName}</span>,
                      }}
                    />
                  </p>
                  <img
                    className="w4 pa1 z-1"
                    src={props.project.organisationLogo}
                    alt={props.project.organisationName}
                  />
                </>
              )}
            </div>
          </section>
        </ReactPlaceholder>
      </div>

      <div
        className="cf ph4 pb3 w-100 h-25 z-2 absolute bottom-0 left-0 bg-white"
        style={{ minHeight: '10rem' }}
      >
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
          <ReactPlaceholder rows={1} ready={typeof props.contributors.length === 'number'}>
            <BigProjectTeaser
              className="pt3"
              totalContributors={props.contributors.length}
              lastUpdated={props.project.lastUpdated}
              littleFont="f5"
              bigFont="f4"
            />
          </ReactPlaceholder>
          <ProjectProgressBar
            className="pb2 bg-white"
            percentMapped={props.project.percentMapped}
            percentValidated={props.project.percentValidated}
          />
          <div className="cf pb1 h2 bg-white">
            <MappingLevelMessage
              level={props.project.mapperLevel}
              className="tl f5 mt1 ttc fw5 blue-dark"
            />
            <DueDateBox dueDate={props.project.dueDate} />
          </div>
          <DueDateBox />
        </ReactPlaceholder>
      </div>
    </div>
  );
};

export const ProjectDetail = (props) => {
  useSetProjectPageTitleTag(props.project);

  const htmlDescription =
    props.project.projectInfo && htmlFromMarkdown(props.project.projectInfo.description);
  const h2Classes = 'pl4 f2 fw6 mt2 mb3 ttu barlow-condensed blue-dark';

  return (
    <div className={`${props.className || 'bg-white blue-dark'}`}>
      <div className="bb b--grey-light">
        <div className="cf">
          <ProjectDetailLeft
            {...props}
            className="w-100 w-60-l fl ph4 pv3 bg-white blue-dark vh-minus-200-ns relative"
          />
          <div className="w-100 w-40-l vh-minus-200-ns fl">
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

      <a href="#description" style={{ visibility: 'hidden' }} name="description">
        <FormattedMessage {...messages.description} />
      </a>
      <h3 className={`${h2Classes}`}>
        <FormattedMessage {...messages.description} />
      </h3>
      <div
        className="pv2 ph4 w-60-l w-80-m w-100 lh-title"
        dangerouslySetInnerHTML={htmlDescription}
      />

      <a href="#teams" style={{ visibility: 'hidden' }} name="teams">
        <FormattedMessage {...messages.teamsAndPermissions} />
      </a>
      <h3 className={`${h2Classes}`}>
        <FormattedMessage {...messages.teamsAndPermissions} />
      </h3>
      <div className="ph4 mb3 cf db">
        <div className="w-100 w-30-l fl pr3">
          <h4 className="mb2 fw6">
            <FormattedMessage {...messages.whoCanMap} />
          </h4>
          <PermissionBox
            permission={props.project.mappingPermission}
            className="dib pv2 ph3 mt2 red"
          />
          <h4 className="mb2 fw6">
            <FormattedMessage {...messages.whoCanValidate} />
          </h4>
          <PermissionBox
            permission={props.project.validationPermission}
            validation
            className="dib pv2 ph3 mt2 red"
          />
        </div>
        <div className="w-100 w-70-l fl">
          {props.project.teams && <TeamsBoxList teams={props.project.teams} />}
        </div>
      </div>

      <a href="#questionsAndComments" style={{ visibility: 'hidden' }} name="questionsAndComments">
        <FormattedMessage {...messages.questionsAndComments} />
      </a>
      <h3 className={`${h2Classes} mv0 pv4 bg-tan`}>
        <FormattedMessage {...messages.questionsAndComments} />
      </h3>
      <QuestionsAndComments projectId={props.project.projectId} />

      <a href="#contributions" name="contributions" style={{ visibility: 'hidden' }}>
        <FormattedMessage {...messages.contributors} />
      </a>
      <h3 className={`${h2Classes}`}>
        <FormattedMessage {...messages.contributors} />
      </h3>
      <div className="cf db mb3 ph4">
        {props.contributors && (
          <UserAvatarList
            size="large"
            textColor="white"
            users={props.contributors}
            maxLength={15}
          />
        )}
      </div>

      <a href="#contributionTimeline" style={{ visibility: 'hidden' }} name="contributionTimeline">
        <FormattedMessage {...messages.contributionsTimeline} />
      </a>
      <h3 className={`${h2Classes}`}>
        <FormattedMessage {...messages.contributionsTimeline} />
      </h3>
      <div className="mb5 ph4">
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
        <ReactPlaceholder
          delay={100}
          showLoadingAnimation={true}
          type="rect"
          style={{ width: 150, height: 30 }}
          ready={typeof props.project === 'object'}
        >
          <OSMChaButton
            project={props.project}
            className="bg-white blue-dark ba b--grey-light pa3"
          />
        </ReactPlaceholder>
      </div>
    </div>
  );
};

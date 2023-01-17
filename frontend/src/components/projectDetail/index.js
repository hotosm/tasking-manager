import React, { useState } from 'react';
import { Link } from '@reach/router';
import ReactPlaceholder from 'react-placeholder';
import centroid from '@turf/centroid';
import { FormattedMessage } from 'react-intl';
import { supported } from 'mapbox-gl';

import messages from './messages';
import { UserAvatar, UserAvatarList } from '../user/avatar';
import { TasksMap } from '../taskSelection/map.js';
import { ProjectHeader } from './header';
import { DownloadAOIButton, DownloadTaskGridButton } from './downloadButtons';
import { TeamsBoxList } from '../teamsAndOrgs/teams';
import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';
import { ProjectDetailFooter } from './footer';
import { QuestionsAndComments } from './questionsAndComments';
import { PermissionBox } from './permissionBox';
import { CustomButton } from '../button';
import { ProjectInfoPanel } from './infoPanel';
import { OSMChaButton } from './osmchaButton';
import { useSetProjectPageTitleTag } from '../../hooks/UseMetaTags';
import { useFetch } from '../../hooks/UseFetch';

import './styles.scss';
import { useWindowSize } from '../../hooks/UseWindowSize';

/* lazy imports must be last import */
const ProjectTimeline = React.lazy(() => import('./timeline' /* webpackChunkName: "timeline" */));

const ProjectDetailMap = (props) => {
  const [taskBordersOnly, setTaskBordersOnly] = useState(true);

  const taskBordersGeoJSON = props.project.areaOfInterest && {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: props.project.areaOfInterest,
      },
    ],
  };

  const centroidGeoJSON = props.project.areaOfInterest && {
    type: 'FeatureCollection',
    features: [centroid(props.project.areaOfInterest)],
  };

  return (
    <div className="relative w-100 h-100">
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
        className="w-100 vh-75 h-100-l"
      />
      {taskBordersOnly && supported() && (
        <div
          className="cf left-1 top-1 absolute zoom-to-task"
          style={{
            filter: 'drop-shadow(0px 4px 10px rgba(0, 0, 0, 0.1))',
            letterSpacing: '2.69538px',
          }}
        >
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

export const ProjectDetailLeft = ({ project, contributors, className, type }: Object) => {
  const htmlShortDescription =
    project.projectInfo && htmlFromMarkdown(project.projectInfo.shortDescription);

  return (
    <div className={`${className} flex flex-column`}>
      <ReactPlaceholder
        showLoadingAnimation={true}
        rows={10}
        delay={500}
        ready={typeof project.projectId === 'number'}
      >
        <ProjectHeader project={project} showEditLink={true} />
        <section className="lh-title h5 overflow-y-auto mt3 mb3" style={{ flexGrow: 1 }}>
          <div
            className="pr2 blue-dark-abbey markdown-content"
            dangerouslySetInnerHTML={htmlShortDescription}
          />
          <div>
            <a href="#description" className="link base-font bg-white f6 bn pn red pointer">
              <span className="pr2 ttu f6 fw6">
                <FormattedMessage {...messages.readMore} />
              </span>
            </a>
          </div>
        </section>
      </ReactPlaceholder>
      <ProjectInfoPanel
        project={project}
        tasks={project.tasks}
        contributors={contributors}
        type={type}
      />
    </div>
  );
};

export const ProjectDetail = (props) => {
  useSetProjectPageTitleTag(props.project);
  const size = useWindowSize();
  /* eslint-disable-next-line */
  const [visualError, visualLoading, visualData] = useFetch(
    `projects/${props.project.projectId}/contributions/queries/day/`,
    props.project && props.project.projectId,
  );
  /* eslint-disable-next-line */
  const [contributorsError, contributorsLoading, contributors] = useFetch(
    `projects/${props.project.projectId}/contributions/`,
    props.project && props.project.projectId,
  );

  const htmlDescription =
    props.project.projectInfo && htmlFromMarkdown(props.project.projectInfo.description);
  const h2Classes = 'pl4 f3 f2-ns fw5 mt2 mb3 mb4-ns ttu barlow-condensed blue-dark';
  const userLink = (
    <Link to={`/users/${props.project.author}`} className="link blue-dark underline">
      {props.project.author}
    </Link>
  );

  return (
    <div className={`${props.className || 'blue-dark'}`}>
      <div className="db flex-l tasks-map-height">
        <ProjectDetailLeft
          className="w-100 w-60-l ph4 ph2 pv3 blue-dark"
          project={props.project}
          contributors={
            contributors.hasOwnProperty('userContributions') ? contributors.userContributions : []
          }
          type="detail"
        />
        <div className="w-100 w-40-l">
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

      <a href="#description" style={{ visibility: 'hidden' }} name="description">
        <FormattedMessage {...messages.description} />
      </a>
      <h3 className={`${h2Classes}`}>
        <FormattedMessage {...messages.description} />
      </h3>
      <div
        className="ph4 w-60-l w-80-m w-100 lh-title markdown-content blue-dark-abbey"
        dangerouslySetInnerHTML={htmlDescription}
      />
      <a href="#coordination" style={{ visibility: 'hidden' }} name="coordination">
        <FormattedMessage {...messages.coordination} />
      </a>
      <h3 className={`${h2Classes}`}>
        <FormattedMessage {...messages.coordination} />
      </h3>
      <div className="db mb3 ph4 blue-dark-abbey">
        {props.project.organisationName && (
          <>
            <p className="ma0">
              <FormattedMessage
                {...messages.projectCoordination}
                values={{
                  organisation: (
                    <Link
                      to={`/organisations/${props.project.organisationSlug}`}
                      className="fw6 link blue-dark"
                    >
                      {props.project.organisationName}
                    </Link>
                  ),
                  user: userLink,
                }}
              />
            </p>
            {props.project.organisationLogo && (
              <Link to={`/organisations/${props.project.organisationSlug}`}>
                <img
                  className="w5 mt3 pa1 z-1"
                  src={props.project.organisationLogo}
                  alt={props.project.organisationName}
                />
              </Link>
            )}
          </>
        )}
        {!props.project.organisationName && props.project.author && (
          <>
            <p>
              <FormattedMessage {...messages.createdBy} values={{ user: userLink }} />
            </p>
            <UserAvatar username={props.project.author} size="large" colorClasses="white bg-red" />
          </>
        )}
      </div>
      <a href="#teams" style={{ visibility: 'hidden' }} name="teams">
        <FormattedMessage {...messages.teamsAndPermissions} />
      </a>
      <h3 className={`${h2Classes}`}>
        <FormattedMessage {...messages.teamsAndPermissions} />
      </h3>
      <div className="ph4 mb3 db">
        <div className=" flex flex-column flex-row-l gap-1">
          <div className="w-100 w-30-l">
            <h4 className="mb2 mt0 fw6">
              <FormattedMessage {...messages.whoCanMap} />
            </h4>
            <PermissionBox
              permission={props.project.mappingPermission}
              className="dib pv2 ph3 red"
            />
          </div>
          <div className="w-100 w-30-l">
            <h4 className="mb2 mt0 fw6">
              <FormattedMessage {...messages.whoCanValidate} />
            </h4>
            <PermissionBox
              permission={props.project.validationPermission}
              validation
              className="dib pv2 ph3 red"
            />
          </div>
        </div>
        <div className="mt3">
          {props.project.teams && <TeamsBoxList teams={props.project.teams} />}
        </div>
      </div>
      <a href="#questionsAndComments" style={{ visibility: 'hidden' }} name="questionsAndComments">
        <FormattedMessage {...messages.questionsAndComments} />
      </a>
      <QuestionsAndComments
        projectId={props.project.projectId}
        contributors={contributors}
        titleClass={`${h2Classes} mv0 pt5`}
      />
      <a href="#contributions" name="contributions" style={{ visibility: 'hidden' }}>
        <FormattedMessage {...messages.contributors} />
      </a>
      <h3 className={`${h2Classes}`}>
        <FormattedMessage {...messages.contributors} />
      </h3>
      <div className="cf db mb3 ph4">
        <ReactPlaceholder
          showLoadingAnimation={true}
          type={'media'}
          rows={1}
          delay={200}
          ready={contributors && contributors.userContributions}
        >
          {contributors && (
            <UserAvatarList
              size={'large'}
              textColor="white"
              users={contributors.userContributions}
              maxLength={parseInt(size[0] / 75) > 12 ? 12 : parseInt(size[0] / 75)}
            />
          )}
        </ReactPlaceholder>
      </div>

      <a href="#contributionTimeline" style={{ visibility: 'hidden' }} name="contributionTimeline">
        <FormattedMessage {...messages.contributionsTimeline} />
      </a>
      <h3 className={`${h2Classes}`}>
        <FormattedMessage {...messages.contributionsTimeline} />
      </h3>
      <div className="mb5 ph4 w-100 w-60-l">
        <React.Suspense fallback={<div className={`w7 h5`}>Loading...</div>}>
          <ReactPlaceholder
            showLoadingAnimation={true}
            rows={3}
            delay={500}
            ready={typeof visualData === 'object' && visualData.stats !== undefined}
          >
            <div className="pt2 pb4">
              <ProjectTimeline tasksByDay={visualData.stats} />
            </div>
          </ReactPlaceholder>
        </React.Suspense>
        <ReactPlaceholder
          delay={100}
          showLoadingAnimation={true}
          type="rect"
          style={{ width: 150, height: 30 }}
          ready={typeof props.project === 'object'}
        >
          <div className="flex gap-1 nowrap flex-wrap">
            <Link to={`/projects/${props.project.projectId}/stats`} className="link">
              <CustomButton className="bg-red white bn pa3">
                <FormattedMessage {...messages.moreStats} />
              </CustomButton>
            </Link>
            <OSMChaButton
              project={props.project}
              className="bg-white blue-dark ba b--grey-light pa3"
            />
            <DownloadAOIButton
              projectId={props.project.projectId}
              className="bg-white blue-dark ba b--grey-light pa3"
            />
            <DownloadTaskGridButton
              projectId={props.project.projectId}
              className="bg-white blue-dark ba b--grey-light pa3"
            />
          </div>
        </ReactPlaceholder>
      </div>
      <ProjectDetailFooter projectId={props.project.projectId} />
    </div>
  );
};

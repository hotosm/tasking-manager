import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ReactPlaceholder from 'react-placeholder';
import centroid from '@turf/centroid';
import { FormattedMessage } from 'react-intl';
import { supported } from 'mapbox-gl';
import PropTypes from 'prop-types';

import messages from './messages';
import viewsMessages from '../../views/messages';
import { UserAvatar, UserAvatarList } from '../user/avatar';
import { TasksMap } from '../taskSelection/map.js';
import { ProjectHeader } from './header';
import { DownloadAOIButton, DownloadTaskGridButton } from './downloadButtons';
import { TeamsBoxList } from '../teamsAndOrgs/teams';
import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';
import { ProjectDetailFooter } from './footer';
import { QuestionsAndComments } from './questionsAndComments';
import { SimilarProjects } from './similarProjects';
import { PermissionBox } from './permissionBox';
import { CustomButton } from '../button';
import { ProjectInfoPanel } from './infoPanel';
import { OSMChaButton } from './osmchaButton';
import { LiveViewButton } from './liveViewButton';
import { useSetProjectPageTitleTag } from '../../hooks/UseMetaTags';
import useHasLiveMonitoringFeature from '../../hooks/UseHasLiveMonitoringFeature';
import { useProjectContributionsQuery, useProjectTimelineQuery } from '../../api/projects';
import { Alert } from '../alert';

import './styles.scss';
import { useWindowSize } from '../../hooks/UseWindowSize';
import { DownloadOsmData } from './downloadOsmData.js';
import { ENABLE_EXPORT_TOOL } from '../../config/index.js';

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
            <span
              role="button"
              tabIndex={0}
              onClick={() => setTaskBordersOnly(false)}
              onKeyDown={() => setTaskBordersOnly(false)}
              className="pb2 mh2 pointer ph2 "
            >
              <FormattedMessage {...messages.zoomToTasks} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProjectDetailLeft = ({ project, contributors, className, type }) => {
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
  const { data: contributors, status: contributorsStatus } = useProjectContributionsQuery(
    props.project.projectId,
  );
  const { data: timelineData, status: timelineDataStatus } = useProjectTimelineQuery(
    props.project.projectId,
  );

  const hasLiveMonitoringFeature = useHasLiveMonitoringFeature();

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
          contributors={contributorsStatus === 'success' ? contributors : []}
          type="detail"
        />
        <div className="w-100 w-40-l">
          <ProjectDetailMap {...props} />
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
        project={props.project}
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
        {contributorsStatus === 'loading' && (
          <ReactPlaceholder
            showLoadingAnimation={true}
            type={'media'}
            rows={1}
            delay={200}
            ready={contributorsStatus === 'success'}
          />
        )}
        {contributorsStatus === 'error' && (
          <div className="w-100 w-60-l">
            <Alert type="error">
              <FormattedMessage {...messages.contributorsError} />
            </Alert>
          </div>
        )}
        {contributorsStatus === 'success' && (
          <UserAvatarList
            size={'large'}
            textColor="white"
            users={contributors}
            maxLength={parseInt(size[0] / 75) > 12 ? 12 : parseInt(size[0] / 75)}
          />
        )}
      </div>

      {/* Download OSM Data section Start */}
      {/* Converted String to Integer */}
      {+ENABLE_EXPORT_TOOL === 1 && (
        <div className="bg-tan-dim">
          <a href="#downloadOsmData" name="downloadOsmData" style={{ visibility: 'hidden' }}>
            <FormattedMessage {...messages.downloadOsmData} />
          </a>
          <h3 className={`${h2Classes}`}>
            <FormattedMessage {...messages.downloadOsmData} />
          </h3>
          <DownloadOsmData
            projectMappingTypes={props?.project?.mappingTypes}
            project={props.project}
          />
        </div>
      )}

      {/* Download OSM Data section End */}

      <a href="#contributionTimeline" style={{ visibility: 'hidden' }} name="contributionTimeline">
        <FormattedMessage {...messages.contributionsTimeline} />
      </a>
      <h3 className={`${h2Classes}`}>
        <FormattedMessage {...messages.contributionsTimeline} />
      </h3>
      <div className="mb5 ph4 w-100 w-60-l">
        <div className="pt2 pb4">
          {timelineDataStatus === 'loading' && (
            <ReactPlaceholder showLoadingAnimation rows={3} ready={false} />
          )}
          {timelineDataStatus === 'error' && (
            <Alert type="error">
              <FormattedMessage {...viewsMessages.timelineDataError} />
            </Alert>
          )}
          {timelineDataStatus === 'success' && (
            <React.Suspense fallback={<div className={`w7 h5`}>Loading...</div>}>
              <ProjectTimeline tasksByDay={timelineData} />
            </React.Suspense>
          )}
        </div>
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

          {/* show live view button only when the project has live monitoring feature */}
          {hasLiveMonitoringFeature && (
            <LiveViewButton
              projectId={props.project.projectId}
              className="bg-white blue-dark ba b--grey-light pa3"
            />
          )}

          <DownloadAOIButton
            projectId={props.project.projectId}
            className="bg-white blue-dark ba b--grey-light pa3"
          />
          <DownloadTaskGridButton
            projectId={props.project.projectId}
            className="bg-white blue-dark ba b--grey-light pa3"
          />
        </div>
      </div>
      <a href="#similarProjects" style={{ visibility: 'hidden' }} name="similarProjects">
        <FormattedMessage {...messages.similarProjects} />
      </a>
      <h3 className={`${h2Classes} mv0 pt5`}>
        <FormattedMessage {...messages.similarProjects} />
      </h3>
      <div className="mb5 w-100 w-60-l">
        <SimilarProjects projectId={props.project.projectId} />
      </div>
      <ProjectDetailFooter projectId={props.project.projectId} />
    </div>
  );
};

const GeometryPropType = PropTypes.shape({
  type: PropTypes.oneOf([
    'Point',
    'MultiPoint',
    'LineString',
    'MultiLineString',
    'Polygon',
    'MultiPolygon',
    'GeometryCollection',
  ]),
  coordinates: PropTypes.array,
  geometries: PropTypes.array,
});
const FeaturePropType = PropTypes.shape({
  type: PropTypes.oneOf(['Feature']),
  geometry: GeometryPropType,
  properties: PropTypes.object,
});
const FeatureCollectionPropType = PropTypes.shape({
  type: PropTypes.oneOf(['FeatureCollection']),
  features: PropTypes.arrayOf(FeaturePropType).isRequired,
});

ProjectDetail.propTypes = {
  project: PropTypes.shape({
    projectId: PropTypes.number,
    projectInfo: PropTypes.shape({
      description: PropTypes.string,
    }),
    mappingTypes: PropTypes.arrayOf(PropTypes.any).isRequired,
    author: PropTypes.string,
    organisationName: PropTypes.string,
    organisationSlug: PropTypes.string,
    organisationLogo: PropTypes.string,
    mappingPermission: PropTypes.string,
    validationPermission: PropTypes.string,
    teams: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  className: PropTypes.string,
};

ProjectDetailMap.propTypes = {
  project: PropTypes.shape({
    areaOfInterest: PropTypes.object,
    priorityAreas: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  // Tasks are a GeoJSON FeatureCollection
  tasks: FeatureCollectionPropType,
  navigate: PropTypes.func,
  type: PropTypes.string,
  tasksError: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  projectLoading: PropTypes.bool,
};

ProjectDetailLeft.propTypes = {
  project: PropTypes.shape({
    projectInfo: PropTypes.shape({
      shortDescription: PropTypes.string,
    }),
    projectId: PropTypes.number,
    tasks: FeatureCollectionPropType,
  }).isRequired,
  contributors: PropTypes.arrayOf(PropTypes.object),
  className: PropTypes.string,
  type: PropTypes.string,
};

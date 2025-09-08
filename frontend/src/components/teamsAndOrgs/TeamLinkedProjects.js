import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';
import ReactPlaceholder from 'react-placeholder';
import { useFetchWithAbort } from '../../hooks/UseFetch';
import messages from './messages';
import statusMessages from '../projectDetail/messages';
import { ViewAllLink } from './management';
import { CustomMenu } from '../CustomMenu';
import TeamLinkedProjectCard, { nTeamProjectsCardPlaceholders } from './TeamLinkedProjectCard';
import { useSelector } from 'react-redux';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { Button, CustomButton } from '../button';
import { Alert } from '../alert';

const items = [
  { id: 'PUBLISHED', label: <FormattedMessage {...statusMessages.status_PUBLISHED} /> },
  { id: 'ARCHIVED', label: <FormattedMessage {...statusMessages.status_ARCHIVED} /> },
  { id: 'DRAFT', label: <FormattedMessage {...statusMessages.status_DRAFT} /> },
];

export function TeamLinkedProjects({ viewAllEndpoint, border = true, canUserEditTeam }: Object) {
  const { id } = useParams();
  const token = useSelector((state) => state.auth.token);
  const [selectedProjectStatus, setSelectedProjectStatus] = useState('PUBLISHED');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [response, setResponse] = useState({
    type: 'success',
    projectId: 0,
    message: '',
  });

  // eslint-disable-next-line no-unused-vars
  const [, isloading, projects, refetch] = useFetchWithAbort(
    `projects/?teamId=${id}&omitMapResults=true&projectStatuses=${selectedProjectStatus}`,
    id,
  );

  // bulk action
  const unlinkAllProjectsFromTeam = () => {
    fetchLocalJSONAPI(`teams/projects/teams/${id}/unlink`, token, 'DELETE')
      .then(() => {
        setResponse({ type: 'success', message: 'Projects Unlinked Successfully' });
        refetch();
      })
      .catch((e) => {
        if (e.message === 'ProjectPermissionError') {
          setResponse({
            type: 'error',
            message:
              'Project has mapping/validation permissions restricted to teams, but no other team is assigned. Please contact the project author before unlinking.',
          });
        }
        console.log(e.message);
      })
      .finally(() => {
        setSelectedProjects([]);
      });
  };

  const unlinkProjectsByIds = (projectIds = []) => {
    const payload = {
      items: projectIds.map((projectId) => ({ project_id: projectId, team_id: Number(id) })),
    };
    pushToLocalJSONAPI(`teams/projects/unlink`, JSON.stringify(payload), token, 'DELETE')
      .then(() => {
        setResponse({ type: 'success', message: 'Project Unlinked Successfully' });
        refetch();
      })
      .catch((e) => {
        if (e.message === 'ProjectPermissionError') {
          setResponse({
            type: 'error',
            message:
              'Project has mapping/validation permissions restricted to teams, but no other team is assigned. Please contact the project author before unlinking.',
            projectId: projectIds.length === 1 ? projectIds[0] : 0,
          });
        }
        console.log(e.message);
      })
      .finally(() => {
        setSelectedProjects([]);
      });
  };

  const handleProjectSelection = (selectedProjectId) => {
    if (selectedProjects.includes(selectedProjectId))
      return setSelectedProjects((prev) => prev.filter((project) => project !== selectedProjectId));
    return setSelectedProjects((prev) => [...prev, selectedProjectId]);
  };

  return (
    <>
      {!response.projectId && response.message && (
        <Alert type={response.type}>{response.message}</Alert>
      )}
      <div className={`bg-white mb3 ${border ? 'b--grey-light ba pa4' : ''}`}>
        <div className="flex justify-between">
          <h3 className="f3 barlow-condensed ttu blue-dark mv0 fw6 dib v-mid">
            <FormattedMessage {...messages.projects} />
          </h3>
          <div className="flex items-center">
            <ViewAllLink link={viewAllEndpoint} />
            <CustomButton
              className="dib bn fr red link hover-dark-red bg-transparent mt2 ml4"
              onClick={() => {
                unlinkAllProjectsFromTeam();
              }}
            >
              <FormattedMessage {...messages.unlinkAll} />
            </CustomButton>
          </div>
        </div>
        <div className="pv2">
          {canUserEditTeam && (
            <div style={{ width: '280px' }}>
              <CustomMenu
                items={items}
                activeMenuItem={selectedProjectStatus}
                onItemClick={(itemId) => setSelectedProjectStatus(itemId)}
              />
            </div>
          )}
          <div className="pt3 flex flex-column">
            <ReactPlaceholder
              customPlaceholder={nTeamProjectsCardPlaceholders(4)}
              showLoadingAnimation={true}
              delay={10}
              ready={projects?.results && !isloading}
            >
              {projects?.results?.map((card) => (
                <TeamLinkedProjectCard
                  key={card.projectId}
                  projectId={card.projectId}
                  projectName={card.name}
                  unLinkFunc={canUserEditTeam ? unlinkProjectsByIds : () => {}}
                  canUserEditTeam={canUserEditTeam}
                  isProjectSelected={selectedProjects.includes(card.projectId)}
                  handleProjectSelection={handleProjectSelection}
                  errorMessage={
                    response?.message && response.projectId === card.projectId
                      ? response.message
                      : ''
                  }
                />
              ))}
            </ReactPlaceholder>
          </div>
        </div>
        {selectedProjects?.length > 0 && (
          <div className="flex justify-between items-center">
            <div className="gray text">
              {selectedProjects?.length} {`project${selectedProjects.length > 1 ? 's' : ''}`}{' '}
              selected
            </div>
            <Button
              className="bg-red white hover-bg-dark-red"
              onClick={() => {
                unlinkProjectsByIds(selectedProjects);
              }}
            >
              <FormattedMessage {...messages.unlinkSelected} />
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

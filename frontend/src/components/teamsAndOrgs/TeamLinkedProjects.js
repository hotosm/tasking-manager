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
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import toast from 'react-hot-toast';

const items = [
  { id: 'PUBLISHED', label: <FormattedMessage {...statusMessages.status_PUBLISHED} /> },
  { id: 'ARCHIVED', label: <FormattedMessage {...statusMessages.status_ARCHIVED} /> },
  { id: 'DRAFT', label: <FormattedMessage {...statusMessages.status_DRAFT} /> },
];

export function TeamLinkedProjects({ viewAllEndpoint, border = true, canUserEditTeam }: Object) {
  const { id } = useParams();
  const token = useSelector((state) => state.auth.token);
  const [selectedProjectStatus, setSelectedProjectStatus] = useState('PUBLISHED');

  // eslint-disable-next-line no-unused-vars
  const [projectsError, projectsLoading, projects, refetch] = useFetchWithAbort(
    `projects/?teamId=${id}&omitMapResults=true&projectStatuses=${selectedProjectStatus}`,
    id,
  );

  const unLinkProjectFromTeam = (projectId) => {
    fetchLocalJSONAPI(`teams/${projectId}/teams/${id}/`, token, 'DELETE')
      .then(() => {
        toast.success('Unlinked Successfully');
        refetch();
      })
      .catch((e) => {
        console.log(e.message);
      });
  };

  return (
    <div className={`bg-white mb3 ${border ? 'b--grey-light ba pa4' : ''}`}>
      <h3 className="f3 barlow-condensed ttu blue-dark mv0 fw6 dib v-mid">
        <FormattedMessage {...messages.projects} />
      </h3>
      <ViewAllLink link={viewAllEndpoint} />
      <div className="pv2">
        <div style={{ width: '230px' }}>
          <CustomMenu
            items={items}
            activeMenuItem={selectedProjectStatus}
            onItemClick={(itemId) => setSelectedProjectStatus(itemId)}
          />
        </div>
        <div className="pt3">
          <ReactPlaceholder
            customPlaceholder={nTeamProjectsCardPlaceholders(4)}
            showLoadingAnimation={true}
            delay={10}
            ready={projects?.results}
          >
            {projects?.results?.map((card) => (
              <TeamLinkedProjectCard
                projectId={card.projectId}
                projectName={card.name}
                unLinkFunc={canUserEditTeam ? unLinkProjectFromTeam : () => {}}
                canUserEditTeam={canUserEditTeam}
              />
            ))}
          </ReactPlaceholder>
        </div>
      </div>
    </div>
  );
}

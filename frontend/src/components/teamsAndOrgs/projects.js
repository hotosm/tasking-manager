import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';

import messages from './messages';
import { ProjectCard } from '../projectCard/projectCard';
import { AddButton, ViewAllLink } from './management';
import { nCardPlaceholders } from '../projectCard/nCardPlaceholder';

export function Projects({
  projects,
  viewAllEndpoint,
  ownerEntity,
  showAddButton = false,
  showManageButtons = true,
  border = true,
}: Object) {
  return (
    <div className={`bg-white mb3 ${border ? 'b--grey-light ba pa4' : ''}`}>
      <h3 className="f3 barlow-condensed ttu blue-dark mv0 fw6 dib v-mid">
        <FormattedMessage {...messages.projects} />
      </h3>
      {showAddButton && (
        <Link to={'/manage/projects/new/'} className="dib ml4">
          <AddButton />
        </Link>
      )}
      <ViewAllLink link={viewAllEndpoint} />
      <div className="pt4 cards-container">
        <ReactPlaceholder
          customPlaceholder={nCardPlaceholders(4)}
          showLoadingAnimation={true}
          delay={10}
          ready={projects?.results}
        >
          {projects?.results?.slice(0, 6).map((card) => (
            <ProjectCard key={card.projectId} showBottomButtons={showManageButtons} {...card} />
          ))}
          {projects?.results?.length === 0 && (
            <span className="blue-grey">
              <FormattedMessage
                {...messages.noProjectsFound}
                values={{
                  entity: (
                    <span className="ttl">
                      <FormattedMessage {...messages[ownerEntity]} />
                    </span>
                  ),
                }}
              />
            </span>
          )}
        </ReactPlaceholder>
      </div>
    </div>
  );
}

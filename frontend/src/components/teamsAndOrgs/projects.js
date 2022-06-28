import React from 'react';
import { Link } from '@reach/router';
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
      <div className="cf db">
        <h3 className="f3 barlow-condensed ttu blue-dark mv0 fw6 dib v-mid">
          <FormattedMessage {...messages.projects} />
        </h3>
        {showAddButton && (
          <Link to={'/manage/projects/new/'} className="dib ml4">
            <AddButton />
          </Link>
        )}
        <ViewAllLink link={viewAllEndpoint} />
        <div className="cf pt4">
          <ReactPlaceholder
            customPlaceholder={nCardPlaceholders(4, 'w-third-l')}
            showLoadingAnimation={true}
            delay={10}
            ready={projects?.results}
          >
            {projects &&
              projects.results &&
              projects.results
                .slice(0, 6)
                .map((card, n) => (
                  <ProjectCard
                    cardWidthClass="w-third-l"
                    {...card}
                    key={n}
                    showBottomButtons={showManageButtons}
                  />
                ))}
            {projects && projects.results && projects.results.length === 0 && (
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
    </div>
  );
}

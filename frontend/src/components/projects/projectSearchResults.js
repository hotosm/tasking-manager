import React from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';

import { nCardPlaceholders } from '../projectCard/nCardPlaceholder';
import { ProjectCard } from '../projectCard/projectCard';
import messages from './messages';
import { ProjectListItem } from './list';

export const ProjectSearchResults = ({
  className,
  status,
  projects,
  pagination,
  retryFn,
  management,
  showBottomButtons,
}) => {
  const listViewIsActive = useSelector((state) => state.preferences['projectListView']);
  const cardWidthClass = 'w-100';
  const isShowListView = management && listViewIsActive;

  return (
    <div className={`${className}`}>
      <p className="blue-light f6 ttl mv3">
        {status === 'loading' && <span>&nbsp;</span>}
        {status === 'success' && (
          <FormattedMessage
            {...messages.paginationCount}
            values={{
              number: projects?.length,
              total: <FormattedNumber value={pagination ? pagination.total : 0} />,
            }}
          />
        )}
      </p>
      {status === 'error' && (
        <div className="bg-tan pa4">
          <FormattedMessage
            {...messages.errorLoadingTheXForY}
            values={{
              xWord: <FormattedMessage {...messages.projects} />,
              yWord: 'Explore Projects',
            }}
          />
          <div className="pa2">
            <button className="pa1" onClick={() => retryFn()}>
              <FormattedMessage {...messages.retry} />
            </button>
          </div>
        </div>
      )}
      {status !== 'error' && (
        <div className={`${!isShowListView ? 'cards-container' : ''}`}>
          {isShowListView ? (
            <ReactPlaceholder
              showLoadingAnimation={true}
              rows={15}
              delay={50}
              ready={status === 'success'}
            >
              <ExploreProjectList pageOfCards={projects} cardWidthClass={cardWidthClass} />
            </ReactPlaceholder>
          ) : (
            <ReactPlaceholder
              customPlaceholder={nCardPlaceholders(5, cardWidthClass)}
              ready={status === 'success'}
            >
              <ExploreProjectCards
                pageOfCards={projects}
                cardWidthClass={cardWidthClass}
                showBottomButtons={showBottomButtons}
              />
            </ReactPlaceholder>
          )}
        </div>
      )}
    </div>
  );
};

export const ExploreProjectCards = (props) => {
  if (props.pageOfCards?.length === 0) {
    return null;
  }
  /* cardWidthClass={props.cardWidthClass} as a parameter offers more variability in the size of the cards, set to 'cardWidthNone' disables */
  return props.pageOfCards.map((card, n) => (
    <ProjectCard
      cardWidthClass={props.cardWidthClass}
      {...card}
      key={n}
      showBottomButtons={props.showBottomButtons}
    />
  ));
};

export const ExploreProjectList = (props) => {
  if (props.pageOfCards?.length === 0) {
    return null;
  }
  /* cardWidthClass={props.cardWidthClass} as a parameter offers more variability in the size of the cards, set to 'cardWidthNone' disables */
  return props.pageOfCards.map((project, n) => <ProjectListItem project={project} key={n} />);
};

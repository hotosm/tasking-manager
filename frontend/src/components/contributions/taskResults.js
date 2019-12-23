import React from 'react';

import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';
// import { nCardPlaceholders } from '../projectcard/nCardPlaceholder';

import { TaskCard} from './taskCard';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import messages from './messages';

export const TaskResults = props => {
  const state = props.state;
  // const cardWidthClass = 'w-third-l';

  return (
    <div className={props.className}>
        {state.isLoading ? (
          <span>&nbsp;</span>
        ) : (
          !state.isError && (
            
             <p className="blue-grey ml3 pt2 f7"><FormattedMessage
              {...messages.showingXProjectsOfTotal}
              values={{
                numProjects: state.tasks && state.tasks.length,
                numRange:
                  state.pagination &&
                  state.pagination.page > 1 &&
                  state.pagination.page * state.pagination.perPage <= state.pagination.total &&
                  [': ', state.pagination.page * state.pagination.perPage, ' '].join(''),
                numTotalProjects: (
                  <FormattedNumber value={state.pagination && state.pagination.total} />
                ),
              }}
            /></p>
          )
        )}
      {state.isError ? (
        <div className="bg-tan pa4 mt3">
          <FormattedMessage
            {...messages.errorLoadingTheXForY}
            values={{
              xWord: <FormattedMessage {...messages.tasks} />,
              yWord: <FormattedMessage {...messages.myContributions} />,
            }}
          />
          <div className="pa2">
            <button className="pa1" onClick={() => props.retryFn()}>
              Retry
            </button>
          </div>
        </div>
      ) : null}
      <div className={`cf db`}>
        <ReactPlaceholder
          // customPlaceholder={nCardPlaceholders(5, cardWidthClass)}
          ready={!state.isLoading}
          type="media"
          rows={10}
        >
          <TaskCards pageOfCards={state.tasks}  />
        </ReactPlaceholder>
      </div>
    </div>
  );
};

const TaskCards = props => {
  if (!props || !props.pageOfCards || props.pageOfCards.length === 0) {
    return null;
  }
  const filterFn = n => n;
  const filteredCards = props.pageOfCards.filter(filterFn);

  if (filteredCards < 1) {
    return (<div className="mb3 blue-grey"><FormattedMessage {...messages.noContributed}/></div>);
  }

  return filteredCards.map((card, n) =>
      <TaskCard {...card} key={n} />
  );
};

import React from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';

import messages from './messages';
import { TaskCard } from './taskCard';

export const TaskResults = (props) => {
  const state = props.state;

  return (
    <div className={props.className}>
      {state.isLoading ? (
        <span>&nbsp;</span>
      ) : (
        !state.isError && (
          <p className="blue-grey ml3 pt2 f7">
            <FormattedMessage
              {...messages.paginationCount}
              values={{
                number: state.tasks && state.tasks.length,
                total: <FormattedNumber value={state.pagination && state.pagination.total} />,
              }}
            />
          </p>
        )
      )}
      {state.isError && (
        <div className="bg-tan pa4 mt3">
          <FormattedMessage {...messages.errorLoadingTasks} />
          <div className="pa2">
            <button className="pa1" onClick={() => props.retryFn()}>
              <FormattedMessage {...messages.retry} />
            </button>
          </div>
        </div>
      )}
      <div className={`cf db`}>
        <ReactPlaceholder ready={!state.isLoading} type="media" rows={10}>
          <TaskCards pageOfCards={state.tasks} />
        </ReactPlaceholder>
      </div>
    </div>
  );
};

const TaskCards = (props) => {
  if (!props || !props.pageOfCards || props.pageOfCards.length === 0) {
    return null;
  }
  const filterFn = (n) => n;
  const filteredCards = props.pageOfCards.filter(filterFn);

  if (filteredCards < 1) {
    return (
      <div className="mb3 blue-grey">
        <FormattedMessage {...messages.noContributed} />
      </div>
    );
  }

  return filteredCards.map((card, n) => <TaskCard {...card} key={n} />);
};

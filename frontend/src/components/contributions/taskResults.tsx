import { FormattedMessage, FormattedNumber } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';

import messages from './messages';
import { TaskCard } from './taskCard';

export interface TaskCardProps {
  projectId: number;
  taskId: number;
}

interface TaskResultsProps {
  state: {
    isLoading: boolean;
    isError: boolean;
    tasks: TaskCardProps[];
    pagination?: {
      total: number;
    };
  };
  className?: string;
  retryFn: () => void;
}

export const TaskResults: React.FC<TaskResultsProps> = (props) => {
  const state = props.state;

  return (
    <div className={props.className}>
      {!state.isLoading && !state.isError && (
        <p className="blue-grey ml3 pt2 f7">
          <FormattedMessage
            {...messages.paginationCount}
            values={{
              number: state.tasks?.length ?? 0,
              total: <FormattedNumber value={state.pagination?.total ?? 0} />,
            }}
          />
        </p>
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
        <ReactPlaceholder showLoadingAnimation ready={!state.isLoading} type="media" rows={10}>
          <TaskCards pageOfCards={state.tasks} />
        </ReactPlaceholder>
      </div>
    </div>
  );
};

interface TaskCardsProps {
  pageOfCards?: TaskCardProps[];
}

export const TaskCards: React.FC<TaskCardsProps> = ({ pageOfCards }) => {
  if (pageOfCards?.length === 0) {
    return (
      <div className="mb3 blue-grey">
        <FormattedMessage {...messages.noContributed} />
      </div>
    );
  }

  return pageOfCards?.map((card) => <TaskCard {...card} key={`${card.projectId}${card.taskId}`} />);
};

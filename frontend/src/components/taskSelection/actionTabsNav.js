import React, { useRef } from 'react';
import { FormattedMessage } from 'react-intl';

import { HorizontalScroll } from '../horizontalScroll';
import messages from './messages';

export const ActionTabsNav = ({
  activeSection,
  setActiveSection,
  activeTasks,
  historyTabSwitch,
  taskHistoryLength,
  action,
}) => {
  const tabContainerRef = useRef(null);

  return (
    <HorizontalScroll
      menuItemsContainerRef={tabContainerRef}
      containerClass=".menu-items-container"
      className="mb3"
    >
      <div
        ref={tabContainerRef}
        className="ttu w-100 barlow-condensed menu-items-container f4 blue-dark nowrap bb b--grey-light fw5 overflow-x-auto"
      >
        <span
          role="button"
          className={`dib mr4-l mr3 pb2 pointer ${
            activeSection === 'completion' && 'bb b--red bw1'
          }`}
          onClick={() => setActiveSection('completion')}
        >
          <FormattedMessage {...messages.completion} />
        </span>
        <span
          role="button"
          className={`dib mr4-l mr3 pb2 pointer ${
            activeSection === 'instructions' && 'bb b--red bw1'
          }`}
          onClick={() => setActiveSection('instructions')}
        >
          <FormattedMessage {...messages.instructions} />
        </span>
        <span
          role="button"
          className={`inline-flex items-center mr4-l mr3 pb2 pointer ${
            activeSection === 'history' && 'bb b--red bw1'
          }`}
          onClick={() => historyTabSwitch()}
        >
          <FormattedMessage {...messages.history} />
          {activeTasks.length === 1 && taskHistoryLength > 1 && (
            <span
              className="bg-red white br-100 f6 ml1 flex items-center justify-center"
              style={{ height: '1.125rem', width: '1.125rem' }}
            >
              {taskHistoryLength}
            </span>
          )}
        </span>
        {action === 'VALIDATION' && (
          <span
            role="button"
            className={`dib mr4-l mr3 pb2 pointer ${
              activeSection === 'resources' && 'bb b--red bw1'
            }`}
            onClick={() => setActiveSection('resources')}
          >
            <FormattedMessage {...messages.resources} />
          </span>
        )}
      </div>
    </HorizontalScroll>
  );
};

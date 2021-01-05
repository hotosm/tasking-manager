import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

export const ActionTabsNav = ({
  activeSection,
  setActiveSection,
  activeTasks,
  historyTabSwitch,
  taskHistoryLength,
  action,
}) => {
  return (
    <div className="cf ttu barlow-condensed f4 pv2 blue-dark">
      <span
        className={`mr4-l mr3 pb2 pointer ${activeSection === 'completion' && 'bb b--blue-dark'}`}
        onClick={() => setActiveSection('completion')}
      >
        <FormattedMessage {...messages.completion} />
      </span>
      <span
        className={`mr4-l mr3 pb2 pointer ${activeSection === 'instructions' && 'bb b--blue-dark'}`}
        onClick={() => setActiveSection('instructions')}
      >
        <FormattedMessage {...messages.instructions} />
      </span>
      <span
        className={`mr4-l mr3 pb2 pointer truncate ${
          activeSection === 'history' && 'bb b--blue-dark'
        }`}
        onClick={() => historyTabSwitch()}
      >
        <FormattedMessage {...messages.history} />
        {activeTasks.length === 1 && taskHistoryLength > 1 && (
          <span
            className="bg-red white dib br-100 tc f6 ml1 mb1 v-mid"
            style={{ height: '1.125rem', width: '1.125rem' }}
          >
            {taskHistoryLength}
          </span>
        )}
      </span>
      {action === 'VALIDATION' && (
        <span
          className={`mr4-l mr3 pb2 pointer ${activeSection === 'resources' && 'bb b--blue-dark'}`}
          onClick={() => setActiveSection('resources')}
        >
          <FormattedMessage {...messages.resources} />
        </span>
      )}
    </div>
  );
};

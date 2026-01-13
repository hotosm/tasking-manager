import { FormattedMessage } from 'react-intl';
import { InfoIcon } from '../svgIcons';
import messages from './messages';

const OtherTabInfo = ({ activeSection, setActiveSection, historyTabSwitch, action }) => {
  return (
    <div className="bg-lightest-blue pa3">
      <div className="f5 gray">
        <span className="mr2 flex items-center pb1">
          <span className="mr2">
            <InfoIcon style={{ height: '20px' }} />
          </span>
          <strong>
            <FormattedMessage {...messages.otherTabs} /> &#58;
          </strong>
        </span>
        {activeSection !== 'instructions' && (
          <span className="flex items-center pb1">
            <span
              className="link dark-gray hover-dark-blue pointer mr1"
              onClick={() => setActiveSection('instructions')}
            >
              <FormattedMessage {...messages.instructions} />:
            </span>
            <FormattedMessage {...messages.instructionTabDescription} />
          </span>
        )}

        {activeSection !== 'history' && (
          <span className="flex items-center pb1">
            <span
              className="link dark-gray hover-dark-blue pointer mr1"
              onClick={() => historyTabSwitch()}
            >
              <FormattedMessage {...messages.history} />:
            </span>
            <FormattedMessage {...messages.historyTabDescription} />
          </span>
        )}

        {activeSection !== 'completion' && (
          <span className="flex items-center pb1">
            <span
              className="link dark-gray hover-dark-blue pointer mr1"
              onClick={() => setActiveSection('completion')}
            >
              <FormattedMessage {...messages.completion} />:
            </span>
            <FormattedMessage {...messages.completionTabDescription} />
          </span>
        )}
        {action === 'VALIDATION' && activeSection !== 'resources' && (
          <span className="flex items-center pb1">
            <span
              className="link dark-gray hover-dark-blue pointer mr1"
              onClick={() => setActiveSection('resources')}
            >
              <FormattedMessage {...messages.resources} />:
            </span>
            <FormattedMessage {...messages.resourcesTabDescription} />
          </span>
        )}
      </div>
    </div>
  );
};

export default OtherTabInfo;

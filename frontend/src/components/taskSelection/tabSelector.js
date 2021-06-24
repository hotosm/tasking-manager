import { FormattedMessage } from 'react-intl';

import messages from './messages';

export const TabSelector = ({ activeSection, setActiveSection }) => (
  <div className="cf ttu barlow-condensed f4 pv2 blue-dark">
    {['tasks', 'instructions', 'contributions'].map((section) => (
      <span
        key={section}
        className={`mr4 pb1 pointer ${activeSection === section && 'bb bw1 b--blue-dark'}`}
        onClick={() => setActiveSection(section)}
      >
        <FormattedMessage {...messages[section]} />
      </span>
    ))}
  </div>
);

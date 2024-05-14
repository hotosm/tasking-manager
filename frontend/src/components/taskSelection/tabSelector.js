import { FormattedMessage } from 'react-intl';

import messages from './messages';

export const TabSelector = ({ activeSection, setActiveSection }) => (
  <div className="ttu barlow-condensed f4 blue-dark bb b--grey-light">
    {['tasks', 'instructions', 'contributions'].map((section) => (
      <div
        key={section}
        role="button"
        className={`mr4 pb2 fw5 pointer dib ${activeSection === section && 'bb bw1'}`}
        style={{ letterSpacing: '-0.0857513px', borderColor: '#979797' }}
        onClick={() => setActiveSection(section)}
      >
        <FormattedMessage {...messages[section]} />
      </div>
    ))}
  </div>
);

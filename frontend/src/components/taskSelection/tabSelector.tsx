import { useSelector } from 'react-redux';

import { RootStore } from '../../store';

export const TabSelector = ({
  activeSection,
  setActiveSection,
}: {
  activeSection: string;
  setActiveSection: (section: string) => void;
}) => {
  const token = useSelector((state: RootStore) => state.auth.token);
  const tabs = token ? ['tasks', 'instructions', 'contributions'] : ['instructions'];

  return (
    <div className="ttu barlow-condensed f4 blue-dark bb b--grey-light">
      {tabs.map((section) => (
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
};

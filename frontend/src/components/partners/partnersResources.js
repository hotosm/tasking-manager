import { FormattedMessage } from 'react-intl';

import { CustomDropdown } from './customDropdown';
import messages from '../../views/messages';

export const Resources = ({ partner }) => {
  const renderWebsiteLinks = () => {
    if (!partner || !Object.keys(partner).length) {
      return null;
    }
    const nameKeys = Object.keys(partner).filter((key) => key.startsWith('name_'));
    const urlKeys = Object.keys(partner).filter((key) => key.startsWith('url_'));
    const websiteLinks = nameKeys.map((nameKey, index) => ({
      name: partner[nameKey],
      url: partner[urlKeys[index]],
    }));

    const resourcesData = websiteLinks.map((link) => ({
      ...link,
      label: link.name,
      onClick: (item) => {
        window.open(item.url, '_blank');
      },
    }));

    if (!resourcesData.length) return <></>;

    return (
      <CustomDropdown
        buttonClassname="bg-transparent partners-banner-button"
        title={<FormattedMessage {...messages.resources} />}
        data={resourcesData}
      />
    );
  };

  return renderWebsiteLinks();
};

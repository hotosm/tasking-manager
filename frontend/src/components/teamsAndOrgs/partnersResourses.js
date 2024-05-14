import { TwitterIcon, FacebookIcon, InstagramIcon } from '../svgIcons';
import { CustomButton } from '../button';

export const Resources = ({ partner }) => {
  const renderSocialButtons = () => {
    const socialLinks = [
      {
        name: 'link_x',
        label: 'Twitter',
        icon: <TwitterIcon noBg className="white v-mid" />,
      },
      { name: 'link_meta', label: 'Facebook', icon: <FacebookIcon className="v-mid" /> },
      {
        name: 'link_instagram',
        label: 'Instagram',
        icon: <InstagramIcon className="v-mid " />,
      },
    ];

    return (
      <div className="ph6-l flex flex-wrap flex-nowrap-ns stats-container">
        {socialLinks.map(
          (link, index) =>
            partner[link.name] && (
              <a
                key={index}
                href={partner[link.name]}
                target="_blank"
                rel="noreferrer"
                className="link ttu di-l dib center "
              >
                <CustomButton
                  className="bg-red ba b--red white center w4  pv1 ph3 mv2 mh2 h2"
                  icon={link.icon}
                >
                  {link.label}
                </CustomButton>
              </a>
            ),
        )}
      </div>
    );
  };

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
    return (
      <div className="ph6-l flex flex-wrap flex-nowrap-ns stats-container">
        {websiteLinks.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="link ttu di-l dib center m1"
          >
            <CustomButton className="bg-red ba b--red white pv2 ph3 mv2 mh2 w4">
              {link.name}
            </CustomButton>
          </a>
        ))}
      </div>
    );
  };

  return (
    <>
      {renderSocialButtons()}
      {renderWebsiteLinks()}
    </>
  );
};

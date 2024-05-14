import { TwitterIcon, FacebookIcon, InstagramIcon } from '../svgIcons';
import { Button } from '../button';

export const Resources = ({ partner }) => {
  const renderSocialButtons = () => {
    const socialLinks = [
      { name: 'link_x', label: 'Twitter', icon: <TwitterIcon noBg className="white " /> },
      { name: 'link_meta', label: 'Facebook', icon: <FacebookIcon className="" /> },
      { name: 'link_instagram', label: 'Instagram', icon: <InstagramIcon className="" /> },
    ];

    return (
      <div className="ph6-l  flex flex-wrap flex-nowrap-ns stats-container">
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
                <Button  className="bg-red ba b--red white center flex w4 h-50px" icon={link.icon}>
                  {link.label}
                </Button>
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
            <Button className="bg-red ba b--red white pv2 ph3 mv2 mh2 w4">{link.name}</Button>
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

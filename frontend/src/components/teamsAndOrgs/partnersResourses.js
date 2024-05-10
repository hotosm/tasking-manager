import { TwitterIcon, FacebookIcon, InstagramIcon } from '../svgIcons';
import { Button } from '../button';

export const Resources = ({ partner }) => {
  const renderSocialButtons = () => {
    const socialLinks = [
      { name: 'link_x', label: 'link ', icon: <TwitterIcon noBg className="white v-mid mb1" /> },
      { name: 'link_meta', label: 'link', icon: <FacebookIcon className=" v-mid mb1" /> },
      { name: 'link_instagram', label: 'link', icon: <InstagramIcon className=" v-mid mb1" /> },
    ];

    return (
      <div className="pt5 pb2 ph6-l ph4 flex flex-wrap flex-nowrap-ns stats-container">
        {socialLinks.map(
          (link, index) =>
            partner[link.name] && (
              <a
                key={index}
                href={partner[link.name]}
                target="_blank"
                rel="noreferrer"
                className="link ttu di-l dib center"
              >
                <Button className="bg-red ba b--red white pv2 ph3 mv2 mh2" icon={link.icon}>
                  {link.label}
                </Button>
              </a>
            ),
        )}
      </div>
    );
  };

  const renderWebsiteLinks = () => {
    if (!partner.website_links || !Array.isArray(partner.website_links)) {
      return null;
    }

    return (
      <div className="pt5 pb2 ph6-l ph4 flex flex-wrap flex-nowrap-ns stats-container">
        {partner.website_links.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="link ttu di-l dib center"
          >
            <Button className="bg-red ba b--red white pv2 ph3 mv2 mh2">{link.name}</Button>
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

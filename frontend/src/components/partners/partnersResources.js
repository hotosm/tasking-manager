import { CustomButton } from '../button';

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
    return (
      <div className="">
        {websiteLinks.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="link ttu di-l dib center m1"
          >
            <CustomButton className="ba b--red red pa2 mv2 mh2 w4">{link.name}</CustomButton>
          </a>
        ))}
      </div>
    );
  };

  return renderWebsiteLinks();
};

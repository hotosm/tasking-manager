import { FormattedMessage, FormattedNumber } from 'react-intl';
import shortNumber from 'short-number';
import {
  TwitterIcon,
  FacebookIcon,
  GithubIcon,
  InstagramIcon,
  ExternalLinkIcon,
} from '../svgIcons';
import { CustomButton } from '../button';
import messages from './messages';

export const Resources = ({ partner }) => {
  const socialNetworks = [
    {
      link: 'X Link',
      icon: <TwitterIcon style={{ height: '20px', width: '20px', color: 'red' }} noBg />,
    },
    {
      link: 'Meta Link',
      icon: <FacebookIcon style={{ height: '20px', width: '20px', color: 'red' }} />,
    },
    {
      link: 'Instagram Link',
      icon: <InstagramIcon style={{ height: '20px', width: '20px', color: 'red' }} />,
    },
    {
      link: 'Webpage Link',
      icon: <ExternalLinkIcon style={{ height: '20px', width: '20px', color: 'red' }} />,
    },
    {
      link: 'Feedback Link',
      icon: <GithubIcon style={{ height: '20px', width: '20px', color: 'red' }} />,
    },
  ];
  return (
    <>
      <div className="pt5 pb2 ph6-l ph4 flex flex-wrap flex-nowrap-ns stats-container">
        {socialNetworks
          .filter((item) => item.link)
          .map((item, n) => (
            <a
              key={n}
              href={item.link}
              className="link barlow-condensed white f4 ttu di-l dib center"
            >
              <CustomButton className=" flex center ba b--none bg-transparent red pv2 ph3" icon={item.icon}>
                <span className="v-mid f4 fw6 ttu pl2">{item.link}</span>
              </CustomButton>
            </a>
          ))}
      </div>
    </>
  );
};

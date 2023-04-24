import { FormattedMessage } from 'react-intl';

import messages from './messages';
// import {RightIcon, LeftIcon} from '../../svgIcons';

export function Testimonials() {
  const testimonials = [
    {
      name: 'Lauren Bateman',
      bio: messages.ifrcBio,
      citation: messages.ifrcCitation,
      cssCode: 'ifrc',
      image: '.../../images/ifrc.png',
    },
  ];

  return (
    <div className="pt5-l pb5 pl6-l pb6-l pl4 testimonials">
      <h3 className="barlow-condensed blue-dark f2 fw5 ttu">
        <FormattedMessage {...messages.testimonialsTitle} />
      </h3>
      {
        // enable it when we have the carousel ready
        // <div className="red cf tr pb4">
        //   <LeftIcon className="pr2" /> <RightIcon />
        // </div>
      }
      {testimonials.map((person, n) => (
        <div className="testimony relative" key={person.name}>
          {/* <div key={n} className={`blue-dark testimonial-${person.cssCode} relative`} /> */}
          <div className="testimonial-image-parent">
            <img
              className="testimonial-image"
              src={require('../../assets/img/testimonials/ifrc.jpg').default}
              alt={person.name}
            />
          </div>
          <div className="citation-ctr">
            <p className="bg-red white pv2 pl3 pr1 citation ma0 relative">
              <FormattedMessage {...person.citation} />
              <span className="quotes-icon red ma0">&ldquo;</span>
            </p>
            <div className="w-70-l w-50-m mh3 mh0-ns">
              <h4 className="f5 fw7 mb1 tl-m witness">{person.name},</h4>
              <p className="f6 tl-m ma0 bio">
                <FormattedMessage {...person.bio} />
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
// import {RightIcon, LeftIcon} from '../../svgIcons';

export function Testimonials() {
  const testimonials = [
    {
      name: 'Michael Yani',
      bio: messages.michaelYaniBio,
      citation: messages.michaelYaniCitation,
      cssCode: 'michaelyani',
    },
  ];
  return (
    <div className="pt4-l pb5 ph5-l ph4">
      <h3 className="barlow-condensed blue-dark f1-l f2 fw8 ttu">
        <FormattedMessage {...messages.testimonialsTitle} />
      </h3>
      {
        // enable it when we have the carousel ready
        // <div className="red cf tr pb4">
        //   <LeftIcon className="pr2" /> <RightIcon />
        // </div>
      }
      <div>
        {testimonials.map((person, n) => (
          <div key={n} className={`blue-dark cf testimonial-${person.cssCode}`}>
            <div className="w-40-l w-50-m fl ml2-l mt4-ns mt6">
              <div className="bg-red white f3-l f4 pv2 mt5-l pl3 pr1">
                <FormattedMessage {...person.citation} />
              </div>
              <div className="w-70-l w-60-m mh3 mh0-ns ph3 pb5-l pt4-l">
                <p className="f4 fw6 mb1 tc">{person.name},</p>
                <p className="f6 tc mt2 mw-3">
                  <FormattedMessage {...person.bio} />
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { MappingIcon, ValidationIcon, DataUseIcon } from '../svgIcons';

import messages from './messages';

function MappingCard({ image, title, description }: Object) {
  return (
    <div className="w-third-l w-100 dib fl ph2-l pv3">
      <div className="shadow-4 mh2">
        <div className="pa4 ph3-m">
          <div className="red dib">{image}</div>
          <h4 className="blue-dark b">
            <FormattedMessage {...title} />
          </h4>
          <p className="blue-grey">
            <FormattedMessage {...description} />
          </p>
        </div>
      </div>
    </div>
  );
}

export function MappingFlow() {
  const imageHeight = '5rem';
  const cards = [
    {
      image: <MappingIcon style={{ height: imageHeight }} />,
      title: messages.mappingCardTitle,
      description: messages.mappingCardDescription,
    },
    {
      image: <ValidationIcon style={{ height: imageHeight }} />,
      title: messages.validationCardTitle,
      description: messages.validationCardDescription,
    },
    {
      image: <DataUseIcon style={{ height: imageHeight }} />,
      title: messages.usingDataCardTitle,
      description: messages.usingDataCardDescription,
    },
  ];
  return (
    <div className="black">
      <div className="ph6-l ph4 pv3">
        <h3 className="mb4 mw-36rem-l lh-copy f3 fw6">
          <FormattedMessage
            {...messages.mappingFlowTitle}
            values={{ number: <FormattedNumber value={100000} /> }}
          />
        </h3>
        <p className="pr2 f5 f4-ns blue-dark lh-title mw7 mb4">
          <FormattedMessage {...messages.mappingFlowHeadline} />
        </p>
        <div className="cf">
          {cards.map((card, n) => (
            <MappingCard {...card} key={n} />
          ))}
        </div>
      </div>
    </div>
  );
}

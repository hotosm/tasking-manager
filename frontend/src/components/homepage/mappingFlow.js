import React from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import messages from './messages';
import { MappingIcon, ValidationIcon, DataUseIcon } from '../svgIcons';
import './styles.scss';

function MappingCard({ image, title, description }: Object) {
  return (
    <div className="w-100 w-third-l pv3 card bg-white">
      <div className="pa4 ph3-m">
        <div className="red dib">{image}</div>
        <h4 className="blue-dark b f125">
          <FormattedMessage {...title} />
        </h4>
        <p className="blue-grey f125">
          <FormattedMessage {...description} />
        </p>
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
    <div className="blue-dark ph6-l ph4 pv3 mapping-flow-container">
      <h3 className="mb3 mb4-ns lh-copy fw5 fw7-ns fw5-m">
        <FormattedMessage
          {...messages.mappingFlowTitle}
          values={{ number: <FormattedNumber value={100000} /> }}
        />
      </h3>
      <p className="pr2 f125 f4-ns blue-dark lh-title mw7 mb4 mappingFlowHeadline">
        <FormattedMessage {...messages.mappingFlowHeadline} />
      </p>
      <div className="flow-cards-container-parent">
        <div className="flex flex-column flex-row-l flow-cards-container">
          {cards.map((card, n) => (
            <MappingCard {...card} key={n} />
          ))}
        </div>
      </div>
    </div>
  );
}

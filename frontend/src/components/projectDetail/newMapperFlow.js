import React from 'react';
import { TaskSelectionIcon, AreaIcon, SubmitWorkIcon } from '../svgIcons';
import messages from './messages';
import { FormattedMessage } from 'react-intl';

function MappingCard({ image, title, description }: Object) {
  return (
    <div className="w-third-l w-100 dib fl ph2-l pv3">
      <div className="shadow-4 mh2">
        <div className="pa4 ph3-m">
          <div className="red dib">{image}</div>
          <h4 className="blue-dark b dib-m">
            <FormattedMessage {...title} />
          </h4>
          <p className="blue-grey dib-m">
            <FormattedMessage {...description} />
          </p>
        </div>
      </div>
    </div>
  );
}


export function NewMapperFlow() {
    const imageHeight = '5rem';
    const cards = [
      {
        image: <TaskSelectionIcon style={{ height: imageHeight }} />,
        title: messages.selectATaskCardTitle,
        description: messages.selectATaskCardDescription,
      },
      {
        image: <AreaIcon style={{ height: imageHeight }} />,
        title: messages.mapThroughOSMCardTitle,
        description: messages.mapThroughOSMCardDescription,
      },
      {
        image: <SubmitWorkIcon style={{ height: imageHeight }} />,
        title: messages.submitYourWorkCardTitle,
        description: messages.submitYourWorkCardDescription,
      },
    ];
    return (
      <div className="bg-white black">
        <div className="ph6-l ph4 pv3">
          <div className="cf">
            {cards.map((card, n) => (
              <MappingCard {...card} key={n} />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
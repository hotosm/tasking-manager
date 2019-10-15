import React from 'react';
import { TaskSelectionIcon, AreaIcon, SubmitWorkIcon } from '../svgIcons';
import messages from './messages';
import { FormattedMessage } from 'react-intl';

function MappingCard({ image, title, description }: Object) {
  return (
    <div className="dib ph2-l pv2">
      <div className="shadow-4 mh2 bg-white">
        <div className="pa1 ph3-m cf">
          <div className="red pt3 fl dib">{image}</div>
          <h4 className="blue-dark b dib-m">
            <FormattedMessage {...title} />
          </h4>
          <p className="blue-grey lh-copy dib-m">
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
        <div className="relative ph6-l ph4 pv3">
          <div className="relative z-1">
            {cards.map((card, n) => (
              <MappingCard {...card} key={n} />
            ))}
          </div>
          <div className="absolute ml5 top-2 di fl left-7 bg-light-gray w-100 mw7-l z-0" style={{'height':'94%'}} >
            &nbsp;
          </div>
        </div>
      </div>
    );
  }
  
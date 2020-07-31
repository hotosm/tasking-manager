import React from 'react';
import { useIntl } from 'react-intl';

import messages from './messages';
import { RoadIcon, HomeIcon, WavesIcon, TaskIcon, AsteriskIcon } from './svgIcons';

export const titledIcons = [
  { icon: RoadIcon, title: 'roads', value: 'ROADS' },
  { icon: HomeIcon, title: 'buildings', value: 'BUILDINGS' },
  { icon: WavesIcon, title: 'waterways', value: 'WATERWAYS' },
  { icon: TaskIcon, title: 'landUse', value: 'LAND_USE' },
  { icon: AsteriskIcon, title: 'other', value: 'OTHER' },
];

export function MappingTypes({ types = [], colorClass }: Object) {
  const intl = useIntl();
  return (
    <>
      {titledIcons.map((Element, k) => (
        <span title={intl.formatMessage(messages[Element.title])} key={k}>
          <Element.icon
            className={`ml1 mr3 ${
              types && types.includes(Element.value) ? colorClass : 'grey-light'
            }`}
            height="23"
          />
        </span>
      ))}
    </>
  );
}

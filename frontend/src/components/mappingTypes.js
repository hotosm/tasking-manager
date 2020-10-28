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
    <div className="flex flex-nowrap-ns flex-wrap" style={{maxWidth: titledIcons.length*44}}>
      {titledIcons.map((Element, k) => (
        <div title={intl.formatMessage(messages[Element.title])} key={k} className="flex-auto mr1">
          <Element.icon
            className={`${types && types.includes(Element.value) ? colorClass : 'grey-light'}`}
            height="23"
          />
        </div>
      ))}
    </div>
  );
}

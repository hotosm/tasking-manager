import React from 'react';

import { RoadIcon, HomeIcon, WavesIcon, TaskIcon, AsteriskIcon } from '../svgIcons';

export function MappingTypes({ types = [], colorClass }: Object) {
  const titledIcons = [
    { icon: RoadIcon, title: 'Roads', value: 'ROADS' },
    { icon: HomeIcon, title: 'Buildings', value: 'BUILDINGS' },
    { icon: WavesIcon, title: 'Waterways', value: 'WATERWAYS' },
    { icon: TaskIcon, title: 'Land use', value: 'LAND_USE' },
    { icon: AsteriskIcon, title: 'Other', value: 'OTHER' },
  ];
  return (
    <>
      {titledIcons.map((Element, k) => (
        <span title={Element.title} key={k}>
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

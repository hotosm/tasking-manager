import React from 'react';

import { RoadIcon, HomeIcon, WavesIcon, TaskIcon } from '../svgIcons';

export function MappingTypes({ types=[], colorClass }: Object) {
  const titledIcons = [
    { icon: RoadIcon, title: 'Roads', value: 'ROADS' },
    { icon: HomeIcon, title: 'Buildings', value: 'BUILDINGS' },
    { icon: WavesIcon, title: 'Waterways', value: 'WATERWAYS' },
    { icon: TaskIcon, title: 'Land use', value: 'LAND_USE' },
  ];
  return <>
    {titledIcons.map((Element, k) =>
      <Element.icon key={k}
        title={Element.title}
        className={`ml1 mr3 ${types.includes(Element.value) ? colorClass : 'grey-light'}`}
        height="23"
      />
    )}
  </>
}

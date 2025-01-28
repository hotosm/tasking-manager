import { useState } from 'react';

import { MAPBOX_TOKEN, BASEMAP_OPTIONS } from '../config';

export const BasemapMenu = ({ map }) => {
  // Remove elements that require mapbox token;
  let styles = BASEMAP_OPTIONS;
  if (!MAPBOX_TOKEN) {
    styles = BASEMAP_OPTIONS.filter((s) => typeof s.value === 'object');
  }

  const [basemap, setBasemap] = useState(styles[0].label);

  const handleClick = (style) => {
    let styleValue = style.value;

    if (typeof style.value === 'string') {
      styleValue = 'mapbox://styles/mapbox/' + style.value;
    }
    map.setStyle(styleValue);
    setBasemap(style.label);
  };

  return (
    <div className="bg-white blue-dark flex mt2 ml2 f7 fr br1 shadow-1">
      {styles.map((style, k) => {
        return (
          <div
            key={k}
            onClick={() => handleClick(style)}
            className={`ttc pv2 ph3 pointer link + ${
              basemap === style.label ? 'bg-grey-light fw6' : ''
            }`}
          >
            {style.label}
          </div>
        );
      })}
    </div>
  );
};

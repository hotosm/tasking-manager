import { useState } from 'react';
import { baseLayers } from '../config';

export const BasemapMenu = ({ map }: Object) => {
  const [basemap, setBasemap] = useState('OSM');

  const handleClick = (activeLayer) => {
    // toggle visibiity as per active base layer
    for (const layer of Object.keys(baseLayers)) {
      map.setLayoutProperty(
        `${layer}-layer`,
        'visibility',
        `${activeLayer}-layer` === `${layer}-layer` ? 'visible' : 'none',
      );
    }
    setBasemap(activeLayer);
  };

  return (
    <div className="bg-white blue-dark flex mt2 ml2 f7 fr br1 shadow-1">
      {Object.keys(baseLayers).map((baseLayer, k) => {
        return (
          <div
            key={k}
            onClick={() => handleClick(baseLayer)}
            className={`ttc pv2 ph3 pointer link + ${
              basemap === baseLayer ? 'bg-grey-light fw6' : ''
            }`}
          >
            {k === 0 ? `Default (${baseLayer})` : baseLayer}
          </div>
        );
      })}
    </div>
  );
};

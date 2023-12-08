import React from 'react';
import { RoadIcon, HomeIcon, WavesIcon, TaskIcon, AsteriskIcon } from '../svgIcons';
import FileFormatCard from './fileFormatCard';

export const TITLED_ICONS = [
  { Icon: RoadIcon, title: 'roads', value: 'ROADS' },
  { Icon: HomeIcon, title: 'buildings', value: 'BUILDINGS' },
  { Icon: WavesIcon, title: 'waterways', value: 'WATERWAYS' },
  { Icon: TaskIcon, title: 'landUse', value: 'LAND_USE' },
  { Icon: AsteriskIcon, title: 'other', value: 'OTHER' },
];

const fileFormats = [
  { format: 'SHP', url: 'https://s3.us-east-1.amazonaws.com/exports-stage.hotosm.org/' },
  { format: 'GEOJSON', url: 'https://s3.us-east-1.amazonaws.com/exports-stage.hotosm.org/' },
  { format: 'KML', url: 'https://s3.us-east-1.amazonaws.com/exports-stage.hotosm.org/' },
];
/**
 * Renders a list of download options for OSM data based on the project mapping types.
 *
 * @param {Array<string>} projectMappingTypes - The mapping types of the project.
 * @return {JSX.Element} - The JSX element containing the download options.
 */
export const DownloadOsmData = ({ projectMappingTypes }) => {
  const filteredMappingTypes = TITLED_ICONS?.filter((icon) =>
    projectMappingTypes?.includes(icon.value),
  );

  return (
    <div className="mb5 w-100 pa5 ph flex flex-wrap">
      {filteredMappingTypes.map((type) => (
        <div
          className="osm-card bg-white pa3 mr4 mt4 w-auto-m flex flex-wrap items-center  "
          style={{
            width: '560px',
            gap: '16px',
          }}
          key={type.title}
        >
          <div
            style={{
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <type.Icon
              title={type.title}
              color="#D73F3F"
              className="br1 h2 w2 pa1 ma1 ba b--white bw1 dib h-65 w-65"
              style={{ height: '56px' }}
            />
          </div>

          <div
            className="file-list flex barlow-condensed f3"
            style={{ display: 'flex', gap: '12px' }}
          >
            <p className="fw5 ttc">{type.title}</p>
            <FileFormatCard fileFormats={fileFormats} />
          </div>
        </div>
      ))}
    </div>
  );
};

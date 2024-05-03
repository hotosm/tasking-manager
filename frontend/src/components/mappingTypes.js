import { useIntl } from 'react-intl';

import messages from './messages';
import { RoadIcon, HomeIcon, WavesIcon, TaskIcon, AsteriskIcon } from './svgIcons';

export const TITLED_ICONS = [
  { Icon: RoadIcon, title: 'roads', value: 'ROADS' },
  { Icon: HomeIcon, title: 'buildings', value: 'BUILDINGS' },
  { Icon: WavesIcon, title: 'waterways', value: 'WATERWAYS' },
  { Icon: TaskIcon, title: 'landUse', value: 'LAND_USE' },
  { Icon: AsteriskIcon, title: 'other', value: 'OTHER' },
];

export function MappingTypes({ types = [], colorClass }: Object) {
  const intl = useIntl();
  return (
    <>
      {TITLED_ICONS.map((Element, k) => (
        <span title={intl.formatMessage(messages[Element.title])} key={k}>
          <Element.Icon
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

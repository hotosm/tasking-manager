import { FormattedMessage, useIntl } from 'react-intl';

import messages from './messages';
import { ClipboardIcon } from '../svgIcons';
import { useImageryOption } from '../../hooks/UseImageryOption';

function getCustomMessageId(imagery) {
  if (imagery) {
    if (imagery.startsWith('tms')) {
      return 'customTMSLayer';
    }
    if (imagery.startsWith('wms')) {
      return 'customWMSLayer';
    }
    if (imagery.startsWith('wmts')) {
      return 'customWMTSLayer';
    }
    if (imagery.startsWith('http') || imagery.startsWith('https')) {
      return 'customLayer';
    }
  }
}

export function Imagery({ value = '' }: Object) {
  const intl = useIntl();
  //eslint-disable-next-line
  const imageryOption = useImageryOption(value);
  const customMessageId = getCustomMessageId(value);

  const handleCopyToClipboard = () => navigator.clipboard.writeText(value);

  return (
    <p className={`f125 fw7 pt1 pr3 ma0 truncate blue-dark`}>
      {customMessageId && ( // show wms, wmts, tms, or other custom layers
        <span title={value}>
          <FormattedMessage {...messages[customMessageId]} />
        </span>
      )}

      {imageryOption !== null && imageryOption.value !== 'custom' && (
        // show Bing, Mapbox, ESRI and Maxar layers
        <span>{imageryOption.label}</span>
      )}
      {!customMessageId && imageryOption !== null && imageryOption.value === 'custom' && (
        // other not recognized custom layers, example: Digital Globe
        <span>{value}</span>
      )}
      {!imageryOption && <FormattedMessage {...messages.noImageryDefined} />}
      {customMessageId && (
        <span
          className="pointer pl2 blue-light hover-blue-dark"
          title={intl.formatMessage(messages.copyImageryURL)}
        >
          <ClipboardIcon width="16px" height="16px" onClick={handleCopyToClipboard} />
        </span>
      )}
    </p>
  );
}

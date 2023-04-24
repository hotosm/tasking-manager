import { useIntl } from 'react-intl';

import messages from './messages';

export default function HashtagPaste({ text, setFn, hashtag, className }: Object) {
  const intl = useIntl();
  return (
    <span
      className={`bb pointer ${className}`}
      style={{ borderBottomStyle: 'dashed' }}
      onClick={() => setFn(text ? `${text} ${hashtag}` : `${hashtag} `)}
      title={intl.formatMessage(messages[`${hashtag.replace('#', '')}HashtagTip`], {
        hashtag: hashtag,
      })}
    >
      {hashtag}
    </span>
  );
}

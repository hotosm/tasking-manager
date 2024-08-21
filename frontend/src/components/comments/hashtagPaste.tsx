import { useIntl } from 'react-intl';

import messages from './messages';

export default function HashtagPaste({ text, setFn, hashtag, className }: {
  text: string;
  setFn: (text: string) => void;
  hashtag: string;
  className: string;
}) {
  const intl = useIntl();
  return (
    <span
      className={`bb pointer ${className}`}
      style={{ borderBottomStyle: 'dashed' }}
      onClick={() => setFn(text ? `${text} ${hashtag}` : `${hashtag} `)}
      // @ts-expect-error TS Migrations
      title={intl.formatMessage(messages[`${hashtag.replace('#', '')}HashtagTip`], {
        hashtag: hashtag,
      })}
    >
      {hashtag}
    </span>
  );
}

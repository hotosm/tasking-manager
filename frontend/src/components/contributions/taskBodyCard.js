import React from 'react';
import { Link } from '@reach/router';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';

import { FormattedRelative, FormattedMessage } from 'react-intl';
import messages from './messages';

export function TaskBodyCard({
  loading,
  card: { messageId, name, messageType, fromUsername, subject, message, sentDate },
}: Object) {
  return (
    <ReactPlaceholder ready={!loading} type="media" rows={6}>
      <article className={`db  base-font mb3 mh2 blue-dark mw8`}>
        <div className={`dib`}>
          <div className={`pl5 f6 blue-grey`}>
            <FormattedRelative value={(sentDate && new Date(sentDate)) || new Date()} />
          </div>
        </div>
        <Link
          className={`link fr ba ma2 ph4 pv2 bg-red b--grey-light white`}
          to={`/inbox/delete/${messageId}`}
        >
          <FormattedMessage {...messages.delete} />
        </Link>
      </article>
    </ReactPlaceholder>
  );
}

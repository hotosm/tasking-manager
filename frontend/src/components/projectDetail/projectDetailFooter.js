import React from 'react';
import { Link } from '@reach/router';
import { Button } from '../button';

import { ShareIcon, FlagIcon } from '../svgIcons';
import { FormattedMessage } from 'react-intl';
import messages from './messages';

export const ProjectDetailFooter = props => {
  return (
    <div className={`${props.className} cf bt bb b--grey-light pl4`}>
      {/* TODO ADD ANCHORS */}
      <div className="dib-l fl w-60 dn pt3 mt2">
        <FormattedMessage {...messages.overview} />
        <span className="ph2">&#183;</span>
        <FormattedMessage {...messages.howToContribute} />
        <span className="ph2">&#183;</span>
        <FormattedMessage {...messages.questionsAndComments} />
        <span className="ph2">&#183;</span>
        <FormattedMessage {...messages.contributions} />
        <span className="ph2">&#183;</span>
        <FormattedMessage {...messages.relatedProjects} />
      </div>
      <div className="w-40 fr">
        <div className="w-20 fl tc dib pt2 pb3">
          <ShareIcon className="pt3 pr2" />
          <FormattedMessage {...messages.share} />
        </div>
        <div className="w-40 fl tc dib pt2 pb3">
          <FlagIcon className="pt3 pr2" />
          <FormattedMessage {...messages.addToFavorites} />
        </div>
        <div className="dib w-40 tr fr">
          <Link to={`./map`} className="">
            <Button className="white bg-red w5 h3">
              <FormattedMessage {...messages.contribute} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

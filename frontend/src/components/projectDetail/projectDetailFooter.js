import React from 'react';
import { Link } from '@reach/router';
import { Button } from '../button';

import { ShareIcon, FlagIcon } from '../svgIcons';
import { FormattedMessage } from 'react-intl';
import messages from './messages';

export const ProjectDetailFooter = props => {
  return (
    <div className={`${props.className} bt bb b--grey-light pl4`}>
      {/* TODO ADD ANCHORS */}
      <div className="dib-l dn">
        Overview &#183; How to Contribute &#183; Contributions &#183; Related Projects
      </div>
      <div className="dib mh1 pa2 pb3">
        <ShareIcon className="pt3 pr2" />
        <FormattedMessage {...messages.share} />
      </div>
      <div className="dib mh1 pa2 pb3">
        <FlagIcon className="pt3 pr2" />
        <FormattedMessage {...messages.addToFavorites} />
      </div>
      <div className="dib fr">
        <Link to={`./map`} className="">
          <Button className="white bg-red w5 h3">
            <FormattedMessage {...messages.contribute} />
          </Button>
        </Link>
      </div>
    </div>
  );
};

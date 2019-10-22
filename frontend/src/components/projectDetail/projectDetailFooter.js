import React from 'react';
import { Link } from '@reach/router';
import { Button } from '../button';

import { ShareIcon } from '../svgIcons';
import { FormattedMessage } from 'react-intl';
import messages from './messages';
import { AddToFavorites } from './favorites';

export const ProjectDetailFooter = props => {
  return (
    <div className={`${props.className || ''} cf bt b--grey-light pl4 w-100 z-4 bg-white`}>
      {/* TODO ADD ANCHORS */}
      <div className="dib-l fl w-60 dn pt3 mt2">
        <a className="link blue-dark" href="#top">
          <FormattedMessage {...messages.overview} />
        </a>
        <span className="ph2">&#183;</span>
        <a className="link blue-dark" href="#howToContribute">
          <FormattedMessage {...messages.howToContribute} />
        </a>
        <span className="ph2">&#183;</span>
        <a className="link blue-dark" href="#questionsAndComments">
          <FormattedMessage {...messages.questionsAndComments} />
        </a>
        <span className="ph2">&#183;</span>
        <a className="link blue-dark" href="#contributions">
          <FormattedMessage {...messages.contributions} />
        </a>
        {/* <span className="ph2">&#183;</span>
        <a  className="link" href="#relatedProjects"><FormattedMessage {...messages.relatedProjects} /></a> */}
      </div>
      <div className="w-40-ns w-100 fr">
        <div className="w-20 fl tc dib pt2 pb3 o-10">
          <ShareIcon className="pt3 pr2 v-btm" />
          <FormattedMessage {...messages.share} />
        </div>
        <div className="w-40 fl tc dib pt2 pb3">
          <AddToFavorites projectId={props.projectId} />
        </div>
        <div className="dib w-40 tr fr">
          <Link to={`./map`} className="">
            <Button className="white bg-red h3 w-100">
              <FormattedMessage {...messages.contribute} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

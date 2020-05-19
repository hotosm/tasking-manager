import React from 'react';
import { Link } from '@reach/router';
import { useSelector } from 'react-redux';
import { Button } from '../button';

import { ShareButton } from './shareButton';
import { FormattedMessage } from 'react-intl';
import messages from './messages';
import { AddToFavorites } from './favorites';

export const ProjectDetailFooter = (props) => {
  const userIsloggedIn = useSelector((state) => state.auth.get('token'));
  return (
    <div
      className={`${
        props.className || ''
      } cf bt b--grey-light pl4 w-100 z-4 bg-white fixed bottom-0 left-0`}
    >
      {/* TODO ADD ANCHORS */}
      <div className="dib-ns fl w-60-ns dn pt3 mt2">
        <a className="link blue-dark" href="#top">
          <FormattedMessage {...messages.overview} />
        </a>
        <span className="ph2">&#183;</span>
        <a className="link blue-dark" href="#description">
          <FormattedMessage {...messages.description} />
        </a>
        <span className="ph2">&#183;</span>
        <a className="link blue-dark" href="#coordination">
          <FormattedMessage {...messages.coordination} />
        </a>
        <span className="ph2">&#183;</span>
        <a className="link blue-dark" href="#teams">
          <FormattedMessage {...messages.teamsAndPermissions} />
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
        <div className="w-20 fl tc dib pt2 pb3">
          <ShareButton projectId={props.projectId} />
        </div>
        {userIsloggedIn && (
          <div className="w-40 fl tc dib pt2 pb3">
            <AddToFavorites projectId={props.projectId} />
          </div>
        )}
        <div className="dib w-40 tr fr">
          <Link to={`./tasks`} className="">
            <Button className="white bg-red h3 w-100">
              <FormattedMessage {...messages.contribute} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

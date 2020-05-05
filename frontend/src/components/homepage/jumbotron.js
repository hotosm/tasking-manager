import React, { useLayoutEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from '@reach/router';
import Popup from 'reactjs-popup';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Button } from '../button';
import { SignUp } from '../header/signUp';
import bannerHR from '../../assets/img/banner_2500.jpg';
import bannerLR from '../../assets/img/banner_824.jpg';
import { HOMEPAGE_VIDEO_URL } from '../../config';

function JumbotronButtons() {
  const token = useSelector((state) => state.auth.get('token'));
  return (
    <p>
      <Link to={'explore'}>
        <Button className="bg-red white mr3">
          <FormattedMessage {...messages.startButton} />
        </Button>
      </Link>
      {!token && (
        <Popup
          trigger={
            <Button className="bg-white blue-dark mt3 mt0-ns">
              <FormattedMessage {...messages.joinButton} />
            </Button>
          }
          modal
          closeOnDocumentClick
        >
          {(close) => <SignUp closeModal={close} />}
        </Popup>
      )}
    </p>
  );
}

function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
}

export function Jumbotron() {
  /* eslint-disable-next-line */
  const [width, height] = useWindowSize();

  return (
    <div id="jumbotron" className="white relative" style={{ height: '32rem' }}>
      <div className="truncate relative h-100">
        {HOMEPAGE_VIDEO_URL && width > 824 ? (
          <video
            className={`${width > 824 ? 'w-100' : 'h-100'} object-fit-cover`}
            style={{ zIndex: 0 }}
            muted
            loop
            autoPlay
          >
            <source src={HOMEPAGE_VIDEO_URL} type="video/mp4"></source>
          </video>
        ) : (
          <img
            className="w-100 h-100 object-fit-cover"
            srcSet={`${bannerLR} 824w, ${bannerHR} 2500w`}
            sizes="(max-width: 825px) 824w, 2500w"
            alt="banner background"
          />
        )}
      </div>
      <div className="absolute top-0 pl6-l pl4 pv5-ns pv3 z-1">
        <h3 className="mb4 mw7-ns mw-20rem f-4rem-l f1 ttu barlow-condensed fw8">
          <FormattedMessage {...messages.jumbotronTitle} />
        </h3>
        <div className="pr2 f4 f3-ns mw7-l mw6-m mw5 mb4">
          <FormattedMessage {...messages.jumbotronHeadLine} />
        </div>
        <JumbotronButtons />
      </div>
    </div>
  );
}

export function SecondaryJumbotron() {
  return (
    <div className="cover bg-sec-jumbotron white">
      <div className="pl6-l pl4 pv5-ns pv2">
        <h3 className="mb4 mw6 f2 ttu barlow-condensed fw8">
          <FormattedMessage {...messages.secJumbotronTitle} />
        </h3>
        <p className="pr2 f5 f4-ns mw6">
          <FormattedMessage
            {...messages.secJumbotronHeadLine}
            values={{
              link: (
                <Link to={'learn'} className="link white">
                  <FormattedMessage {...messages.howItWorks} />
                </Link>
              ),
            }}
          />
        </p>
        <p className="pr2 f5 f4-ns mw6 mb4">
          <FormattedMessage {...messages.secJumbotronHeadLine2} />
        </p>
        <JumbotronButtons />
      </div>
    </div>
  );
}

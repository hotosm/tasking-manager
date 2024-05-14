import React from 'react';
import { TextRow } from 'react-placeholder/lib/placeholders';
import { HashtagIcon } from '../svgIcons';

export const campaignCardPlaceholderTemplate = () => (_n, i) =>
  (
    <div className="w-50-ns w-100 fl pr3" key={i}>
      <div className="cf bg-white blue-dark br1 mv2 pv4 ph3 ba br1 b--grey-light shadow-hover">
        <div className="dib v-mid pr3">
          <div className="z-1 fl br-100 tc h2 w2 bg-blue-light white">
            <span className="relative w-50 dib">
              <HashtagIcon style={{ paddingTop: '0.4175rem' }} />
            </span>
          </div>
        </div>
        <TextRow
          className="show-loading-animation f3 mv0 dib v-mid"
          color="#CCC"
          style={{ width: '55%', marginTop: 0 }}
        />
      </div>
    </div>
  );

export const nCardPlaceholders = (N) => {
  return [...Array(N).keys()].map(campaignCardPlaceholderTemplate());
};

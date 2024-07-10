import React from 'react';
import { OHSOME_STATS_BASE_URL } from '../../config';

const height = '1.65rem';

const ProgressBar = ({ className, firstBarValue, secondBarValue = 0, children, data }) => {
  return (
    <div className={`cf db ${className || ''}`}>
      <div className="relative">
        <div
          className="absolute ph1"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height,
            zIndex: 111,
            width: '100%',
            fontWeight: '700',
          }}
        >
          <a
            target={'_blank'}
            rel="noreferrer"
            style={{ textDecoration: 'none', color: 'white' }}
            href={OHSOME_STATS_BASE_URL + '/dashboard#hashtags=' + data.primary}
          >
            {'#' + data.primary}{' '}
          </a>
          <p style={{ color: 'white', margin: 0 }}>{data.secondary}</p>
        </div>
        <div
          className={`absolute bg-blue-grey br-pill hide-child`}
          style={{
            width: `${firstBarValue > 100 ? 100 : firstBarValue}%`,
            height,
            borderRadius: '6px',
          }}
          role="progressbar"
          aria-valuenow={firstBarValue}
          aria-valuemin="0"
          aria-valuemax="100"
        />
        <div
          className={`absolute bg-blue-dark br-pill hide-child`}
          style={{
            width: `${secondBarValue > 100 ? 100 : secondBarValue}%`,
            height,
            borderRadius: '6px',
          }}
          role="progressbar"
          aria-valuenow={secondBarValue}
          aria-valuemin="0"
          aria-valuemax="100"
        />
        <div
          className={`bg-tan br-pill overflow-y-hidden`}
          style={{
            height,
            borderRadius: '6px',
            background: '#bdbdbd',
          }}
        />
      </div>
    </div>
  );
};

export default function PartnersProgresBar({ data, totalData, percentValidated, label, value }) {
  return (
    <ProgressBar
      className={'bg-white'}
      firstBarValue={0}
      secondBarValue={percentValidated}
      data={data}
    />
  );
}

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { TaskStatus } from './taskList';
import { LockIcon, ChevronDownIcon, ChevronUpIcon } from '../svgIcons';

// Colour stops that exactly match the MapLibre interpolate expression in map.js
const RAMP = [
  { value: 0, color: '#f9fafb', label: '0' },
  { value: 1, color: '#fde68a', label: '1' },
  { value: 3, color: '#f97316', label: '3' },
  { value: 6, color: '#b91c1c', label: '6+' },
];

function ChoroplethGradientLegend() {
  const gradient = RAMP.map((s) => s.color).join(', ');
  return (
    <div className="mt2">
      {/* Continuous gradient bar — mirrors the interpolate ramp on the map */}
      <div
        style={{
          height: 14,
          borderRadius: 3,
          background: `linear-gradient(to right, ${gradient})`,
          border: '1px solid #d1d5db',
        }}
      />
      {/* Tick labels at each colour stop */}
      <div className="flex justify-between mt1">
        {RAMP.map(({ value, label }) => (
          <span key={value} className="f7 blue-dark" style={{ lineHeight: 1 }}>
            {label}
          </span>
        ))}
      </div>
      {/* <p className="f7 blue-dark mv1 i">
        <FormattedMessage {...messages.invalidationChoroplethRampHint} />
      </p> */}
    </div>
  );
}

export function TasksMapLegend({ showChoropleth = false }) {
  const lineClasses = 'mv2 blue-dark f5';
  const [expand, setExpand] = useState(true);

  return (
    <div className="cf left-1 bottom-2 absolute bg-white pa2 br1" style={{ minWidth: 180 }}>
      {/* ── Header row: title + collapse chevron ── */}
      <div className="flex items-center justify-between">
        <h4
          className="fw6 pointer f4 ttu barlow-condensed mt0 mb0 flex-auto"
          onClick={() => setExpand(!expand)}
        >
          {showChoropleth ? (
            <FormattedMessage {...messages.invalidationChoropleth} />
          ) : (
            <FormattedMessage {...messages.legend} />
          )}
          {expand ? <ChevronDownIcon className="pl2" /> : <ChevronUpIcon className="pl2" />}
        </h4>
      </div>

      {/* ── Legend items ── */}
      {expand && (
        <div className="mt1">
          {showChoropleth ? (
            <ChoroplethGradientLegend />
          ) : (
            <>
              <p className={lineClasses}>
                <TaskStatus status="READY" />
              </p>
              <p className={lineClasses}>
                <TaskStatus status="MAPPED" />
              </p>
              <p className={lineClasses}>
                <TaskStatus status="INVALIDATED" />
              </p>
              <p className={lineClasses}>
                <TaskStatus status="VALIDATED" />
              </p>
              <p className={lineClasses}>
                <TaskStatus status="BADIMAGERY" />
              </p>
              <p className={lineClasses}>
                <TaskStatus status="PRIORITY_AREAS" />
              </p>
              <p className={lineClasses}>
                <LockIcon style={{ paddingTop: '1px' }} className="v-mid h1 w1" />
                <span className="pl2 v-mid">
                  <FormattedMessage {...messages[`taskStatus_LOCKED`]} />
                </span>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

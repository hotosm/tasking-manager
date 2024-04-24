import React, { useMemo } from 'react';
import { Chart } from 'react-charts';
import useDemoConfig from './useDemoConfig.js';
import { FormattedMessage } from 'react-intl';
import messages from './messages';
export default function Bar({ data }) {
  const { randomizeData } = useDemoConfig({
    series: 3,
    dataType: 'ordinal',
  });
  const primaryAxis = useMemo(
    () => ({
      title: 'hola',
      position: 'left',
      getValue: (datum) => datum.primary,
    }),
    [],
  );

  const secondaryAxes = useMemo(
    () => [
      {
        title: 'hola',
        position: 'bottom',
        getValue: (datum) => datum.secondary,
      },
    ],
    [],
  );
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '12px',
          height: '400px',
        }}
      >
        <div
          style={{
            flex: '0 0 auto',
            padding: '10px',
          }}
        >
            <h4 className="f3 fw6 ttu barlow-condensed blue-dark mt0 mb1 ">
            <FormattedMessage {...messages[data[0].label]} />
          </h4>
        </div>
        <div
          style={{
            flex: 2,
            margin: '10px',
            overflow: 'hidden',
          }}
        >
          <div style={{ width: '100%', height: '100%' }}>
            <Chart
              options={{
                data: data,
                primaryAxis,
                secondaryAxes,
                defaultColors: [ '#D73F3F' ],
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

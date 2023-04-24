import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { FormattedMessage, useIntl } from 'react-intl';

import messages from './messages';
import typesMessages from '../messages';
import { CHART_COLOURS } from '../../config';
import { formatChartData, formatTooltip } from '../../utils/formatChartJSData';

ChartJS.register(ArcElement, Tooltip, Legend);

const EditsByNumbers = ({ osmStats }) => {
  const intl = useIntl();
  let reference = [
    {
      label: intl.formatMessage(typesMessages.buildings),
      field: 'buildings',
      backgroundColor: CHART_COLOURS.red,
      borderColor: CHART_COLOURS.white,
    },
    {
      label: intl.formatMessage(typesMessages.roads),
      field: 'roads',
      backgroundColor: CHART_COLOURS.green,
      borderColor: CHART_COLOURS.white,
    },
    {
      label: intl.formatMessage(typesMessages.pointsOfInterest),
      field: 'total_poi_count_add',
      backgroundColor: CHART_COLOURS.orange,
      borderColor: CHART_COLOURS.white,
    },
    {
      label: intl.formatMessage(typesMessages.waterways),
      field: 'total_waterway_count_add',
      backgroundColor: CHART_COLOURS.blue,
      borderColor: CHART_COLOURS.white,
    },
  ];

  const data = formatChartData(reference, osmStats);

  return (
    <div className="pb4 ph3 pt2 bg-white blue-dark shadow-6 h-100">
      <div className="ml2 mt1">
        <h3 className="f125 mv3 fw6">
          <FormattedMessage {...messages.editsTitle} />
        </h3>
        {Object.keys(osmStats).length && data.datasets[0].data.some((x) => !isNaN(x)) ? (
          <Doughnut
            data={data}
            options={{
              aspectRatio: 2,
              plugins: {
                legend: { position: 'right', labels: { boxWidth: 12 } },
                tooltip: { callbacks: { label: (context) => formatTooltip(context) } },
              },
            }}
          />
        ) : (
          <div className="h-100 tc pv5 blue-grey">
            <FormattedMessage {...messages.noEditsData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditsByNumbers;

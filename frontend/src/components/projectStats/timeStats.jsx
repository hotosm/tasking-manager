import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { shortEnglishHumanizer } from '../userDetail/elementsMapped';
import { StatsCardContent } from '../statsCard';
import { MappedIcon, ValidatedIcon } from '../svgIcons';
import { useProjectStatisticsQuery } from '../../api/stats';
import { Alert } from '../alert';

const StatsRow = ({ stats }) => {
  const fields = [
    'averageMappingTime',
    'averageValidationTime',
    'timeToFinishMapping',
    'timeToFinishValidating',
  ];

  const options = {
    units: ['h', 'm', 's'],
    round: true,
    spacer: '',
  };

  return (
    <div className="cf center">
      {fields.map((t, n) => (
        <div key={n} className="ph2 w-25-l w-50-m w-100 fl mv1">
          <div className="cf pa3 bg-white shadow-4">
            <div className="w-30 fl red">
              {t.indexOf('Mapping') !== -1 ? (
                <MappedIcon className="v-mid w-50-ns w-25" />
              ) : (
                <ValidatedIcon className="v-mid w-50-ns w-25" />
              )}
            </div>
            <div className="w-70 fl">
              <StatsCardContent
                className="tc"
                value={shortEnglishHumanizer(stats[t] * 1000, options).replace(/,/g, '')}
                label={<FormattedMessage {...messages[t]} />}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const StatsCards = ({ stats }) => {
  return (
    <div className="ph2 ph4-ns pb4">
      <h3 className="f3 ttu barlow-condensed">
        <FormattedMessage {...messages.projectStatsTitle} />
      </h3>
      <StatsRow stats={stats} />
    </div>
  );
};

export const TimeStats = ({ id }) => {
  const { data: stats, status } = useProjectStatisticsQuery(id);

  if (status === 'loading') {
    return <ReactPlaceholder showLoadingAnimation={true} rows={26} ready={false} className="pr3" />;
  }
  if (status === 'error') {
    return (
      <Alert type="error">
        <FormattedMessage {...messages.projectStatsError} />
      </Alert>
    );
  }

  return <StatsCards stats={stats} />;
};

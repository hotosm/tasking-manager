import { setDayOfYear, format } from 'date-fns';
import { FormattedMessage } from 'react-intl';

import statusMessages from '../projectEdit/messages';
import messages from './messages';
import { BarChartItem } from '../userDetail/barListChart';
import { compareByPropertyDescending } from '../../utils/sorting';

export const OrganisationProjectStats = ({ projects, orgName }) => {
  const totalProjects = projects ? projects.draft + projects.published + projects.archived : 0;
  const firstDayOfYear = format(setDayOfYear(new Date(), 1), 'yyyy-MM-dd');
  const chartItems = [
    {
      name: <FormattedMessage {...statusMessages.statusPUBLISHED} />,
      value: projects ? projects.published : 0,
      link: `/manage/projects/?managedByMe=1&status=PUBLISHED&organisation=${orgName}`,
    },
    {
      name: <FormattedMessage {...statusMessages.statusDRAFT} />,
      value: projects ? projects.draft : 0,
      link: `/manage/projects/?status=DRAFT&organisation=${orgName}`,
    },
    {
      name: <FormattedMessage {...messages.stale} />,
      value: projects ? projects.stale : 0,
      link: `/manage/projects/?stale=1&organisation=${orgName}`,
    },
    {
      name: <FormattedMessage {...messages.createdThisYear} />,
      value: projects ? projects.recent : 0,
      link: `/manage/projects/?createdFrom=${firstDayOfYear}&status=ARCHIVED,PUBLISHED&organisation=${orgName}`,
    },
  ];
  const stats = chartItems.sort((a, b) => compareByPropertyDescending(a, b, 'value'));

  return (
    <div className="pv2 ph3 bg-white blue-dark shadow-4">
      {projects && (
        <>
          <h3 className="f4 mv0 fw6 pt3">
            <FormattedMessage {...messages.projectsCreated} values={{ number: totalProjects }} />
          </h3>
          <ol className="pa0 mt1 mb2">
            {stats.map((item, n) => (
              <BarChartItem
                key={n}
                name={item.name}
                link={item.link}
                percentValue={item.value / stats[0].value}
                number={
                  <FormattedMessage
                    {...messages.numberOfProjects}
                    values={{ number: item.value }}
                  />
                }
              />
            ))}
          </ol>
        </>
      )}
    </div>
  );
};

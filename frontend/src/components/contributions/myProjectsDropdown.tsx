import { useSelector } from 'react-redux';
import Select from 'react-select';
import { FormattedMessage } from 'react-intl';
import { useFetch } from '../../hooks/UseFetch';
import messages from './messages';
import { RootStore } from '../../store';

export default function MyProjectsDropdown({ className, setQuery, allQueryParams }: {
  className?: string;
  setQuery: any;
  allQueryParams: any;
}) {
  const username = useSelector((state: RootStore) => state.auth.userDetails?.username);
  const [, , projects] = useFetch(`projects/queries/${username}/touched/`);

  const onSortSelect = (projectId: string) => {
    setQuery(
      {
        ...allQueryParams,
        page: undefined,
        projectId,
      },
      'pushIn',
    );
  };

  // @ts-expect-error TS Migrations
  const options = projects.mappedProjects?.map(({ projectId }: {
    projectId: string;
  }) => ({
    label: projectId,
    value: projectId,
  }));

  return (
    <div className={`w5 mr1 ${className}`}>
      <Select
        classNamePrefix="react-select"
        getOptionLabel={({ label }) => `#${label}`}
        noOptionsMessage={() => <FormattedMessage {...messages.noMatchingProjectId} />}
        onChange={(e) => onSortSelect(e.value)}
        options={options}
        placeholder={<FormattedMessage {...messages.searchProject} />}
        // @ts-expect-error TS Migrations
        value={options?.find(({ value }) => value === allQueryParams.projectId) || null}
      />
    </div>
  );
}

import { useSelector } from 'react-redux';
import Select from 'react-select';
import { FormattedMessage } from 'react-intl';
import { useFetch } from '../../hooks/UseFetch';
import messages from './messages';

export default function MyProjectsDropdown({ className, setQuery, allQueryParams }) {
  const username = useSelector((state) => state.auth.userDetails.username);
  const [, , projects] = useFetch(`projects/queries/${username}/touched/`);

  const onSortSelect = (projectId) => {
    setQuery(
      {
        ...allQueryParams,
        page: undefined,
        projectId,
      },
      'pushIn',
    );
  };

  const options = projects.mappedProjects?.map(({ projectId }) => ({
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
        value={options?.find(({ value }) => value === allQueryParams.projectId) || null}
      />
    </div>
  );
}

import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

import { API_URL } from '../../config';
import { stringify } from '../../hooks/UseProjectsQueryAPI';
import { DownloadIcon } from '../svgIcons';
import messages from './messages';

export default function DownloadAsCSV({ allQueryParams }) {
  const allQueryParamsCopy = { ...allQueryParams };
  allQueryParamsCopy.downloadAsCSV = true;
  allQueryParamsCopy.omitMapResults = null;
  const downloadCSVLink = `${API_URL}projects/?${stringify(allQueryParamsCopy)}`;

  return (
    <a
      href={downloadCSVLink}
      className="ml3 lh-title f6 blue-dark inline-flex items-baseline"
      download
    >
      <DownloadIcon className="mr2 self-center" />
      <span className="underline">
        <FormattedMessage {...messages.downloadAsCSV} />
      </span>
    </a>
  );
}

DownloadAsCSV.propTypes = {
  allQueryParams: PropTypes.string.isRequired,
};

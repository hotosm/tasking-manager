import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { downloadAsCSV } from '../../api/projects';
import { DownloadIcon, LoadingIcon } from '../svgIcons';
import messages from './messages';

export default function DownloadAsCSV({ allQueryParams }) {
  const [isLoading, setIsLoading] = useState(false);
  const token = useSelector((state) => state.auth.token);
  const action = useSelector((state) => state.preferences['action']);

  const allQueryParamsCopy = { ...allQueryParams };
  allQueryParamsCopy.downloadAsCSV = true;
  allQueryParamsCopy.omitMapResults = undefined;

  const handleDownload = async () => {
    setIsLoading(true);

    try {
      const response = await downloadAsCSV(allQueryParamsCopy, action, token);

      // Get the filename from the Content-Disposition header, if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'projects_result.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create a Blob with the CSV content
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });

      // Create and click a temporary download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(<FormattedMessage {...messages.downloadAsCSVError} />);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`ml3 lh-title f6 ${
        isLoading ? 'gray' : 'blue-dark'
      } inline-flex items-baseline b--none bg-white underline pointer`}
      onClick={handleDownload}
      disabled={isLoading}
    >
      {isLoading ? (
        <LoadingIcon
          className="mr2 self-center h1 w1 gray"
          style={{ animation: 'spin 1s linear infinite' }}
        />
      ) : (
        <DownloadIcon className="mr2 self-center" />
      )}
      <FormattedMessage {...messages.downloadAsCSV} />
    </button>
  );
}

DownloadAsCSV.propTypes = {
  allQueryParams: PropTypes.string.isRequired,
};

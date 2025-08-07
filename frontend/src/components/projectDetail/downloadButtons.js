import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';

import messages from './messages';
import { API_URL } from '../../config';
import { CustomButton } from '../button';
import { NineCellsGridIcon, MappedIcon } from '../svgIcons';

export const DownloadAOIButton = ({ projectId, className }: Object) => (
  <a
    href={`${API_URL}projects/${projectId}/queries/aoi/?as_file=true`}
    download={`project-${projectId}-aoi.geojson`}
  >
    <CustomButton className={className} icon={<MappedIcon className="h1 v-mid" />}>
      <FormattedMessage {...messages.downloadProjectAOI} />
    </CustomButton>
  </a>
);

export const DownloadTaskGridButton = ({ projectId, className }: Object) => {
  const token = useSelector((state) => state.auth.token);

  const handleDownload = async () => {
    try {
      const headers: HeadersInit = {};

      // Token is optional for public projects but required for private/draft
      if (token) {
        headers['Authorization'] = `Token ${token}`;
      }
      const response = await fetch(`${API_URL}projects/${projectId}/tasks/?as_file=true`, {
        headers,
      });
      if (!response.ok) throw new Error('Failed to download');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${projectId}-tasks.geojson`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <CustomButton
      className={className}
      onClick={handleDownload}
      icon={<NineCellsGridIcon className="h1 v-mid" />}
    >
      <FormattedMessage {...messages.downloadTaskGrid} />
    </CustomButton>
  );
};

import React, { useState } from 'react';
import { RoadIcon, HomeIcon, WavesIcon, TaskIcon, AsteriskIcon } from '../svgIcons';
import FileFormatCard from './fileFormatCard';
import Popup from 'reactjs-popup';
import { EXPORT_TOOL_S3_URL } from '../../config';

export const TITLED_ICONS = [
  { Icon: RoadIcon, title: 'roads', value: 'ROADS' },
  { Icon: HomeIcon, title: 'buildings', value: 'BUILDINGS' },
  { Icon: WavesIcon, title: 'waterways', value: 'WATERWAYS' },
  { Icon: TaskIcon, title: 'landUse', value: 'LAND_USE' },
  { Icon: AsteriskIcon, title: 'other', value: 'OTHER' },
];

const fileFormats = [{ format: 'SHP' }, { format: 'GEOJSON' }, { format: 'KML' }];

/**
 * Renders a list of download options for OSM data based on the project mapping types.
 *
 * @param {Array<string>} projectMappingTypes - The mapping types of the project.
 * @return {JSX.Element} - The JSX element containing the download options.
 */

export const DownloadOsmData = ({ projectMappingTypes, project }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [isDownloadingState, setIsDownloadingState] = useState(null);

  /**
   * Downloads an S3 file from the given URL and saves it as a file.
   *
   * @param {string} title - The title of the file.
   * @param {string} fileFormat - The format of the file.
   * @return {Promise<void>} Promise that resolves when the download is complete.
   */
  const downloadS3File = async (title, fileFormat) => {
    // Create the base URL for the S3 file
    const baseUrl = `${EXPORT_TOOL_S3_URL}/TM/${project.projectId}/hotosm_project_${
      project.projectId
    }_${title}_${fileFormat?.toLowerCase()}.zip`;

    // Set the state to indicate that the file download is in progress
    setIsDownloadingState({ title: title, fileFormat: fileFormat, isDownloading: true });

    try {
      // Fetch the file from the S3 URL
      const response = await fetch(baseUrl);

      // Check if the request was successful
      if (response.ok) {
        // Set the state to indicate that the file download is complete
        setIsDownloadingState({ title: title, fileFormat: fileFormat, isDownloading: false });

        // Get the file data as a blob
        const blob = await response.blob();

        // Create a download link for the file
        const href = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.setAttribute(
          'download',
          `hotosm_project_${project.projectId}_${title}_${fileFormat?.toLowerCase()}.zip`,
        );

        // Add the link to the document body, click it, and then remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Show a popup and throw an error if the request was not successful
        setShowPopup(true);
        throw new Error(`Request failed with status: ${response.status}`);
      }
    } catch (error) {
      // Show a popup and log the error if an error occurs during the download
      setShowPopup(true);
      setIsDownloadingState({ title: title, fileFormat: fileFormat, isDownloading: false });
      console.error('Error:', error.message);
    }
  };
  const filteredMappingTypes = TITLED_ICONS?.filter((icon) =>
    projectMappingTypes?.includes(icon.value),
  );

  return (
    <div className="mb5 w-100 pa5 ph flex flex-wrap">
      <Popup modal open={showPopup} closeOnDocumentClick nested onClose={() => setShowPopup(false)}>
        {(close) => (
          <div class="blue-dark bg-white pv2 pv4-ns ph2 ph4-ns">
            <h3 class="barlow-condensed f3 fw6 mv0">Data Not Available.</h3>
            <div class="w-100 pt3 flex justify-end">
              <button
                aria-pressed="false"
                focusindex="0"
                class="mr2 bg-red white br1 f5 bn pointer"
                style={{ padding: '0.75rem 1.5rem' }}
                onClick={() => {
                  setShowPopup(false);
                  close();
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Popup>
      {filteredMappingTypes.map((type) => (
        <div
          className="osm-card bg-white pa3 mr4 mt4 w-auto-m flex flex-wrap items-center  "
          style={{
            width: '560px',
            gap: '16px',
          }}
          key={type.title}
        >
          <div
            style={{
              justifyContent: 'center',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <type.Icon
              title={type.title}
              color="#D73F3F"
              className="br1 h2 w2 pa1 ma1 ba b--white bw1 dib h-65 w-65"
              style={{ height: '56px' }}
            />
          </div>

          <div
            className="file-list flex barlow-condensed f3"
            style={{ display: 'flex', gap: '12px' }}
          >
            <p className="fw5 ttc">{type.title}</p>
            <FileFormatCard
              title={type.title}
              fileFormats={fileFormats}
              downloadS3Data={downloadS3File}
              isDownloadingState={isDownloadingState}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

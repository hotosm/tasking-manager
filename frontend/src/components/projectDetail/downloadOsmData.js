import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { RoadIcon, HomeIcon, WavesIcon, TaskIcon, DownloadIcon } from '../svgIcons';
import FileFormatCard from './fileFormatCard';
import Popup from 'reactjs-popup';
import { EXPORT_TOOL_S3_URL } from '../../config';
import messages from './messages';
import { FormattedMessage } from 'react-intl';
import formatBytes from '../../utils/formatBytes';
import { format } from 'date-fns';

export const TITLED_ICONS = [
  {
    Icon: RoadIcon,
    title: 'Roads',
    value: 'ROADS',
    featuretype: ['lines'],
    formats: ['geojson', 'shp', 'kml'],
  },
  {
    Icon: HomeIcon,
    title: 'Buildings',
    value: 'BUILDINGS',
    featuretype: ['polygons'],
    formats: ['geojson', 'shp', 'kml'],
  },
  {
    Icon: WavesIcon,
    title: 'Waterways',
    value: 'WATERWAYS',
    featuretype: ['lines', 'polygons'],
    formats: ['geojson', 'shp', 'kml'],
  },
  {
    Icon: TaskIcon,
    title: 'Landuse',
    value: 'LAND_USE',
    featuretype: ['points', 'polygons'],
    formats: ['geojson', 'shp', 'kml'],
  },
];

/**
 * Renders a list of download options for OSM data based on the project mapping types.
 *
 * @param {Array<string>} projectMappingTypes - The mapping types of the project.
 * @return {JSX.Element} - The JSX element containing the download options.
 */

export const DownloadOsmData = ({ projectMappingTypes, project }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [isDownloadingState, setIsDownloadingState] = useState(null);
  const [selectedCategoryFormat, setSelectedCategoryFormat] = useState(null);
  const [mergedJSONData, setMergedJSONData] = useState(null);

  const datasetConfig = {
    dataset_prefix: `hotosm_project_${project.projectId}`,
    dataset_folder: 'TM',
    dataset_title: `Tasking Manger Project ${project.projectId}`,
  };
  /**
   * Downloads an S3 file from the given URL and saves it as a file.
   *
   * @param {string} title - The title of the file.
   * @param {string} fileFormat - The format of the file.
   * @param {string} feature_type - The feature type of the  ffile.
   * @return {Promise<void>} Promise that resolves when the download is complete.
   */
  const fetchMetaJSON = async () => {
    const metaJSONResponse = await fetch(
      `https://api-prod.raw-data.hotosm.org/v1/s3/get/${datasetConfig.dataset_folder}/${datasetConfig.dataset_prefix}/meta.json`,
    );
    // const metaJSON = null;
    // const metaJSON = null;
    const metaJSON = await metaJSONResponse.json();
    // console.log(metaJSON, 'metaJSON');
    const filteredMappingTypes = TITLED_ICONS?.filter((icon) =>
      projectMappingTypes?.includes(icon.value),
    );
    const mergedData = filteredMappingTypes.map((category) => {
      const dataset = metaJSON?.datasets?.find((dataset) => category.title in dataset) || {};
      const addedMetaJSON = dataset[category.title] || { resources: [] };

      const resources = addedMetaJSON.resources.reduce((mergedResources, resource) => {
        const formatIndex = category.formats.indexOf(resource.format);
        if (formatIndex !== -1) {
          const featureType = resource.name.includes('_polygons') ? 'polygons' : 'lines';
          if (category.featuretype.includes(featureType)) {
            if (!mergedResources[featureType]) {
              mergedResources[featureType] = {};
            }

            mergedResources[featureType][category.formats[formatIndex]] = {
              name: resource.name,
              url: resource.url,
              description: resource.description,
              size: resource.size,
              last_modifed: resource.last_modifed,
            };
          }
        }
        return mergedResources;
      }, {});

      return { ...category, resources };
    });
    setMergedJSONData(mergedData);
    console.log(mergedData);
  };

  const downloadS3File = async (title, fileFormat, feature_type) => {
    // Create the base URL for the S3 file
    const downloadUrl = `${EXPORT_TOOL_S3_URL}/${datasetConfig.dataset_folder}/${
      datasetConfig.dataset_prefix
    }/${title.toLowerCase()}/${feature_type}/${
      datasetConfig.dataset_prefix
    }_${title.toLowerCase()}_${feature_type}_${fileFormat.toLowerCase()}.zip`;

    // Set the state to indicate that the file download is in progress
    setIsDownloadingState({ title: title, fileFormat: fileFormat, isDownloading: true });

    try {
      // Fetch the file from the S3 URL
      const responsehead = await fetch(downloadUrl, { method: 'HEAD' });
      // console.log(responsehead, 'responsehead');
      // const lastMod = responsehead.headers.get('Last-Modified');
      // console.log(lastMod, 'lastMod');
      // console.log(
      //   responsehead.headers.get('Content-Length'),
      //   'responsehead.headers.get(Last-Modified)',
      // );
      window.location.href = downloadUrl;

      // Check if the request was successful
      if (responsehead.ok) {
        setIsDownloadingState({ title: title, fileFormat: fileFormat, isDownloading: false });
      } else {
        setIsDownloadingState({ title: title, fileFormat: fileFormat, isDownloading: false });
        // Show a popup and throw an error if the request was not successful
        setShowPopup(true);
        throw new Error(`Request failed with status: ${responsehead.status}`);
      }
    } catch (error) {
      // Show a popup and log the error if an error occurs during the download
      setShowPopup(true);
      setIsDownloadingState({ title: title, fileFormat: fileFormat, isDownloading: false });
      console.error('Error:', error.message);
    }
  };

  useEffect(() => {
    fetchMetaJSON();
  }, []);
  return (
    <div className="mb5 w-100 pb5 ph4 flex flex-wrap">
      <Popup modal open={showPopup} closeOnDocumentClick nested onClose={() => setShowPopup(false)}>
        {(close) => (
          <div className="blue-dark bg-white pv2 pv4-ns ph2 ph4-ns">
            <h3 className="barlow-condensed f3 fw6 mv0">
              <FormattedMessage {...messages.errorDownloadOsmData} />
            </h3>
            <p className="mt4">
              <FormattedMessage {...messages.errorDownloadOsmDataDescription} />
            </p>
            <div className="w-100 pt3 flex justify-end">
              <button
                aria-pressed="false"
                tabIndex={0}
                className="mr2 bg-red white br1 f5 bn pointer"
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
      {mergedJSONData?.map((type) => {
        const loadingState = isDownloadingState?.isDownloading;
        return (
          <div
            className="osm-card bg-white pa3 mr4 mt4 w-auto-m flex flex-wrap items-center  "
            style={{
              width: '870px',
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
            <div className="flex-column">
              <div
                className="file-list flex barlow-condensed f3 "
                style={{ display: 'flex', gap: '12px', width: 'fit-content' }}
              >
                <p className="fw5 ttc">{type.title}</p>
                <FileFormatCard
                  title={type.title}
                  fileFormats={type.formats}
                  downloadS3Data={downloadS3File}
                  isDownloadingState={isDownloadingState}
                  selectedCategoryFormat={selectedCategoryFormat}
                  setSelectedCategoryFormat={setSelectedCategoryFormat}
                />
              </div>
              <div
                className={`flex flex-row ${
                  selectedCategoryFormat && selectedCategoryFormat.title === type.title
                    ? 'fade-in active'
                    : 'fade-in'
                } `}
                style={{ gap: '20px' }}
              >
                {selectedCategoryFormat &&
                  selectedCategoryFormat.title === type.title &&
                  type?.featuretype?.map((typ) => (
                    <>
                      <span
                        key={`${typ}_${selectedCategoryFormat.title}`}
                        onClick={() =>
                          downloadS3File(
                            selectedCategoryFormat.title,
                            selectedCategoryFormat.format,
                            typ,
                          )
                        }
                        onKeyUp={() =>
                          downloadS3File(
                            selectedCategoryFormat.title,
                            selectedCategoryFormat.format,
                            typ,
                          )
                        }
                        style={
                          loadingState
                            ? { cursor: 'not-allowed', pointerEvents: 'none', gap: '10px' }
                            : { cursor: 'pointer', gap: '10px' }
                        }
                        className="flex flex-row items-center pointer link hover-red color-inherit categorycard"
                      >
                        <div className="flex flex-column">
                          <div className="flex flex-row items-center ">
                            <DownloadIcon style={{ height: '28px' }} color="#D73F3F" />
                            <p className="ttc ml2">
                              {typ} {selectedCategoryFormat.format}
                              <span className="ml1 gray f7">
                                (
                                {formatBytes(
                                  type.resources[typ][selectedCategoryFormat.format].size,
                                )}
                                )
                              </span>
                            </p>
                          </div>
                          <p className="gray f7" style={{ margin: 0 }}>
                            Last Generated:{' '}
                            {type.resources[typ][selectedCategoryFormat.format].last_modifed
                              ? format(
                                  new Date(
                                    type.resources[typ][selectedCategoryFormat.format].last_modifed,
                                  ),
                                  'MM/dd/yyyy HH:mm:ss z ',
                                  { timeZone: 'UTC' },
                                )
                              : '-'}
                          </p>
                        </div>
                      </span>
                    </>
                  ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

DownloadOsmData.propTypes = {
  projectMappingTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  project: PropTypes.objectOf(PropTypes.any).isRequired,
};

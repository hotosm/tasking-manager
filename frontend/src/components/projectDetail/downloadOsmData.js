import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { RoadIcon, HomeIcon, WavesIcon, TaskIcon, DownloadIcon } from '../svgIcons';
import FileFormatCard from './fileFormatCard';
import Popup from 'reactjs-popup';
import { EXPORT_TOOL_S3_URL } from '../../config';
import messages from './messages';
import { FormattedMessage } from 'react-intl';
import formatBytes from '../../utils/formatBytes';
import { AnimatedLoadingIcon } from '../button';

export const TITLED_ICONS = [
  {
    Icon: RoadIcon,
    title: 'roads',
    value: 'ROADS',
    featuretype: [{ type: 'lines' }],
    formats: ['GeoJSON', 'shp', 'kml'],
  },
  {
    Icon: HomeIcon,
    title: 'buildings',
    value: 'BUILDINGS',
    featuretype: [{ type: 'polygons' }],
    formats: ['GeoJSON', 'shp', 'kml'],
  },
  {
    Icon: WavesIcon,
    title: 'waterways',
    value: 'WATERWAYS',
    featuretype: [{ type: 'polygons' }, { type: 'lines' }],
    formats: ['GeoJSON', 'shp', 'kml'],
  },
  {
    Icon: TaskIcon,
    title: 'landuse',
    value: 'LAND_USE',
    featuretype: [{ type: 'points' }, { type: 'polygons' }],
    formats: ['GeoJSON', 'shp', 'kml'],
  },
];

/**
 * Renders a list of download options for OSM data based on the project mapping types.
 *
 * @param {Array<string>} projectMappingTypes - The mapping types of the project.
 * @return {JSX.Element} - The JSX element containing the download options.
 */

export const DownloadOsmData = ({ projectMappingTypes, project }) => {
  const [downloadDataList, setDownloadDataList] = useState(TITLED_ICONS);
  const [showPopup, setShowPopup] = useState(false);
  const [isDownloadingState, setIsDownloadingState] = useState(null);
  const [selectedCategoryFormat, setSelectedCategoryFormat] = useState(null);

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
  const downloadS3File = async (title, fileFormat, feature_type) => {
    // Create the base URL for the S3 file
    const downloadUrl = `${EXPORT_TOOL_S3_URL}/${datasetConfig.dataset_folder}/${
      datasetConfig.dataset_prefix
    }/${title}/${feature_type}/${
      datasetConfig.dataset_prefix
    }_${title}_${feature_type}_${fileFormat.toLowerCase()}.zip`;

    // Set the state to indicate that the file download is in progress
    setIsDownloadingState({ title: title, fileFormat: fileFormat, isDownloading: true });

    try {
      // Fetch the file from the S3 URL
      const responsehead = await fetch(downloadUrl, { method: 'HEAD' });
      var handle = window.open(downloadUrl);
      handle.blur();
      window.focus();
      if (window._paq) {
        // Check if Matomo tracking array (_paq) exists
        window._paq.push([
          'trackEvent',
          'OSMDownloads',
          'Click',
          `${project.projectId}_${title}_${fileFormat}`,
        ]);
      }
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
    const filteredMappingTypes = downloadDataList?.filter((icon) =>
      projectMappingTypes?.includes(icon.value),
    );
    setDownloadDataList(filteredMappingTypes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectMappingTypes]);

  useEffect(() => {
    if (!selectedCategoryFormat) return null;
    async function fetchData(url) {
      const response = await fetch(url, { method: 'HEAD' });
      const data = await response;
      return {
        size: data.headers.get('Content-Length'),
        lastmod: data.headers.get('Last-Modified'),
      };
    }

    const multipleHeadCallForFormat = async () => {
      setIsDownloadingState({
        title: selectedCategoryFormat.title,
        fileFormat: selectedCategoryFormat.format,
        isDownloading: true,
      });

      const filterMappingCategory = downloadDataList.find(
        (type) => type.title === selectedCategoryFormat.title,
      );
      async function fetchAndMap(urls) {
        const results = await Promise.all(
          urls.map(async (url) => {
            const data = await fetchData(url);
            return data;
          }),
        );

        return results;
      }
      const multipleUrl = filterMappingCategory.featuretype.map((type) => {
        return `${EXPORT_TOOL_S3_URL}/${datasetConfig.dataset_folder}/${
          datasetConfig.dataset_prefix
        }/${selectedCategoryFormat.title}/${type.type}/${datasetConfig.dataset_prefix}_${
          selectedCategoryFormat.title
        }_${type.type}_${selectedCategoryFormat.format.toLowerCase()}.zip`;
      });
      fetchAndMap(multipleUrl)
        .then((results) => {
          var mergedArray = filterMappingCategory.featuretype.map((feature, index) => ({
            ...feature,
            ...results[index],
          }));
          const mergedListData = downloadDataList.map((list) => {
            if (list.title === selectedCategoryFormat.title) {
              return {
                ...list,
                featuretype: mergedArray,
              };
            }
            return list;
          });
          setDownloadDataList(mergedListData);
          setIsDownloadingState({
            title: selectedCategoryFormat.title,
            fileFormat: selectedCategoryFormat.fileFormat,
            isDownloading: false,
          });
        })

        .catch((error) => {
          console.error(error);
          setIsDownloadingState({
            title: selectedCategoryFormat.title,
            fileFormat: selectedCategoryFormat.fileFormat,
            isDownloading: false,
          });
        })
        .finally(() => {
          setIsDownloadingState({
            title: selectedCategoryFormat.title,
            fileFormat: selectedCategoryFormat.fileFormat,
            isDownloading: false,
          });
        });
    };
    multipleHeadCallForFormat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryFormat]);

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
      {downloadDataList.map((type) => {
        const loadingState = isDownloadingState?.isDownloading;
        return (
          <div
            className="osm-card bg-white pa3 mr4 mt4 w-auto-m flex flex-wrap items-start justify-start  "
            style={{
              width: '800px',
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
                className="file-list flex barlow-condensed f3 items-center "
                style={{ display: 'flex', gap: '12px' }}
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
                    <span
                      key={`${typ.type}_${selectedCategoryFormat.title}`}
                      onClick={() =>
                        downloadS3File(
                          selectedCategoryFormat.title,
                          selectedCategoryFormat.format,
                          typ.type,
                        )
                      }
                      onKeyUp={() =>
                        downloadS3File(
                          selectedCategoryFormat.title,
                          selectedCategoryFormat.format,
                          typ.type,
                        )
                      }
                      style={
                        loadingState || !typ.lastmod
                          ? { cursor: 'not-allowed', pointerEvents: 'none', gap: '10px' }
                          : { cursor: 'pointer', gap: '10px' }
                      }
                      className="flex flex-row items-center pointer link hover-red color-inherit categorycard"
                    >
                      <div>
                        <p className="ttc">
                          <DownloadIcon color="#D73F3F" />
                          <span className="ml2">
                            {typ.type} {selectedCategoryFormat.format}
                          </span>
                          <span className="ml1 f7 black">
                            {loadingState ? (
                              <AnimatedLoadingIcon />
                            ) : (
                              `(${typ.size ? formatBytes(typ.size) : 'N/A'})`
                            )}
                          </span>
                        </p>
                        <span className="f7 mid-gray">
                          {`Last Generated:`}
                          <span className="black">
                            {' '}
                            {loadingState ? (
                              <AnimatedLoadingIcon />
                            ) : typ.lastmod ? (
                              typ.lastmod
                            ) : (
                              'Download unavailable'
                            )}
                          </span>
                        </span>
                      </div>
                    </span>
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

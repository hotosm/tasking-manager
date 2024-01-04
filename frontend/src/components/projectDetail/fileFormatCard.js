import React from 'react';
import { AnimatedLoadingIcon } from '../button';
import PropTypes from 'prop-types';

/**
 * Renders a list of file formats as clickable links.
 *
 * @param {Object[]} fileFormats - An array of file format objects.
 * @param {string} fileFormats[].format - The format of the file.
 * @return {JSX.Element} The rendered list of file formats.
 */

function FileFormatCard({
  title,
  fileFormats,
  isDownloadingState,
  setSelectedCategoryFormat,
  selectedCategoryFormat,
}) {
  return (
    <>
      {fileFormats.map((fileFormat, index) => {
        const loadingState =
          isDownloadingState?.isDownloading &&
          isDownloadingState?.title === title &&
          isDownloadingState?.fileFormat === fileFormat?.format;

        return (
          <React.Fragment key={fileFormat.title}>
            <span
              role="button"
              tabIndex={0}
              style={
                loadingState
                  ? { cursor: 'not-allowed', pointerEvents: 'none' }
                  : { cursor: 'pointer' }
              }
              onClick={() => setSelectedCategoryFormat({ title, format: fileFormat.format })}
              onKeyUp={() => setSelectedCategoryFormat({ title, format: fileFormat.format })}
              className={`link ${
                selectedCategoryFormat?.format === fileFormat?.format &&
                selectedCategoryFormat.title === title
                  ? 'red'
                  : ''
              } hover-red color-inherit`}
            >
              <p className="underline fw5" style={{ textUnderlineOffset: '5px' }}>
                {fileFormat.format}
                {loadingState ? <AnimatedLoadingIcon /> : null}
              </p>
            </span>
            {index !== fileFormats.length - 1 && <hr className="file-list-separator" />}
          </React.Fragment>
        );
      })}
    </>
  );
}

export default FileFormatCard;

FileFormatCard.propTypes = {
  title: PropTypes.string,
  fileFormats: PropTypes.arrayOf(PropTypes.object),
  downloadS3Data: PropTypes.func,
  isDownloadingState: PropTypes.bool,
};

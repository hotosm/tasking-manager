import React from 'react';

/**
 * Renders a list of file formats as clickable links.
 *
 * @param {Object[]} fileFormats - An array of file format objects.
 * @param {string} fileFormats[].url - The URL of the file.
 * @param {string} fileFormats[].format - The format of the file.
 * @return {JSX.Element} The rendered list of file formats.
 */

function FileFormatCard({ fileFormats }) {
  return (
    <>
      {fileFormats.map((fileFormat, index) => (
        <React.Fragment key={index}>
          <a href={fileFormat.url} download className="link hover-red color-inherit">
            <p className="underline fw5" style={{ textUnderlineOffset: '5px' }}>
              {fileFormat.format}
            </p>
          </a>
          {index !== fileFormats.length - 1 && <hr className="file-list-separator" />}
        </React.Fragment>
      ))}
    </>
  );
}

export default FileFormatCard;

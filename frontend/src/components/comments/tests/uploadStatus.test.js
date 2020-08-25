import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import DropzoneUploadStatus from '../uploadStatus';

describe('DropzoneUploadStatus when', () => {
  it('uploading and uploadError are false', () => {
    render(
      <ReduxIntlProviders>
        <DropzoneUploadStatus uploading={false} uploadError={false} />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('Uploading file...')).not.toBeInTheDocument();
    expect(screen.queryByText('The image upload failed.')).not.toBeInTheDocument();
  });
  it('uploading and uploadError are undefined', () => {
    render(
      <ReduxIntlProviders>
        <DropzoneUploadStatus uploading={undefined} uploadError={undefined} />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('Uploading file...')).not.toBeInTheDocument();
    expect(screen.queryByText('The image upload failed.')).not.toBeInTheDocument();
  });
  it('uploading and uploadError are null', () => {
    render(
      <ReduxIntlProviders>
        <DropzoneUploadStatus uploading={null} uploadError={null} />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('Uploading file...')).not.toBeInTheDocument();
    expect(screen.queryByText('The image upload failed.')).not.toBeInTheDocument();
  });
  it('uploading is true and uploadError is false', () => {
    render(
      <ReduxIntlProviders>
        <DropzoneUploadStatus uploading={true} uploadError={false} />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('Uploading file...')).toBeInTheDocument();
    expect(screen.queryByText('Uploading file...').className).toBe('blue-grey f6 pt3 db');
    expect(screen.queryByText('The image upload failed.')).not.toBeInTheDocument();
  });
  it('uploading is false and uploadError is true', () => {
    render(
      <ReduxIntlProviders>
        <DropzoneUploadStatus uploading={false} uploadError={true} />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText('Uploading file...')).not.toBeInTheDocument();
    expect(screen.queryByText('The image upload failed.')).toBeInTheDocument();
    expect(screen.queryByText('The image upload failed.').className).toBe('red f6 pt3 db');
  });
});

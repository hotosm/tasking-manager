import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { getErrorMsg } from '../fileUploadErrors';
import { IntlProviders } from '../../../utils/testWithIntl';

describe('fileUploadErrors', () => {
  it('returns fileSize error message', () => {
    const Component = () => <div>{getErrorMsg('fileSize')}</div>;
    render(
      <IntlProviders>
        <Component />
      </IntlProviders>
    );
    expect(screen.getByText(/File must be smaller than/)).toBeInTheDocument();
  });

  it('returns unsupportedGeom error message', () => {
    const Component = () => <div>{getErrorMsg('unsupportedGeom - Point')}</div>;
    render(
      <IntlProviders>
        <Component />
      </IntlProviders>
    );
    expect(screen.getByText(/Unsupported geometry type Point/i)).toBeInTheDocument();
  });

  it('returns unmapped error message or null if not mapped', () => {
    const Component = () => <div>{getErrorMsg('someUnknownMessage')}</div>;
    const { container } = render(
      <IntlProviders>
        <Component />
      </IntlProviders>
    );
    expect(container.textContent).toBe('');
  });
});

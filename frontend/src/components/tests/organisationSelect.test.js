import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { OrganisationSelect } from '../formInputs';
import { ReduxIntlProviders } from '../../utils/testWithIntl';

describe('Select Organisations component', () => {
  let onChange = jest.fn();
  it('tests OrganisationSelect', () => {
    render(
      <ReduxIntlProviders>
        <OrganisationSelect orgId={1} onChange={onChange} className="" />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText(/Select organization/i)).toBeInTheDocument();
  });
});

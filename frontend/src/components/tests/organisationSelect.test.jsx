import { render, screen } from '@testing-library/react';


import { OrganisationSelect } from '../formInputs';
import { ReduxIntlProviders } from '../../utils/testWithIntl';

describe('Select Organisations component', () => {
  let onChange = vi.fn();
  it('tests OrganisationSelect', () => {
    render(
      <ReduxIntlProviders>
        <OrganisationSelect orgId={1} onChange={onChange} className="" />
      </ReduxIntlProviders>,
    );
    expect(screen.queryByText(/Select organization/i)).toBeInTheDocument();
  });
});

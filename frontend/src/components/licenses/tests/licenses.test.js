import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { IntlProviders } from '../../../utils/testWithIntl';
import { LicenseCard, LicensesManagement, LicenseForm } from '../index';

const license = {
  licenseId: 1,
  name: 'HOT Licence',
  description: 'This data is licensed for use under the HOT licence.',
  plainText: 'HOT is allowing access to this imagery for creating data in OSM',
};

const licenses = [
  {
    licenseId: 1,
    name: 'HOT Licence',
    description: 'This data is licensed for use under the HOT licence.',
    plainText: 'HOT is allowing access to this imagery for creating data in OSM',
  },
  {
    licenseId: 2,
    name: 'NextView',
    description: 'This data is licensed for use under the NextView licence.',
    plainText: 'Only use NextView imagery for digitizing OSM data for humanitarian purposes.',
  },
];

describe('License Card', () => {
  it('renders a license card given valid license information', () => {
    const { container } = render(<LicenseCard license={license} />);
    expect(screen.getByText('HOT Licence')).toBeInTheDocument();
    expect(container.querySelector('a').href).toContain('/1');
    expect(container.querySelectorAll('svg').length).toBe(1); //copyright icon
  });
});

describe('Licenses Management', () => {
  it('renders all licenses and button to add a new license', () => {
    const { container } = render(
      <IntlProviders>
        <LicensesManagement licenses={licenses} isLicensesFetched={true} />
      </IntlProviders>,
    );
    expect(container.querySelector('h3').innerHTML).toBe('Manage Licenses');
    const newLink = container.querySelector('h3').nextSibling;
    expect(newLink.href).toContain('/new');
    const button = newLink.firstChild;
    expect(button.textContent).toBe('New');
    const license1 = screen.getByText(/HOT Licence/);
    expect(license1.closest('a').href).toContain('/1');
    const license2 = screen.getByText(/NextView/);
    expect(license2.closest('a').href).toContain('/2');
  });

  it('renders placeholder and not licenses when API is being fetched', () => {
    const { container } = render(
      <IntlProviders>
        <LicensesManagement licenses={licenses} isLicensesFetched={false} />
      </IntlProviders>,
    );
    expect(screen.queryByText(/HOT Licence/)).not.toBeInTheDocument();
    expect(screen.queryByText(/NextView/)).not.toBeInTheDocument();
    expect(container.querySelectorAll('svg').length).toBe(5); // 4 plus the new icon svg
    expect(container.querySelector('.show-loading-animation')).toBeInTheDocument();
  });
});

describe('LicenseForm', () => {
  it('renders a form containing different editable license fields for a given license', () => {
    const updateLicense = jest.fn();
    render(
      <IntlProviders>
        <LicenseForm license={license} updateLicense={updateLicense} />
      </IntlProviders>,
    );

    expect(screen.getByText('License information')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Plain Text')).toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();

    // test form inputs
    const inputs = screen.getAllByRole('textbox');
    //Name input
    expect(inputs[0].name).toBe('name');
    expect(inputs[0].value).toBe('HOT Licence');
    //Description input
    expect(inputs[1].name).toBe('description');
    expect(inputs[1].value).toBe('This data is licensed for use under the HOT licence.');
    // plainText input
    expect(inputs[2].name).toBe('plainText');
    expect(inputs[2].value).toBe('HOT is allowing access to this imagery for creating data in OSM');

    // change license name
    fireEvent.change(inputs[0], { target: { value: 'license A' } });

    const saveBtn = screen.getByText('Save');
    const cancelBtn = screen.getByText('Cancel');
    expect(saveBtn).toBeInTheDocument();
    expect(cancelBtn).toBeInTheDocument();

    // save license name
    fireEvent.click(saveBtn);
    expect(inputs[0].value).toBe('license A');
    expect(updateLicense).toHaveBeenCalledWith({ ...license, name: 'license A' });
  });

  it('renders an empty form if licence is null', () => {
    render(
      <IntlProviders>
        <LicenseForm license={null} updateLicense={() => jest.fn()} />
      </IntlProviders>,
    );
    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0].name).toBe('name');
    expect(inputs[0].value).toBe('');
    expect(inputs[1].name).toBe('description');
    expect(inputs[1].value).toBe('');
    expect(inputs[2].name).toBe('plainText');
    expect(inputs[2].value).toBe('');
  });
});

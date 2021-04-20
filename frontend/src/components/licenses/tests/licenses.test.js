import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { IntlProviders } from '../../../utils/testWithIntl';
import { LicenseCard, LicensesManagement, LicenseForm } from '../index';

const license = {
  licenseId: '01',
  name: 'license-1',
};

const licenses = [
  {
    licenseId: '01',
    name: 'license-1',
  },
  {
    licenseId: '02',
    name: 'license-2',
  },
];

describe('License Card', () => {
  it('renders a license card given valid license information', () => {
    const { container } = render(<LicenseCard license={license} />);
    expect(screen.getByText('license-1')).toBeInTheDocument();
    expect(container.querySelector('a').href).toContain('/01');
    expect(container.querySelectorAll('svg').length).toBe(1); //copyright icon
  });
});

describe('Licenses Management', () => {
  it('renders all licenses and button to add a new license', () => {
    const { container } = render(
      <IntlProviders>
        <LicensesManagement licenses={licenses} />
      </IntlProviders>,
    );
    expect(container.querySelector('h3').innerHTML).toBe('Manage Licenses');
    const newLink = container.querySelector('h3').nextSibling;
    expect(newLink.href).toContain('/new');
    const button = newLink.firstChild;
    expect(button.textContent).toBe('New');
    const license1 = screen.getByText(/license-1/);
    expect(license1.closest('a').href).toContain('/01');
    const license2 = screen.getByText(/license-2/);
    expect(license2.closest('a').href).toContain('/02');
  });
});

describe('LicenseForm', () => {
  it('renders a form containing different editable license fields for a given license', () => {
    render(
      <IntlProviders>
        <LicenseForm license={license} updateLicense={() => jest.fn()} />
      </IntlProviders>,
    );

    expect(screen.getByText('License information')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Plain Text')).toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    // expect(screen.findByRole('form').id).toBe('license-form');
    // test form inputs
    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0].name).toBe('name');
    expect(inputs[0].value).toBe('license-1');
    expect(inputs[1].name).toBe('description');
    expect(inputs[2].name).toBe('plainText');

    // change license name
    fireEvent.change(inputs[0], { target: { value: 'license A' } });

    const saveBtn = screen.getByText('Save');
    const cancelBtn = screen.getByText('Cancel');
    expect(saveBtn).toBeInTheDocument();
    expect(cancelBtn).toBeInTheDocument();

    // save license name
    fireEvent.click(saveBtn);
    expect(inputs[0].value).toBe('license A');
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

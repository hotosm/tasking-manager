import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { store } from '../store';

import { CustomDropdown } from '../components/partners/customDropdown';
import { StatsNumber, StatsColumn, StatsSection } from '../components/partners/partnersStats';
import { Resources } from '../components/partners/partnersResources';

const Wrapper = ({ children }) => (
  <Provider store={store}>
    <IntlProvider locale="en">
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </IntlProvider>
  </Provider>
);

// ─── CustomDropdown ───────────────────────────────────────────────────────────

describe('CustomDropdown component', () => {
  const mockData = [
    { label: 'Option 1', onClick: jest.fn() },
    { label: 'Option 2', onClick: jest.fn() },
  ];

  it('renders without crashing', () => {
    render(<CustomDropdown title="Test" data={mockData} buttonClassname="" />, { wrapper: Wrapper });
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('shows dropdown list on button click', () => {
    render(<CustomDropdown title="Resources" data={mockData} buttonClassname="" />, { wrapper: Wrapper });
    const button = screen.getByText('Resources').closest('button');
    fireEvent.click(button);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('hides dropdown list when closed', () => {
    render(<CustomDropdown title="Resources" data={mockData} buttonClassname="" />, { wrapper: Wrapper });
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('toggles dropdown on second click', () => {
    render(<CustomDropdown title="Resources" data={mockData} buttonClassname="" />, { wrapper: Wrapper });
    const button = screen.getByText('Resources').closest('button');
    fireEvent.click(button);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('calls option onClick when item is mousedown', () => {
    render(<CustomDropdown title="Resources" data={mockData} buttonClassname="" />, { wrapper: Wrapper });
    const button = screen.getByText('Resources').closest('button');
    fireEvent.click(button);
    const option = screen.getByText('Option 1');
    fireEvent.mouseDown(option);
    expect(mockData[0].onClick).toHaveBeenCalled();
  });
});

// ─── StatsNumber ──────────────────────────────────────────────────────────────

describe('StatsNumber component', () => {
  it('renders numeric value correctly', () => {
    render(<StatsNumber value={100} />, { wrapper: Wrapper });
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders large number with abbreviation', () => {
    const { container } = render(<StatsNumber value={1500000} />, { wrapper: Wrapper });
    expect(container).toBeInTheDocument();
  });

  it('renders zero', () => {
    const { container } = render(<StatsNumber value={0} />, { wrapper: Wrapper });
    expect(container).toBeInTheDocument();
  });
});

// ─── StatsColumn ──────────────────────────────────────────────────────────────

describe('StatsColumn component', () => {
  const mockLabel = { id: 'test.label', defaultMessage: 'Test Label' };

  it('renders StatsColumn with value', () => {
    render(<StatsColumn label={mockLabel} value={42} icon={<span>icon</span>} />, { wrapper: Wrapper });
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('renders dash when value is undefined', () => {
    const { container } = render(
      <StatsColumn label={mockLabel} value={undefined} icon={<span>icon</span>} />,
      { wrapper: Wrapper }
    );
    expect(container.textContent).toContain('–');
  });
});

// ─── StatsSection ─────────────────────────────────────────────────────────────

describe('StatsSection component', () => {
  it('renders StatsSection with partner data', () => {
    const mockPartner = { users: 100, edits: 500, buildings: 200, roads: 50 };
    const { container } = render(<StatsSection partner={mockPartner} />, { wrapper: Wrapper });
    expect(container).toBeInTheDocument();
  });

  it('renders StatsSection with null partner showing dashes', () => {
    const { container } = render(<StatsSection partner={null} />, { wrapper: Wrapper });
    expect(container).toBeInTheDocument();
  });
});

// ─── Resources ────────────────────────────────────────────────────────────────

describe('Resources component', () => {
  it('renders null when partner has no keys', () => {
    const { container } = render(<Resources partner={{}} />, { wrapper: Wrapper });
    expect(container.firstChild).toBeNull();
  });

  it('renders null when partner is undefined', () => {
    const { container } = render(<Resources partner={undefined} />, { wrapper: Wrapper });
    expect(container.firstChild).toBeNull();
  });

  it('renders Resources with website links', () => {
    const mockPartner = {
      name_1: 'Link One',
      url_1: 'https://example.com',
    };
    render(<Resources partner={mockPartner} />, { wrapper: Wrapper });
    expect(screen.getByText('Resources')).toBeInTheDocument();
  });

  it('renders nothing when no name/url keys exist', () => {
    const mockPartner = { id: 1, name: 'Partner' };
    const { container } = render(<Resources partner={mockPartner} />, { wrapper: Wrapper });
    // No website links → returns empty fragment
    expect(container).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntlProvider } from 'react-intl';

import { InfoBox } from '../components/projectDetail/infoBox';
import { OSMChaButton } from '../components/projectDetail/osmchaButton';

const Wrapper = ({ children }) => (
  <IntlProvider locale="en">
    {children}
  </IntlProvider>
);

describe('InfoBox component', () => {
  it('renders correctly without tooltip', () => {
    const { container } = render(<InfoBox title="Test Title" className="my-class" />, { wrapper: Wrapper });
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(container.querySelector('.my-class')).toBeInTheDocument();
  });

  it('renders correctly with tooltip', () => {
    render(<InfoBox title="Title with tooltip" tooltip="This is a tooltip" />, { wrapper: Wrapper });
    expect(screen.getByText('Title with tooltip')).toBeInTheDocument();
    // Tooltip library renders to portal or handles visibility, we can just check if text exists somewhere
    expect(screen.getByText('This is a tooltip')).toBeInTheDocument();
  });
});

describe('OSMChaButton component', () => {
  const mockProject = { projectId: 123, aoiBBOX: [1, 2, 3, 4], changesets: [] };

  it('renders correctly in default mode', () => {
    render(<OSMChaButton project={mockProject} className="btn-class" />, { wrapper: Wrapper });
    expect(screen.getByText(/View in OSMCha/i)).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders correctly in compact mode', () => {
    render(<OSMChaButton project={mockProject} compact={true} />, { wrapper: Wrapper });
    expect(screen.getByText(/Changesets/i)).toBeInTheDocument();
  });

  it('renders correctly with children', () => {
    render(
      <OSMChaButton project={mockProject}>
        <span>Custom Child Button</span>
      </OSMChaButton>, 
      { wrapper: Wrapper }
    );
    expect(screen.getByText('Custom Child Button')).toBeInTheDocument();
    expect(screen.queryByText(/View in OSMCha/i)).not.toBeInTheDocument();
  });
});

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { ProjectCard } from '../projectCard';
import { IntlProviders } from '../../../utils/testWithIntl';
import { projects } from '../../../network/tests/mockData/projects';

describe('Project Card', () => {
  it('should render project details on the card', () => {
    render(
      <IntlProviders>
        <ProjectCard {...projects.results[0]} />
      </IntlProviders>,
    );
    expect(screen.getByRole('heading', { name: 'NRCS_Duduwa Mapping' })).toBeInTheDocument();
    expect(screen.getByAltText('IFRC')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.queryByText('Published')).not.toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('total contributors')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar').length).toBe(2);
    expect(screen.getByText(/left/i)).toBeInTheDocument();
  });

  it('should render status and not priority if provided', () => {
    render(
      <IntlProviders>
        <ProjectCard {...projects.results[1]} />
      </IntlProviders>,
    );
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.queryByText('Medium')).not.toBeInTheDocument();
  });
});

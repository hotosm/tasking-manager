import { FormattedNumber } from 'react-intl';
import { NextMappingLevel } from '../topBar';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MappingLevelMessage } from '../../mappingLevel';
import { createComponentWithIntl, IntlProviders } from '../../../utils/testWithIntl';
import { useUserNextLevelQuery } from '../../../api/stats';

// Mock the hook
jest.mock('../../../api/stats', () => ({
  useUserNextLevelQuery: jest.fn(),
}));

describe('NextMappingLevel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('changesets missing to intermediate level', async () => {
    useUserNextLevelQuery.mockReturnValue({
      data: {
        nextLevel: 'INTERMEDIATE',
        aggregatedGoal: 250,
        aggregatedProgress: 100,
        metrics: ['changeset'],
      },
    });
    render(
      <IntlProviders>
        <NextMappingLevel userId={1} />
      </IntlProviders>,
    );

    // Check the rendered text, not props
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText(/INTERMEDIATE/i)).toBeInTheDocument();
  });

  it('changesets missing to advanced level', () => {
    useUserNextLevelQuery.mockReturnValue({
      data: {
        nextLevel: 'ADVANCED',
        aggregatedGoal: 300,
        aggregatedProgress: 500,
        metrics: ['changeset'],
      },
    });
    render(
      <IntlProviders>
        <NextMappingLevel userId={1} />
      </IntlProviders>,
    );

    // Check the rendered text, not props
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText(/ADVANCED/i)).toBeInTheDocument();
  });

  it('user is advanced already', () => {
    useUserNextLevelQuery.mockReturnValue({});

    const element = createComponentWithIntl(<NextMappingLevel userId={1} />);
    const elementInstance = element.root;
    expect(() => elementInstance.findByType(FormattedNumber)).toThrow(
      new Error('No instances found with node type: "FormattedNumber"'),
    );
    expect(() => elementInstance.findByType(MappingLevelMessage)).toThrow(
      new Error('No instances found with node type: "MappingLevelMessage"'),
    );
  });
});

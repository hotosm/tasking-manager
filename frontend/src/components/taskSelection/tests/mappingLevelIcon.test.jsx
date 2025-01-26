import { IntlProviders } from '../../../utils/testWithIntl';
import { MappingLevelIcon } from '../contributions';
import { render, screen } from '@testing-library/react';

describe('if user is ADVANCED, MappingLevelIcon should return', () => {
  const setup = () =>
    render(
      <IntlProviders>
        <MappingLevelIcon mappingLevel="ADVANCED" />
      </IntlProviders>,
    );
  it('FullStarIcon with correct classNames', () => {
    const { container } = setup();
    expect(container.querySelector('.h1.w1.v-mid.pb1')).toBeInTheDocument();
  });
  it('FormattedMessage with the correct id', () => {
    setup();
    expect(screen.getByTitle('Advanced')).toBeInTheDocument();
  });
});

describe('if user is INTERMEDIATE, MappingLevelIcon should return', () => {
  const setup = () =>
    render(
      <IntlProviders>
        <MappingLevelIcon mappingLevel="INTERMEDIATE" />
      </IntlProviders>,
    );
  it('FullStarIcon with correct classNames', () => {
    const { container } = setup();
    expect(container.querySelector('.h1.w1.v-mid.pb1')).toBeInTheDocument();
  });
  it('FormattedMessage with the correct id', () => {
    setup();
    expect(screen.getByTitle('Intermediate')).toBeInTheDocument();
  });
});

describe('if user is BEGINNER, MappingLevelIcon should not return', () => {
  it('icon and FormattedMessage', () => {
    const { container } = render(
      <IntlProviders>
        <MappingLevelIcon mappingLevel="BEGINNER" />
      </IntlProviders>,
    );
    expect(container.getElementsByTagName('svg').length).toBe(0);
  });
});

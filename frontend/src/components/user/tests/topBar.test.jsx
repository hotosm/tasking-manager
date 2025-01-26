import { NextMappingLevel } from '../topBar';
import { IntlProviders } from '../../../utils/testWithIntl';
import { render, screen } from '@testing-library/react';
import messages from '../../messages';

it('changesets missing to intermediate level', () => {
  render(
    <IntlProviders>
      <NextMappingLevel changesetsCount={100} />
    </IntlProviders>,
  );
  expect(screen.getByText('100')).toBeInTheDocument();
  expect(screen.getByText('250')).toBeInTheDocument();
  expect(screen.getByText(messages.mappingLevelINTERMEDIATE.defaultMessage)).toBeInTheDocument();
});

it('changesets missing to advanced level', () => {
  render(
    <IntlProviders>
      <NextMappingLevel changesetsCount={300} />
    </IntlProviders>,
  );
  expect(screen.getByText('300')).toBeInTheDocument();
  expect(screen.getByText('500')).toBeInTheDocument();
  expect(screen.getByText(messages.mappingLevelADVANCED.defaultMessage)).toBeInTheDocument();
});

it('user is advanced already', () => {
  const { container } = render(
    <IntlProviders>
      <NextMappingLevel changesetsCount={600} />
    </IntlProviders>,
  );
  // It should output nothing
  expect(container.querySelector('span')).not.toBeInTheDocument();
});

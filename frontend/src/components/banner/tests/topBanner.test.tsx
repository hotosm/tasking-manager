import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { banner } from '../../../network/tests/mockData/miscellaneous';
import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { TopBanner } from '../topBanner';

it('should render the banner text ', async () => {
  renderWithRouter(
    <ReduxIntlProviders>
      <TopBanner />
    </ReduxIntlProviders>,
  );
  expect(await screen.findByText(banner.message)).toBeInTheDocument();
});

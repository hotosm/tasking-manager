import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { banner } from '../../../network/tests/mockData/miscellaneous';
import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { TopBanner } from '../topBanner';

it('should render the banner text ', async () => {
  render(
    <ReduxIntlProviders>
      <TopBanner />
    </ReduxIntlProviders>,
  );
  expect(await screen.findByText(banner.message)).toBeInTheDocument();
});

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IntlProviders } from '../../../utils/testWithIntl';
import { LeaveTeamConfirmationAlert } from '../leaveTeamConfirmationAlert';

describe('CampaignsManagement component', () => {
  it('should call the close prop upon clicking the cancel button', async () => {
    const user = userEvent.setup();
    const closeMock = jest.fn();
    render(
      <IntlProviders>
        <LeaveTeamConfirmationAlert teamName="KLL" close={closeMock} />
      </IntlProviders>,
    );
    expect(screen.getByText(/Are you sure you want to leave /i)).toBeInTheDocument();
    expect(screen.getByText('KLL')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', {
        name: /cancel/i,
      }),
    );
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it('should call the leaveTeam prop upon clicking the cancel button', async () => {
    const user = userEvent.setup();
    const leaveTeamMock = jest.fn();
    render(
      <IntlProviders>
        <LeaveTeamConfirmationAlert teamName="KLL" leaveTeam={leaveTeamMock} />
      </IntlProviders>,
    );
    expect(screen.getByText(/Are you sure you want to leave /i)).toBeInTheDocument();
    expect(screen.getByText('KLL')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', {
        name: /leave/i,
      }),
    );
    expect(leaveTeamMock).toHaveBeenCalledTimes(1);
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  createComponentWithMemoryRouter,
  IntlProviders,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../utils/testWithIntl';
import { ListCampaigns, CampaignError, CreateCampaign, EditCampaign } from '../campaigns';

describe('ListCampaigns', () => {
  it('should show loading placeholder when licenses are being fetched', () => {
    const { container } = renderWithRouter(
      <ReduxIntlProviders>
        <ListCampaigns />
      </ReduxIntlProviders>,
    );
    expect(container.getElementsByClassName('show-loading-animation').length).toBe(4);
  });

  it('should fetch and list campaigns', async () => {
    const { container } = renderWithRouter(
      <ReduxIntlProviders>
        <ListCampaigns />
      </ReduxIntlProviders>,
    );
    // wait for the fetch API to be complete
    await waitFor(() =>
      expect(container.getElementsByClassName('show-loading-animation').length).toBe(0),
    );
    expect(screen.getByText('Campaign Name 1')).toBeInTheDocument();
    expect(screen.getByText('Campaign Name Two')).toBeInTheDocument();
    expect(screen.getByText('Campaign Name Tres')).toBeInTheDocument();
  });
});

describe('CampaignError', () => {
  it('should display error message if saving campaign fails', () => {
    render(
      <IntlProviders>
        <CampaignError error />
      </IntlProviders>,
    );
    expect(screen.getByText('There was an error saving this campaign.')).toBeInTheDocument();
  });
});

describe('CreateCampaign', () => {
  const setup = () => {
    const { history } = renderWithRouter(
      <ReduxIntlProviders>
        <CreateCampaign />
      </ReduxIntlProviders>,
    );
    const createButton = screen.getByRole('button', {
      name: /create campaign/i,
    });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    return {
      createButton,
      cancelButton,
      history,
    };
  };

  it('should disable create campaign button by default', async () => {
    const { createButton } = setup();
    expect(createButton).toBeDisabled();
  });

  it('should enable create campaign button when the value is changed', async () => {
    const { createButton } = setup();
    const inputText = screen.getByRole('textbox');
    fireEvent.change(inputText, { target: { value: 'New Campaign Name' } });
    expect(createButton).toBeEnabled();
  });

  it('should navigate to the newly created campaign detail page on creation success', async () => {
    const { router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <CreateCampaign />
      </ReduxIntlProviders>,
    );
    const createButton = screen.getByRole('button', {
      name: /create campaign/i,
    });
    const inputText = screen.getByRole('textbox');
    fireEvent.change(inputText, { target: { value: 'New Campaign Name' } });
    expect(inputText.value).toBe('New Campaign Name');
    expect(createButton).toBeEnabled();
    fireEvent.click(createButton);
    await waitFor(() => expect(router.state.location.pathname).toBe('/manage/campaigns/123'));
  });

  // TODO: When cancel button is clicked, the app should navigate to a previous relative path
});

describe('EditCampaign', () => {
  const setup = () => {
    const { container, history } = renderWithRouter(
      <ReduxIntlProviders>
        <EditCampaign id={123} />
      </ReduxIntlProviders>,
    );
    const inputText = screen.getByRole('textbox');

    return {
      container,
      inputText,
      history,
    };
  };

  it('should display the campaign name by default', async () => {
    const { inputText } = setup();
    await waitFor(() => expect(inputText.value).toBe('Campaign Name 123'));
    expect(inputText.value).toBe('Campaign Name 123');
  });

  it('should display save button when project name is changed', async () => {
    const { inputText } = setup();
    await waitFor(() => expect(inputText.value).toBe('Campaign Name 123'));
    fireEvent.change(inputText, { target: { value: 'Changed Campaign Name' } });
    const saveButton = screen.getByRole('button', {
      name: /save/i,
    });
    expect(saveButton).toBeInTheDocument();
  });

  it('should also display cancel button when project name is changed', async () => {
    const { inputText } = setup();
    await waitFor(() => expect(inputText.value).toBe('Campaign Name 123'));
    fireEvent.change(inputText, { target: { value: 'Changed Campaign Name' } });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    expect(cancelButton).toBeInTheDocument();
  });

  it('should return input text value to default when cancel button is clicked', async () => {
    const { inputText } = setup();
    await waitFor(() => expect(inputText.value).toBe('Campaign Name 123'));
    fireEvent.change(inputText, { target: { value: 'Changed Campaign Name' } });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    fireEvent.click(cancelButton);
    expect(inputText.value).toBe('Campaign Name 123');
  });

  it('should display project cards under the campaign', async () => {
    setup();
    expect(await screen.findByText('NRCS_Duduwa Mapping')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'NRCS_Khajura Mapping',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'NRCS_Duduwa Mapping',
      }),
    ).toBeInTheDocument();
  });

  it('should hide the save button after campaign edit is successful', async () => {
    const { inputText } = setup();
    await waitFor(() => expect(inputText.value).toBe('Campaign Name 123'));
    fireEvent.change(inputText, { target: { value: 'Changed Campaign Name' } });
    const saveButton = screen.getByRole('button', { name: /save/i });
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    fireEvent.click(saveButton);
    const savingLoder = within(saveButton).getByRole('img', {
      hidden: true,
    });
    await waitFor(() => {
      expect(savingLoder).not.toBeInTheDocument();
    });
    expect(saveButton).not.toBeInTheDocument();
    expect(cancelButton).not.toBeInTheDocument();
  });
});

describe('Delete Campaign', () => {
  const setup = () => {
    renderWithRouter(
      <ReduxIntlProviders>
        <EditCampaign id={123} />
      </ReduxIntlProviders>,
    );
    const inputText = screen.getByRole('textbox');

    return {
      inputText,
    };
  };

  it('should ask for confirmation when user tries to delete a campaign', async () => {
    setup();
    expect(await screen.findByText('NRCS_Duduwa Mapping')).toBeInTheDocument();
    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });
    fireEvent.click(deleteButton);
    expect(screen.getByText('Are you sure you want to delete this campaign?')).toBeInTheDocument();
  });

  it('should close the confirmation popup when cancel is clicked', async () => {
    setup();
    expect(await screen.findByText('NRCS_Duduwa Mapping')).toBeInTheDocument();
    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });
    fireEvent.click(deleteButton);
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });
    fireEvent.click(cancelButton);
    expect(
      screen.queryByText('Are you sure you want to delete this campaign?'),
    ).not.toBeInTheDocument();
  });

  it('should direct to campaigns list page on successful deletion of a campaign', async () => {
    const { router } = createComponentWithMemoryRouter(
      <ReduxIntlProviders>
        <EditCampaign id={123} />
      </ReduxIntlProviders>,
    );
    expect(await screen.findByText('NRCS_Duduwa Mapping')).toBeInTheDocument();
    const deleteButton = screen.getByRole('button', {
      name: /delete/i,
    });
    fireEvent.click(deleteButton);
    const dialog = screen.getByRole('dialog');
    const deleteConfirmationButton = within(dialog).getByRole('button', {
      name: /delete/i,
    });
    fireEvent.click(deleteConfirmationButton);
    expect(await screen.findByText('Campaign deleted successfully.')).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe('/manage/campaigns'));
  });
});

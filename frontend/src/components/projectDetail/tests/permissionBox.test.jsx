import { FormattedMessage } from 'react-intl';
import { createComponentWithIntl, IntlProviders } from '../../../utils/testWithIntl';
import { PermissionBox } from '../permissionBox';
import { render, screen } from '@testing-library/react';
import messages from '../messages';

describe('test if PermissionBox', () => {
  it('without validation returns correct style and strings', async () => {
    render(
      <IntlProviders>
        <PermissionBox permission="ANY" className="red" />
      </IntlProviders>,
    );

    expect(await screen.findByText(messages.permissions_ANY.defaultMessage)).toBeInTheDocument();
    expect((await screen.findByText(messages.permissions_ANY.defaultMessage)).className).toEqual("tc br1 f6 ba red");
  });

  it('without permission TEAMS returns correct style and strings', async () => {
    render(
      <IntlProviders>
        <PermissionBox permission="TEAMS" className="orange" />
      </IntlProviders>,
    );

    // Can't use the message constant - it has to be parsed for this example
    // Text is split into two parts
    expect(await screen.findByText("Team")).toBeInTheDocument();
    expect(await screen.findByText("members")).toBeInTheDocument();
    expect((await screen.findByText("members")).className).toEqual("tc br1 f6 ba orange");
  });

  it('with validation and TEAMS permission returns correct style and strings', async () => {
    render(
      <IntlProviders>
        <PermissionBox permission="TEAMS" validation className="red" />
      </IntlProviders>
    )

    // Can't use the message constant - it has to be parsed for this example
    // Text is split into two parts
    expect(await screen.findByText("Validation team")).toBeInTheDocument();
    expect(await screen.findByText("members")).toBeInTheDocument();
    expect((await screen.findByText("members")).className).toEqual("tc br1 f6 ba red");
  });

  it('with validation and TEAMS_LEVEL permission returns correct style and strings', async () => {
    render(
      <IntlProviders>
        <PermissionBox permission="TEAMS_LEVEL" validation className="red" />
      </IntlProviders>
    )

    // Can't use the message constant - it has to be parsed for this example
    // Text is split into two parts
    expect(await screen.findByText("Intermediate and advanced members")).toBeInTheDocument();
    expect(await screen.findByText("Validation team")).toBeInTheDocument();
    expect((await screen.findByText("Intermediate and advanced members")).className).toEqual("tc br1 f6 ba red");
  });
});

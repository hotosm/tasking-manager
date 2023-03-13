import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { IntlProviders } from '../../../utils/testWithIntl';
import { ProjectInstructions } from '../instructions';
import messages from '../messages';

describe('Branches in Project Instructions', () => {
  it('should display archived project alert', () => {
    render(
      <IntlProviders>
        <ProjectInstructions isProjectArchived />
      </IntlProviders>,
    );
    expect(screen.getByText(messages.projectIsArchived.defaultMessage)).toBeInTheDocument();
  });

  it('should not display anything if instructions is not passed', () => {
    const { container } = render(
      <IntlProviders>
        <ProjectInstructions />
      </IntlProviders>,
    );
    expect(container.firstChild).toBeEmptyDOMElement();
  });
});

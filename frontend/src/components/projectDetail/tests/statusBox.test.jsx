import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ProjectStatusBox } from '../statusBox';
import { IntlProviders } from '../../../utils/testWithIntl';

describe('test if ProjectStatusBox component', () => {
  it('displays the DRAFT status as orange', () => {
    render(
      <IntlProviders>
        <ProjectStatusBox status={'DRAFT'} className={''} />
      </IntlProviders>,
    );
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Draft').className).toContain('b--orange orange');
    expect(screen.getByText('Draft').className).not.toContain('b--blue-grey blue-grey');
  });

  it('displays ARCHIVED status as grey', () => {
    render(
      <IntlProviders>
        <ProjectStatusBox status={'ARCHIVED'} className={''} />
      </IntlProviders>,
    );
    expect(screen.getByText('Archived')).toBeInTheDocument();
    expect(screen.getByText('Archived').className).toContain('b--blue-grey blue-grey');
    expect(screen.getByText('Archived').className).not.toContain('b--orange orange');
  });
});

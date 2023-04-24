import { Provider } from 'react-redux';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { EditsStats } from '../edits';
import { ConnectedIntl } from '../../../utils/internationalization';
import { store } from '../../../store';

describe('EditsStats component', () => {
  const data = {
    changesets: 22153,
    roads: 2739.51998662114,
    buildings: 269809,
    edits: 310483,
  };

  it('render contents', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <ConnectedIntl>
          <EditsStats data={data} />
        </ConnectedIntl>
      </Provider>,
    );

    await waitFor(() => expect(getByText('Changesets')).toBeInTheDocument());
    expect(getByText('Changesets')).toBeInTheDocument();
    expect(getByText('Buildings mapped')).toBeInTheDocument();
    expect(getByText('Km road mapped')).toBeInTheDocument();
    expect(getByText('Total map edits')).toBeInTheDocument();
    expect(getByText('310,483')).toBeInTheDocument();
    expect(getByText('22,153')).toBeInTheDocument();
    expect(getByText('2,739')).toBeInTheDocument();
    expect(getByText('269,809')).toBeInTheDocument();
  });
});

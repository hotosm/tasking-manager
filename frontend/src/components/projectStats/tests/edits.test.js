import React from 'react';
import { render } from '@testing-library/react';
import { EditsStats } from '../edits';
import { ConnectedIntl } from '../../../utils/internationalization';
import { Provider } from 'react-redux';
import { store } from '../../../store';

describe('EditsStats component', () => {
  const data = {
    changesets: 22153,
    roads: 2739.51998662114,
    buildings: 269809,
    edits: 310483,
  };

  it('render contents', () => {
    const { getByText } = render(
      <Provider store={store}>
        <ConnectedIntl>
          <EditsStats data={data} />
        </ConnectedIntl>
      </Provider>,
    );

    expect(getByText('Edits')).toBeTruthy();
    expect(getByText('Total changesets')).toBeTruthy();
    expect(getByText('Buildings mapped')).toBeTruthy();
    expect(getByText('Km road mapped')).toBeTruthy();
    expect(getByText('Total map edits')).toBeTruthy();
    expect(getByText('310483')).toBeTruthy();
  });
});

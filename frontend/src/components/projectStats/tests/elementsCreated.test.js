import React from 'react';
import { render, screen } from '@testing-library/react';
import { ElementsCreated } from '../elementsCreated'
import { ConnectedIntl } from '../../../utils/internationalization';
import { Provider } from 'react-redux';
import { store } from '../../../store';

describe('ElementsCreated component', () => {
  const data = {
    changesets: 22153,
    roads: 2739.51998662114,
    buildings: 269809,
    edits: 310483
  }

  it('component is rendered', () => {
    const { getByText } = render(
      <Provider store={store}>
        <ConnectedIntl>
          <ElementsCreated data={data}/>
        </ConnectedIntl>
      </Provider>
    )

    expect(getByText('Task statistics')).toBeTruthy();
    expect(getByText('Total changesets')).toBeTruthy();
    expect(getByText('Buildings mapped')).toBeTruthy();
    expect(getByText('Km road mapped')).toBeTruthy();
    expect(getByText('Total edits')).toBeTruthy();
  })
})

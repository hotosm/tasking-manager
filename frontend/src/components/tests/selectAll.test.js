import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { SelectAll } from '../formInputs';
import userEvent from '@testing-library/user-event';

describe('SelectAll', () => {
  const allItems = [1, 2, 3];
  let selected = [];
  const setSelected = (list) => (selected = list);
  it('unactive when clicked select all elements', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SelectAll
        allItems={allItems}
        setSelected={setSelected}
        selected={selected}
        className="dib v-mid mv3 ml3"
      />,
    );
    expect(screen.getByRole('checkbox').className).toBe(
      'bg-white w1 h1 ma1 ba bw1 b--red br1 relative pointer dib v-mid mv3 ml3',
    );
    expect(container.querySelectorAll('div').length).toBe(1);
    await user.click(screen.getByRole('checkbox'));
    expect(selected).toEqual([1, 2, 3]);
  });

  it('active when clicked unselect elements', async () => {
    selected = [1, 2, 3];
    const user = userEvent.setup();
    const { container } = render(
      <SelectAll
        allItems={allItems}
        setSelected={setSelected}
        selected={selected}
        className="dib v-mid mv3 ml3"
      />,
    );
    expect(screen.getByRole('checkbox').className).toBe(
      'bg-white w1 h1 ma1 ba bw1 b--red br1 relative pointer dib v-mid mv3 ml3',
    );
    expect(container.querySelectorAll('div').length).toBe(2);
    await user.click(screen.getByRole('checkbox'));
    expect(selected).toEqual([]);
  });
});

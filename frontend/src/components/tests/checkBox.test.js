import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { CheckBox } from '../formInputs';
import userEvent from '@testing-library/user-event';

describe('CheckBox', () => {
  let selected = [];
  const setSelected = (list) => (selected = list);
  it('unactive when clicked select element', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CheckBox activeItems={selected} toggleFn={setSelected} itemId={1} />,
    );
    expect(screen.getByRole('checkbox').className).toBe(
      'bg-white w1 h1 ma1 ba bw1 b--red br1 relative pointer ',
    );
    expect(container.querySelectorAll('div').length).toBe(1);
    await user.click(screen.getByRole('checkbox'));
    expect(selected).toEqual([1]);
  });

  it('active when clicked unselect element', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CheckBox activeItems={selected} toggleFn={setSelected} itemId={1} />,
    );
    expect(screen.getByRole('checkbox').className).toBe(
      'bg-white w1 h1 ma1 ba bw1 b--red br1 relative pointer ',
    );
    expect(container.querySelectorAll('div').length).toBe(2);
    await user.click(screen.getByRole('checkbox'));
    expect(selected).toEqual([]);
  });
});

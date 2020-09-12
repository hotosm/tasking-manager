import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { CheckBox } from '../formInputs';

describe('CheckBox', () => {
  let selected = [];
  const setSelected = (list) => (selected = list);
  it('unactive when clicked select element', () => {
    const { container } = render(
      <CheckBox activeItems={selected} toggleFn={setSelected} itemId={1} />,
    );
    expect(screen.getByRole('checkbox').className).toBe(
      'bg-white w1 h1 ma1 ba bw1 b--red br1 relative pointer ',
    );
    expect(container.querySelectorAll('div').length).toBe(1);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(selected).toEqual([1]);
  });

  it('active when clicked unselect element', () => {
    const { container } = render(
      <CheckBox activeItems={selected} toggleFn={setSelected} itemId={1} />,
    );
    expect(screen.getByRole('checkbox').className).toBe(
      'bg-white w1 h1 ma1 ba bw1 b--red br1 relative pointer ',
    );
    expect(container.querySelectorAll('div').length).toBe(2);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(selected).toEqual([]);
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { StatsCardContent } from '../statsCardContent';

describe('CardContent', () => {
  it('default color style', () => {
    const { container } = render(
      <StatsCardContent value={1000} label="tasks mapped" className="w-25-ns w-50 fl tc pt3 pb4" />,
    );
    expect(screen.getByText('1000').className).toBe('ma0 mb2 barlow-condensed f2 b red');
    expect(screen.getByText('tasks mapped').className).toBe('ma0 h2 f7 b blue-grey');
    expect(container.querySelector('div').className).toBe('w-25-ns w-50 fl tc pt3 pb4');
  });

  it('invertColors make the text color white', () => {
    const { container } = render(
      <StatsCardContent
        value={1000}
        label="tasks mapped"
        className="w-30-ns w-50 fl tc pt3 pb4"
        invertColors={true}
      />,
    );
    expect(screen.getByText('1000').className).toBe('ma0 mb2 barlow-condensed f2 b white');
    expect(screen.getByText('tasks mapped').className).toBe('ma0 h2 f7 b white');
    expect(container.querySelector('div').className).toBe('w-30-ns w-50 fl tc pt3 pb4');
  });
});

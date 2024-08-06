import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { StatsCardContent, StatsCard } from '../statsCard';
import { HomeIcon } from '../svgIcons';
import { ReduxIntlProviders } from '../../utils/testWithIntl';

describe('StatsCardContent', () => {
  it('default color style', () => {
    const { container } = render(
      <StatsCardContent value={1000} label="tasks mapped" className="w-25-ns w-50 fl tc pt3 pb4" />,
    );
    expect(screen.getByText('1000').className).toBe('ma0 mb1 barlow-condensed f2 fw5 red');
    expect(screen.getByText('tasks mapped').className).toBe('ma0 h2 f7 fw5 blue-grey');
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
    expect(screen.getByText('1000').className).toBe('ma0 mb1 barlow-condensed f2 fw5 white');
    expect(screen.getByText('tasks mapped').className).toBe('ma0 h2 f7 fw5 white');
    expect(container.querySelector('div').className).toBe('w-30-ns w-50 fl tc pt3 pb4');
  });
});

describe('StartsCard', () => {
  it('default colours style and numeric value', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <StatsCard
          icon={<HomeIcon className={'red w1'} />}
          description={'Card description'}
          value={10123}
          className={'w-20-l w-100 w-50-m'}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Card description').className).toBe('ma0 h2 f7 fw5 blue-grey');
    expect(screen.getByText('10,123').className).toBe('ma0 mb1 barlow-condensed f2 fw5 red');
    expect(container.querySelectorAll('div')[0].className).toBe(
      'cf pt3 pb3 ph3 br1 bg-white red shadow-6 flex items-center w-20-l w-100 w-50-m',
    );
    expect(container.querySelectorAll('div')[1].className).toBe('w-30 fl ml2');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
  it('inverted colours style and numeric value', () => {
    const { container } = render(
      <ReduxIntlProviders>
        <StatsCard
          icon={<HomeIcon className={'red w1'} />}
          description={'Edits'}
          value={4325}
          invertColors={true}
          className={'w-30-l w-100 w-50-m'}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Edits').className).toBe('ma0 h2 f7 fw5 white');
    expect(screen.getByText('4,325').className).toBe('ma0 mb1 barlow-condensed f2 fw5 white');
    expect(container.querySelectorAll('div')[0].className).toBe(
      'cf pt3 pb3 ph3 br1 bg-red white flex items-center w-30-l w-100 w-50-m',
    );
    expect(container.querySelectorAll('div')[1].className).toBe('w-30 fl ml2');
  });
  it('non numeric value', () => {
    render(
      <ReduxIntlProviders>
        <StatsCard
          icon={<HomeIcon className={'red w1'} />}
          description={'Time'}
          value={'2h 32min'}
          invertColors={true}
          className={'w-30-l w-100 w-50-m'}
        />
      </ReduxIntlProviders>,
    );
    expect(screen.getByText('Time').className).toBe('ma0 h2 f7 fw5 white');
    expect(screen.getByText('2h 32min').className).toBe('ma0 mb1 barlow-condensed f2 fw5 white');
  });
});

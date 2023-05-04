import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders, renderWithRouter } from '../../../utils/testWithIntl';
import { BarListChart, BarChartItem } from '../barListChart';

test('BarChartItem with link address', () => {
  const { container } = renderWithRouter(
    <ReduxIntlProviders>
      <BarChartItem
        name={'Test project'}
        link={'/projects/1/'}
        percentValue={0.54}
        number={10}
        numberUnit={'tasks'}
      />
    </ReduxIntlProviders>,
  );
  const linkElement = screen.getByText('Test project');
  expect(linkElement.className).toBe('link blue-dark');
  expect(linkElement.href.endsWith('/projects/1/')).toBeTruthy();
  const progressBar = container.querySelector('div.bg-red.br-pill.absolute');
  expect(progressBar.style.height).toBe('0.5em');
  expect(progressBar.style.width).toBe('54%');
  expect(screen.getByText('10').className).toBe('b mr1');
  expect(screen.getByText('tasks').className).toBe('blue-grey');
});

test('BarChartItem without link address', () => {
  const { container } = render(
    <ReduxIntlProviders>
      <BarChartItem name={'Test project'} percentValue={0.65} number={23} numberUnit={'tasks'} />
    </ReduxIntlProviders>,
  );

  expect(screen.getByText('Test project').className).toBe('di ma0 f7 b fl');
  expect(container.querySelector('a')).not.toBeInTheDocument();
  const progressBar = container.querySelector('div.bg-red.br-pill.absolute');
  expect(progressBar.style.height).toBe('0.5em');
  expect(progressBar.style.width).toBe('65%');
  expect(screen.getByText('23').className).toBe('b mr1');
  expect(screen.getByText('tasks').className).toBe('blue-grey');
});

test('BarListChart renders correct elements', () => {
  const data = [
    { id: 7, name: 'SOTM 2023', mapped: 783, validated: 783, total: 1566, percent: 1 },
    { id: 10, name: 'Madagascar Buildings', mapped: 182, validated: 4, total: 186, percent: 0.11 },
    { id: 6, name: 'Disaster response', mapped: 91, validated: 93, total: 184, percent: 0.09 },
  ];
  const { container } = renderWithRouter(
    <ReduxIntlProviders>
      <BarListChart
        data={data}
        linkBase="/projects/"
        linkField="id"
        nameField="name"
        valueField="total"
      />
    </ReduxIntlProviders>,
  );
  expect(container.querySelector('ol').className).toBe('pa0 mt1 mb0');
  expect(container.querySelectorAll('li').length).toBe(3);
  expect(screen.getByText('SOTM 2023').href.endsWith('/projects/7')).toBeTruthy();
  const progressBars = container.querySelectorAll('div.bg-red.br-pill.absolute');
  expect(progressBars[0].style.width).toBe('100%');
  expect(progressBars[1].style.width).toBe('11%');
  expect(progressBars[2].style.width).toBe('9%');
  expect(screen.getByText('1566')).toBeInTheDocument();
  expect(screen.getByText('186')).toBeInTheDocument();
  expect(screen.getByText('184')).toBeInTheDocument();
});

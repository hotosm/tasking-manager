import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { formatOSMChaLink } from '../../../utils/osmchaLink';
import { OSMChaButton } from '../osmchaButton';

test('OSMChaButton with compact False', () => {
  const project = {
    osmchaFilterId: null,
    aoiBBOX: [0, 0, 1, 1],
    changesetComment: '#TM4-TEST',
    created: '2019-08-27T12:20:42.460024Z',
  };
  const { container } = render(
    <ReduxIntlProviders>
      <OSMChaButton project={project} className="pl2 ba b--red" />
    </ReduxIntlProviders>,
  );
  expect(screen.getByText('Changesets in OSMCha').className).toBe('pl2 ba b--red br1 f5 pointer');
  expect(container.querySelector('a').href).toBe(formatOSMChaLink(project));
  expect(container.querySelector('svg.pl2')).toBeInTheDocument();
  expect(container.querySelector('svg.pl1')).not.toBeInTheDocument();
});

test('OSMChaButton with compact True', () => {
  const project = {
    osmchaFilterId: null,
    aoiBBOX: [0, 0, 1, 1],
    changesetComment: '#TM4-TEST',
    created: '2019-08-27T12:20:42.460024Z',
  };
  const { container } = render(
    <ReduxIntlProviders>
      <OSMChaButton project={project} className="pl3" compact={true} />
    </ReduxIntlProviders>,
  );
  expect(screen.getByText('Changesets').className).toBe('pl3 br1 f5 pointer');
  expect(screen.queryByText('Changesets in OSMCha')).not.toBeInTheDocument();
  expect(container.querySelector('a').href).toBe(formatOSMChaLink(project));
  expect(container.querySelector('svg.pl1')).toBeInTheDocument();
  expect(container.querySelector('svg.pl2')).not.toBeInTheDocument();
});

test('OSMChaButton with children', () => {
  const project = {
    osmchaFilterId: null,
    aoiBBOX: [0, 0, 1, 1],
    changesetComment: '#TM4-TEST',
    created: '2019-08-27T12:20:42.460024Z',
  };
  const { container } = render(
    <ReduxIntlProviders>
      <OSMChaButton project={project} className="pl3" compact={true}>
        Custom text
      </OSMChaButton>
    </ReduxIntlProviders>,
  );
  expect(screen.queryByText('Changesets')).not.toBeInTheDocument();
  expect(screen.queryByText('Changesets in OSMCha')).not.toBeInTheDocument();
  expect(screen.queryByText('Custom text')).toBeInTheDocument();
  expect(container.querySelector('a').href).toBe(formatOSMChaLink(project));
  expect(container.querySelector('svg.pl1')).not.toBeInTheDocument();
  expect(container.querySelector('svg.pl2')).not.toBeInTheDocument();
});

// src/components/Task.stories.js

import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import '../../assets/styles/index.scss';

import { ProjectCard } from '../../components/projectcard/projectCard';
import cards from '../projectcard/demoProjectCardsData';

export const actions = {
  onPinTask: action('onPinTask'),
  onArchiveTask: action('onArchiveTask'),
};

storiesOf('ProjectCard', module)
  .add('default', () => <ProjectCard {...cards[0]} />)

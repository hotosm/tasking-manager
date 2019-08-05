// src/components/Task.stories.js

import React from 'react';
import { storiesOf } from '@storybook/react';
import WebFont from 'webfontloader';
import '../../assets/styles/index.scss';
import  * as Icons from './index';


WebFont.load({
  google: {
    families: [
      'Barlow Condensed:400,600,700', 'Archivo:400,500,600,700', 'sans-serif'
    ]
  }
});

Object.keys(Icons).forEach((n, i) => {
  const NthIcon = Icons[n];
  storiesOf('Icons', module)
.add(n, () => <NthIcon/>);}
)
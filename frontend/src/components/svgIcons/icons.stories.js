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

const allIconNames = Object.keys(Icons)
const allIconsArr = Object.keys(Icons).map(n => Icons[n]);

storiesOf('Icons', module)
.add('all icons', () => <div className="">
{allIconsArr.map((EachIcon, key) => (<div class="dib ma2 ba red hover-blue-dark b--grey-light" title={allIconNames[key]}><EachIcon key={key} /></div>))}
</div>)

//add one entry for each icon
allIconNames.forEach((n, i) => {
  const NthIcon = Icons[n];
  storiesOf('Icons', module)
.add(n, () => <NthIcon/>);}
)
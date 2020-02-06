import React from 'react';
import { CheckIcon } from './svgIcons';

export const CheckCircle = ({ className }: Object) => (
  <span className={`br-100 h1 w1 ph1 mr2 ${className}`}>
    <CheckIcon height="10px" width="10px" />
  </span>
);

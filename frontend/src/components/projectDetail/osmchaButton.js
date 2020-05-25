import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { CustomButton } from '../button';
import { ExternalLinkIcon } from '../svgIcons';
import { formatOSMChaLink } from '../../utils/osmchaLink';

export const OSMChaButton = ({ project, className }: Object) => (
  <a href={formatOSMChaLink(project)} target="_blank" rel="noopener noreferrer">
    <CustomButton className={className}>
      <FormattedMessage {...messages.viewInOsmcha} />
      <ExternalLinkIcon className="pl2" />
    </CustomButton>
  </a>
);

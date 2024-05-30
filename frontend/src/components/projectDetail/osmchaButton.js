import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { CustomButton } from '../button';
import { ExternalLinkIcon } from '../svgIcons';
import { formatOSMChaLink } from '../../utils/osmchaLink';

export const OSMChaButton = ({ project, className, compact = false, children }: Object) => (
  <a href={formatOSMChaLink(project)} target="_blank" rel="noopener noreferrer">
    {children || (
      <CustomButton className={className}>
        {compact ? (
          <FormattedMessage {...messages.changesets} />
        ) : (
          <FormattedMessage {...messages.viewInOsmcha} />
        )}
        <ExternalLinkIcon className={compact ? 'pl1' : 'pl2'} />
      </CustomButton>
    )}
  </a>
);

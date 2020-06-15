import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { styleClasses } from '../../views/projectEdit';
import { InputLocale } from './inputLocale';

export const MetricsForm = ({ languages }) => {
  return (
    <div className="w-100">
      <div className={styleClasses.divClass}>
        <InputLocale languages={languages} name="qualityAssurance">
          <label className={styleClasses.labelClass}>
            <FormattedMessage {...messages.qualityAssurance} />
          </label>
        </InputLocale>
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.qualityAssuranceDescription} />
        </p>
      </div>
      <div className={styleClasses.divClass}>
        <InputLocale languages={languages} name="metrics">
          <label className={styleClasses.labelClass}>
            <FormattedMessage {...messages.metrics} />
          </label>
        </InputLocale>
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.metricsDescription} />
        </p>
      </div>
    </div>
  );
};

import React, { useContext } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { StateContext, styleClasses } from '../../views/projectEdit';
import { InputLocale } from './inputLocale';

export const InstructionsForm = ({ languages }) => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);
  const handleChange = (event) => {
    const localesFields = ['instructions', 'perTaskInstructions'];
    if (localesFields.includes(event.target.name)) {
      let localeData = projectInfo.projectInfoLocales.filter(
        (f) => f.locale === projectInfo.defaultLocale,
      )[0];
      localeData[event.target.name] = event.target.value;
      // create element with new locale.
      let newLocales = projectInfo.projectInfoLocales.filter(
        (f) => f.locale !== projectInfo.defaultLocale,
      );
      newLocales.push(localeData);
      setProjectInfo({ ...projectInfo, projectInfoLocales: newLocales });
    } else {
      setProjectInfo({ ...projectInfo, [event.target.name]: event.target.value });
    }
  };

  return (
    <div className="w-100">
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.changesetComment} />
        </label>
        <input
          className={styleClasses.inputClass}
          type="text"
          value={projectInfo.changesetComment}
          name="changesetComment"
          onChange={handleChange}
        />
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.changesetCommentDescription} />
        </p>
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.changesetCommentExample} />
        </p>
      </div>
      <div className={styleClasses.divClass}>
        <InputLocale languages={languages} name="instructions">
          <label className={styleClasses.labelClass}>
            <FormattedMessage {...messages.instructions} />*
          </label>
        </InputLocale>
      </div>
      <div className={styleClasses.divClass}>
        <InputLocale languages={languages} name="perTaskInstructions">
          <label className={styleClasses.labelClass}>
            <FormattedMessage {...messages.perTaskInstructions} />
          </label>
        </InputLocale>
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.perTaskInstructionsDescription} />
        </p>
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.perTaskInstructionsExample} />
        </p>
      </div>
    </div>
  );
};

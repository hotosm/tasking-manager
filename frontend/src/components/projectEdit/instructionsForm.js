import { useContext } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { StateContext, styleClasses } from '../../views/projectEdit';
import { InputLocale } from './inputLocale';
import { retrieveDefaultChangesetComment } from '../../utils/defaultChangesetComment';

function getTextWidth(text, font) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  context.font = font || getComputedStyle(document.body).font;

  return context.measureText(text).width;
}

export const InstructionsForm = ({ languages }) => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);
  const defaultComment = retrieveDefaultChangesetComment(
    projectInfo.changesetComment,
    projectInfo.projectId,
  )[0];
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
      setProjectInfo({
        ...projectInfo,
        [event.target.name]:
          event.target.name === 'changesetComment'
            ? `${defaultComment} ${event.target.value.trimStart()}`
            : event.target.value,
      });
    }
  };

  return (
    <div className="w-100">
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.changesetComment} />
        </label>
        <div className="relative">
          <input
            className={styleClasses.inputClass}
            type="text"
            value={projectInfo.changesetComment.split(defaultComment)[1]}
            name="changesetComment"
            onChange={handleChange}
            style={{ paddingLeft: getTextWidth(defaultComment) + 30 }}
          />
          <FormattedMessage {...messages.nonEditableComment}>
            {(msg) => (
              <span
                className="absolute db bg-tan"
                style={{ top: '9px', left: '8px', color: 'fieldtext', lineHeight: 1.15 }}
                title={msg}
              >
                {defaultComment}
              </span>
            )}
          </FormattedMessage>
        </div>
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

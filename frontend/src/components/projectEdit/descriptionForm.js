import React, { useContext } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { StateContext, styleClasses } from '../../views/projectEdit';
import { InputLocale } from './inputLocale';

export const DescriptionForm = ({ languages }) => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);

  const projectStatusOptions = [
    { value: 'PUBLISHED', label: 'PUBLISHED' },
    { value: 'ARCHIVED', label: 'ARCHIVED' },
    { value: 'DRAFT', label: 'DRAFT' },
  ];

  const projectPriorityOptions = [
    { value: 'URGENT', label: 'URGENT' },
    { value: 'HIGH', label: 'HIGH' },
    { value: 'MEDIUM', label: 'MEDIUM' },
    { value: 'LOW', label: 'LOW' },
  ];

  return (
    <div className="w-100">
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.status} />
        </label>
        {projectStatusOptions.map((option) => (
          <label className="dib pr5" key={option.value}>
            <input
              value={option.value}
              checked={projectInfo.status === option.value}
              onChange={() =>
                setProjectInfo({
                  ...projectInfo,
                  status: option.value,
                })
              }
              type="radio"
              className={`radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light`}
            />
            <FormattedMessage {...messages[`status${option.label}`]} />
          </label>
        ))}
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.priority} />
        </label>
        {projectPriorityOptions.map((option) => (
          <label className="dib pr5" key={option.value}>
            <input
              value={option.value}
              checked={projectInfo.projectPriority === option.value}
              onChange={() =>
                setProjectInfo({
                  ...projectInfo,
                  projectPriority: option.value,
                })
              }
              type="radio"
              className={`radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light`}
            />
            <FormattedMessage {...messages[`projectPriority${option.label}`]} />
          </label>
        ))}
      </div>
      <div className={styleClasses.divClass}>
        <InputLocale languages={languages} name="name" type="text" preview={false} maxLength={130}>
          <label className={styleClasses.labelClass}>
            <FormattedMessage {...messages.name} />*
          </label>
        </InputLocale>
      </div>

      <div className={styleClasses.divClass}>
        <InputLocale languages={languages} name="shortDescription" maxLength={1500}>
          <label className={styleClasses.labelClass}>
            <FormattedMessage {...messages.shortDescription} />*
          </label>
        </InputLocale>
      </div>
      <div className={styleClasses.divClass}>
        <InputLocale languages={languages} name="description">
          <label className={styleClasses.labelClass}>
            <FormattedMessage {...messages.description} />*
          </label>
        </InputLocale>
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.dueDate} />
        </label>
        <DatePicker
          selected={Date.parse(projectInfo.dueDate)}
          onChange={(date) =>
            setProjectInfo({
              ...projectInfo,
              dueDate: date,
            })
          }
          minDate={Date.parse(projectInfo.created)}
          dateFormat="dd/MM/yyyy"
          className={styleClasses.inputClass}
          showYearDropdown
          scrollableYearDropdown
        />
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.dueDateDescription} />
        </p>
      </div>
    </div>
  );
};

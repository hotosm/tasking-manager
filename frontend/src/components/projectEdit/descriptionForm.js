import React, { useContext } from 'react';

import { StateContext, styleClasses } from '../../views/projectEdit';
import { InputLocale } from './inputLocale';

export const DescriptionForm = ({ languages }) => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);

  const handleChange = event => {
    const localesFields = ['name', 'description', 'shortDescription'];
    if (localesFields.includes(event.target.name)) {
      let localeData = projectInfo.projectInfoLocales.filter(
        f => f.locale === projectInfo.defaultLocale,
      )[0];
      localeData[event.target.name] = event.target.value;
      // create element with new locale.
      let newLocales = projectInfo.projectInfoLocales.filter(
        f => f.locale !== projectInfo.defaultLocale,
      );
      newLocales.push(localeData);
      setProjectInfo({ ...projectInfo, projectInfoLocales: newLocales });
    } else {
      setProjectInfo({ ...projectInfo, [event.target.name]: event.target.value });
    }
  };

  const projectStatusFields = [
    { item: 'PUBLISHED', showItem: 'Published' },
    { item: 'ARCHIVED', showItem: 'Archived' },
    { item: 'DRAFT', showItem: 'Draft' },
  ];

  const projectPriorityFields = [
    { item: 'URGENT', showItem: 'Urgent' },
    { item: 'HIGH', showItem: 'High' },
    { item: 'MEDIUM', showItem: 'Medium' },
    { item: 'LOW', showItem: 'Low' },
  ];

  return (
    <div className="w-100">
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Status</label>
        <select name="status" onChange={handleChange} className="pa2">
          {projectStatusFields.map(f => (
            <option selected={f.item === projectInfo.status ? true : false} value={f.item}>
              {f.showItem}
            </option>
          ))}
        </select>
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Priority</label>
        <select name="projectPriority" onChange={handleChange} className="pa2">
          {projectPriorityFields.map(f => (
            <option selected={f.item === projectInfo.projectPriority ? true : false} value={f.item}>
              {f.showItem}
            </option>
          ))}
        </select>
      </div>
      <div className={styleClasses.divClass}>
        <InputLocale languages={languages} name="name" type="text" preview={false}>
          <label className={styleClasses.labelClass}>Name of the project*</label>
        </InputLocale>
      </div>
      <div className={styleClasses.divClass}>
        <InputLocale languages={languages} name="shortDescription">
          <label className={styleClasses.labelClass}>Short Description*</label>
        </InputLocale>
      </div>
      <div className={styleClasses.divClass}>
        <InputLocale languages={languages} name="description">
          <label className={styleClasses.labelClass}>Description*</label>
        </InputLocale>
      </div>
    </div>
  );
};

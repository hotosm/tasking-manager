import React, { useContext } from 'react';

import { StateContext, styleClasses } from '../../views/projectEdit';
import { InputLocale } from './inputLocale';

export const InstructionsForm = ({ languages }) => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);
  const handleChange = event => {
    const localesFields = ['instructions', 'perTaskInstructions'];
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

  return (
    <div className="w-100">
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Entities to map</label>
        <input
          className={styleClasses.inputClass}
          type="text"
          value={projectInfo.entitiesToMap}
          name="entitiesToMap"
          onChange={handleChange}
        />
        <p>The list of entities to map</p>
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Changeset comment</label>
        <input
          className={styleClasses.inputClass}
          type="text"
          value={projectInfo.changesetTags["comment"]}
          name="changesetTags"
          onChange={handleChange}
        />
        <p className={styleClasses.pClass}>
          Default comments added to uploaded changeset comment field. Users should also be
          encouraged to add text describing what they mapped. Example: #hotosm-project-470
          #missingmaps Buildings mapping. Hashtags are sometimes used for analysis later, but should
          be human informative and not overused, #group #event for example.
        </p>
      </div>
      <div className={styleClasses.divClass}>
        <InputLocale languages={languages} name="instructions">
          <label className={styleClasses.labelClass}>Detailed Instructions *</label>
        </InputLocale>
      </div>
      <div className={styleClasses.divClass}>
        <InputLocale languages={languages} name="perTaskInstructions">
          <label className={styleClasses.labelClass}>Per task instructions</label>
        </InputLocale>
        <p className={styleClasses.pClass}>
          Put here anything that can be useful to users while taking a task. {'{x}'}, {'{y}'} and{' '}
          {'{z}'}
          will be replaced by the corresponding parameters for each task. {'{x}'}, {'{y}'} and{' '}
          {'{z}'}
          parameters can only be be used on tasks generated in the Tasking Manager and not on
          imported tasks. For example: « This task involves loading extra data. Click
          [here](http://localhost:8111/import?new_layer=true&amp;url=http://www.domain.com/data/
          {'{x}'}/{'{y}'}/{'{z}'}/routes_2009.osm) to load the data into JOSM ».
        </p>
      </div>
    </div>
  );
};

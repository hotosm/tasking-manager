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
    } else if ('changesetTags' === event.target.name) {
      setProjectInfo({ ...projectInfo, [event.target.name]: convertTableToJSON(event.target.name)});
    } else {
      setProjectInfo({ ...projectInfo, [event.target.name]: event.target.value });
    }
  };

    function setAttributes(inputCell, value) {
        var input = document.createElement("input");
        inputCell.appendChild(input);
        input.setAttribute("class", styleClasses.inputClass);
        input.setAttribute("type", "text");
        input.onchange = handleChange;
        input.setAttribute("name", "changesetTags");
        input.setAttribute("value", value);
    }
    function addRow() {
        var table = document.getElementById("changesetTags");
        if (table) {
            var row = document.createElement("tr");
            for (var i = 0; i < 2; i++) {
                var cell = document.createElement("td");
                setAttributes(cell, "");
                row.appendChild(cell);
            }
            table.appendChild(row);
        }
    }

    function cleanupTable(tableId) {
        var table = document.getElementById(tableId);
        if (table) {
            for (let i = 0; i < table.children.length; i++) {
                var row = table.children[i];
                var tag = row.children[0].firstChild.value;
                var value = row.children[1].firstChild.value;
                if (!tag && !value) {
                    table.removeChild(row);
                }
            }
        }
    }

    function buildTable(tableId, jsonValue) {
        const defaultFields = ['comment'];
        cleanupTable(tableId);
        var currentJson = convertTableToJSON(tableId);
        var returnRows = [];
        for (var tag in jsonValue) {
            if (!defaultFields.includes(tag) && (tag in currentJson) === false) {
                returnRows.push(<tr><td><input className={styleClasses.inputClass} type="text" name="changesetTags" value={tag} /></td><td><input className={styleClasses.inputClass} type="text" name="changesetTags" value={jsonValue[tag]} /></td></tr>);
            }
        }
        return returnRows;
    }


    function convertTableToJSON(tableId) {
        var table = document.getElementById(tableId);
        var json = {};
        if (table) {
            for (let i = 0; i < table.children.length; i++) {
                var row = table.children[i];
                var tag = row.children[0].firstChild.value;
                var value = row.children[1].firstChild.value;
                if (tag && value) {
                    json[tag] = value;
                }
            }
        }
        return json;
    }

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
        <label className={styleClasses.labelClass}>Changeset Tags</label>
        <table>
          <thead>
            <tr>
              <th>Tag</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody id="changesetTags" name="changesetTags" onChange={handleChange}>
            <tr>
              <td>
                <input
                  className={styleClasses.inputClass}
                  type="text"
                  value="comment"
                  name="changesetTags"
                  onChange={handleChange}
                  readonly="readonly"
                 />
               </td>
              <td>
                <input
                  className={styleClasses.inputClass}
                  type="text"
                  value={projectInfo.changesetTags["comment"]}
                  name="changesetTags"
                  onChange={handleChange}
                  />
              </td>
            </tr>
            { buildTable("changesetTags", projectInfo.changesetTags) }
          </tbody>
        </table>
        <button type="button" onClick={addRow}>Add row</button>
        <p className={styleClasses.pClass}>
          Common tags include "comment" and "source" tags. These can usually be changed when the user uploads data.
        </p>
        <p className={styleClasses.pClass}>
          Users should also be encouraged to add text describing what they mapped, expanding upon the provided comment.
          Example: #hotosm-project-470
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

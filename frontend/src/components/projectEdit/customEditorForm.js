import React, {useContext} from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import {StateContext, styleClasses} from '../../views/projectEdit';
import { Button } from '../button';

// AH: Inconsistent whitespace with two other files.

export const CustomEditorForm = ({ languages }) => { // AH: languages isn't being used
    const { projectInfo, setProjectInfo } = useContext(StateContext);

    const handleChange = event => {
        var value = val => event.target.type === 'checkbox' ? event.target.checked : event.target.value; // AH: Does not need to be a function, should be a const. Consider changing name to something more descriptive.
        var customEditor = {...projectInfo.customEditor, [event.target.name]: value()}; // AH: Should be a const, can put the value ternary directly here
        setProjectInfo({...projectInfo, customEditor: customEditor}); // AH: Nit: customEditor does not need to be repeated
    };

    const handleRemove = event => {
        setProjectInfo({...projectInfo, customEditor: null});
    };

    return (
        <div className="w-100">
            <div className={styleClasses.divClass}>
                <label className={styleClasses.labelClass}>
                    <FormattedMessage {...messages.customEditorName} />*
                </label>
                <input
                className={styleClasses.inputClass}
                onChange={handleChange}
                name="name"
                type="text"
                value={projectInfo.customEditor ? projectInfo.customEditor.name : ''}
                />  
            </div>
            <div className={styleClasses.divClass}>
                <label className={styleClasses.labelClass}>
                    <FormattedMessage {...messages.customEditorDescription} />*
                </label>
                <textarea 
                className={styleClasses.inputClass}
                onChange={handleChange}
                rows={styleClasses.numRows}
                name="description" 
                type="text"
                value={projectInfo.customEditor ? projectInfo.customEditor.description : ''}
                />
            </div>
            <div className={styleClasses.divClass}>
                <label className={styleClasses.labelClass}>
                    <FormattedMessage {...messages.customEditorUrl} />*
                </label>
                <input
                className={styleClasses.inputClass}
                onChange={handleChange}
                type="text"
                name="url"
                value={projectInfo.customEditor ? projectInfo.customEditor.url : ''}
                />
            </div>
             <div className={styleClasses.divClass}>
                <label className="db pv2">
                    <input
                    className="mr2"
                    name="enabled"
                    onChange={handleChange}
                    type="checkbox"
                    checked={projectInfo.customEditor ? projectInfo.customEditor.enabled : false}
                    />
                    <FormattedMessage {...messages.customEditorEnabled} />
                </label>
            </div>
            { projectInfo.customEditor &&
                <div className={styleClasses.divClass}>
                    <label className={styleClasses.labelClass}>
                    <FormattedMessage {...messages.deleteCustomEditor} />
                    </label>
                    <p className={styleClasses.pClass}>
                        <FormattedMessage {...messages.confirmDeleteCustomEditor} />
                    </p>
                    <Button className={styleClasses.actionClass} onClick={handleRemove}>
                        <FormattedMessage {...messages.removeCustomEditor} />
                    </Button>
                </div>
            }
        </div>
    );
};

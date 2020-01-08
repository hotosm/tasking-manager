import React, { useContext } from 'react';

import { getEditors } from '../../utils/editorsList';
import { StateContext, styleClasses, handleCheckButton } from '../../views/projectEdit';

export const SettingsForm = ({ languages, defaultLocale }) => {
	const { projectInfo, setProjectInfo } = useContext(StateContext);

	const handleMappingEditors = event => {
		let editors = projectInfo.mappingEditors;
		editors = handleCheckButton(event, editors);
		setProjectInfo({ ...projectInfo, mappingEditors: editors });
	};

	const handleValidationEditors = event => {
		let editors = projectInfo.validationEditors;
		editors = handleCheckButton(event, editors);
		setProjectInfo({ ...projectInfo, validationEditors: editors });
	};

	const updateDefaultLocale = event => {
		setProjectInfo({ ...projectInfo, defaultLocale: event.target.value });
	};

	const editors = getEditors();
	return (
		<div className="w-100">
			<div className={styleClasses.divClass}>
				<label className={styleClasses.labelClass}>Default Language</label>
				<select name="defaultLocale" onChange={updateDefaultLocale} className="pa2">
					{languages.map(l => (
						<option selected={l.code === defaultLocale ? true : false} value={l.code}>
							{l.language} ({l.code})
						</option>
					))}
				</select>
			</div>
			<div className={styleClasses.divClass}>
				<label className={styleClasses.labelClass}>Editors for mapping</label>
				{editors.map(elm => (
					<label className="db pv2">
						<input
							className="mr2"
							name="mapping_editors"
							onChange={handleMappingEditors}
							checked={projectInfo.mappingEditors.includes(elm.value)}
							type="checkbox"
							value={elm.value}
						/>
						{elm.label}
					</label>
				))}
			</div>
			<div className={styleClasses.divClass}>
				<label className={styleClasses.labelClass}>Editors for validation</label>
				{editors.map(elm => (
					<label className="db pv2">
						<input
							className="mr2"
							name="validation_editors"
							onChange={handleValidationEditors}
							checked={projectInfo.validationEditors.includes(elm.value)}
							type="checkbox"
							value={elm.value}
						/>
						{elm.label}
					</label>
				))}
			</div>
			<div className={styleClasses.divClass}>
				<label className={styleClasses.labelClass}>Enforce Random Task Selection</label>
				<label className={styleClasses.pClass}>
					<input
						className="mr2"
						onChange={() =>
							setProjectInfo({
								...projectInfo,
								enforceRandomTaskSelection: !projectInfo.enforceRandomTaskSelection,
							})
						}
						type="checkbox"
						value={projectInfo.enforceRandomTaskSelection}
						name="enforceRandomTaskSelection"
					/>
					Enforce random task selection on mapping
				</label>
				<p className={styleClasses.pClass}>
					If checked, users must edit tasks at random for the initial editing stage (project
					managers and admins are exempt).
				</p>
			</div>
		</div>
	);
};

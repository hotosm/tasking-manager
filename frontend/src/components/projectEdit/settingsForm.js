import React, { useContext } from 'react';
import { StateContext, styleClasses, handleCheckButton } from '../../views/projectEdit';

export const SettingsForm = () => {
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

	const editors = [
		{ showItem: 'ID Editor', item: 'ID' },
		{ showItem: 'Josm', item: 'JOSM' },
		{ showItem: 'Potlatch 2', item: 'POTLATCH_2' },
		{ showItem: 'Field Papers', item: 'FIELD_PAPERS' },
	];
	return (
		<div className="w-100">
			<div className={styleClasses.divClass}>
				<label className={styleClasses.labelClass}>Editors for mapping</label>
				{editors.map(elm => (
					<label className="db pv2">
						<input
							className="mr2"
							name="mapping_editors"
							onChange={handleMappingEditors}
							checked={projectInfo.mappingEditors.includes(elm.item)}
							type="checkbox"
							value={elm.item}
						/>
						{elm.showItem}
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
							checked={projectInfo.validationEditors.includes(elm.item)}
							type="checkbox"
							value={elm.item}
						/>
						{elm.showItem}
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

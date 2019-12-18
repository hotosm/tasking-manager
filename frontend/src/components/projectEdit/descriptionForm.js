import React, { useContext } from 'react';

import { StateContext, styleClasses } from '../../views/projectEdit';

export const DescriptionForm = () => {
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
				<label className={styleClasses.labelClass}>Name of the project*</label>
				<input
					className={styleClasses.inputClass}
					type="text"
					value={projectInfo.projectInfoLocales[0].name}
					name="name"
					onChange={handleChange}
				/>
			</div>
			<div className={styleClasses.divClass}>
				<label className={styleClasses.labelClass}>Short Description*</label>
				<textarea
					className={styleClasses.inputClass}
					rows={styleClasses.numRows}
					type="text"
					name="shortDescription"
					value={projectInfo.projectInfoLocales[0].shortDescription}
					onChange={handleChange}
				></textarea>
			</div>
			<div className={styleClasses.divClass}>
				<label className={styleClasses.labelClass}>Description*</label>
				<textarea
					className={styleClasses.inputClass}
					rows={styleClasses.numRows}
					type="text"
					name="description"
					value={projectInfo.projectInfoLocales[0].description}
					onChange={handleChange}
				></textarea>
			</div>
		</div>
	);
};

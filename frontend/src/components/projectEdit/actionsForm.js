import React, { useState } from 'react';
import { styleClasses } from '../../views/projectEdit';
import { API_URL } from '../../config';
import Popup from 'reactjs-popup';
import { navigate } from '@reach/router';

const checkError = (error, modal) => {
	let successMessage = '';
	let errorMessage = '';

	switch (modal) {
		case 'MESSAGE_CONTRIBUTORS':
			successMessage = 'Contributors were messaged successfully.';
			errorMessage = 'Failed to message all contributors for an unknown reason.';
			break;
		case 'MAP_ALL_TASKS':
			successMessage = 'The tasks were mapped successfully.';
			errorMessage = 'Mapping all the tasks failed for an unknown reason.';
			break;
		case 'INVALIDATE_ALL_TASKS':
			successMessage = 'The tasks were invalidated successfully.';
			errorMessage = 'Invalidating all the tasks failed for an unknown reason.';
			break;
		case 'VALIDATE_ALL_TASKS':
			successMessage = 'The tasks were validated successfully.';
			errorMessage = 'Validating all the tasks failed for an unknown reason.';
			break;
		case 'RESET_BAD_IMAGERY':
			successMessage = 'The tasks were reset successfully.';
			errorMessage = 'Resetting all the bad imagery tasks failed for an unknown reason.';
			break;
		case 'RESET_ALL':
			successMessage = 'The tasks were reset successfully.';
			errorMessage = 'Resetting all the tasks failed for an unknown reason.';
			break;
		case 'TRANSFER_PROJECT':
			successMessage = 'The project was transfered successfully.';
			errorMessage = 'The project was not transfered successfully.';
			break;
		case 'DELETE_PROJECT':
			successMessage = 'The project was deleted successfully.';
			errorMessage =
				'The project was not deleted successfully. This project might have some contributions.';
			break;
		default:
			return null;
	}
	if (error === null) {
		return null;
	}

	if (error === false) {
		return <p className="pv2 white tc bg-dark-green">{successMessage}</p>;
	} else {
		return <p className="pv2 white tc bg-light-red">{errorMessage}</p>;
	}
};

const ResetTasksModal = ({ projectId, close, token }) => {
	const [error, setError] = useState(null);

	const fn = async () => {
		const url = `${API_URL}projects/${projectId}/tasks/actions/reset-all/`;
		const res = await fetch(url, { method: 'POST', headers: { Authorization: `Token ${token}` } });
		if (res.status !== 200) {
			setError(true);
		} else {
			setError(false);
		}
	};

	const handlerButton = e => {
		fn();
	};

	return (
		<div className={styleClasses.modalClass}>
			<h2 className={styleClasses.modalTitleClass}>Task reset</h2>

			<p className={styleClasses.pClass + ' pb3'}>
				Are you sure you want to reset all tasks? You cannot undo this.
			</p>

			{checkError(error, 'RESET_ALL')}
			<button className={styleClasses.drawButtonClass + ' mr2'} onClick={handlerButton}>
				reset all tasks
			</button>
			<button className={styleClasses.deleteButtonClass} onClick={close}>
				cancel
			</button>
		</div>
	);
};

const DeleteProjectModal = ({ projectId, close, token }) => {
	const [error, setError] = useState(null);

	const fn = async () => {
		const url = `${API_URL}projects/${projectId}/`;
		const res = await fetch(url, {
			method: 'DELETE',
			headers: { Authorization: `Token ${token}` },
		});
		if (res.status !== 200) {
			setError(true);
		} else {
			setError(false);
		}
	};

	const handlerButton = e => {
		fn();
	};

	// Redirect on success.
	if (error === false) {
		setTimeout(() => (window.location.href = '/explore'), 3000);
	}

	return (
		<div className={styleClasses.modalClass}>
			<h2 className={styleClasses.modalTitleClass}>Delete Project</h2>

			<p className={styleClasses.pClass + ' pb3'}>
				Are you sure you want to delete this project? You cannot undo deleting a project.
			</p>

			{checkError(error, 'DELETE_PROJECT')}
			<button className={styleClasses.drawButtonClass + ' mr2'} onClick={handlerButton}>
				delete project
			</button>
			<button className={styleClasses.deleteButtonClass} onClick={close}>
				cancel
			</button>
		</div>
	);
};

const ResetBadImageryModal = ({ projectId, close, token }) => {
	const [error, setError] = useState(null);

	const fn = async () => {
		const url = `${API_URL}projects/${projectId}/tasks/actions/reset-all-badimagery/`;
		const res = await fetch(url, { method: 'POST', headers: { Authorization: `Token ${token}` } });
		if (res.status !== 200) {
			setError(true);
		} else {
			setError(false);
		}
	};

	const handlerButton = e => {
		fn();
	};

	return (
		<div className={styleClasses.modalClass}>
			<h2 className={styleClasses.modalTitleClass}>Reset Bad Imagery Tasks</h2>

			<p className={styleClasses.pClass + ' pb3'}>
				Are you sure you want to mark all bad imagery tasks in this project as ready? You cannot
				undo this.
			</p>
			<p className={styleClasses.pClass + ' pb5 mt4'}>
				This will mark all bad imagery tasks as ready. Please use this only if you are sure of what
				you are doing.
			</p>

			{checkError(error, 'RESET_BAD_IMAGERY')}
			<button className={styleClasses.drawButtonClass + ' mr2'} onClick={handlerButton}>
				reset all bad imagery tasks
			</button>
			<button className={styleClasses.deleteButtonClass} onClick={close}>
				cancel
			</button>
		</div>
	);
};

const ValidateAllTasksModal = ({ projectId, close, token }) => {
	const [error, setError] = useState(null);

	const fn = async () => {
		const url = `${API_URL}projects/${projectId}/tasks/actions/validate-all/`;
		const res = await fetch(url, { method: 'POST', headers: { Authorization: `Token ${token}` } });
		if (res.status !== 200) {
			setError(true);
		} else {
			setError(false);
		}
	};

	const handlerButton = e => {
		fn();
	};

	return (
		<div className={styleClasses.modalClass}>
			<h2 className={styleClasses.modalTitleClass}>Task validation</h2>

			<p className={styleClasses.pClass + ' pb3'}>
				Are you sure you want to validate all tasks? You cannot undo this.
			</p>
			<p className={styleClasses.pClass + ' pb5 mt4'}>
				This will mark all tasks (except bad imagery) as valid. Please use this only if you are sure
				of what you are doing.
			</p>

			{checkError(error, 'VALIDATE_ALL_TASKS')}
			<button className={styleClasses.drawButtonClass + ' mr2'} onClick={handlerButton}>
				validate all tasks
			</button>
			<button className={styleClasses.deleteButtonClass} onClick={close}>
				cancel
			</button>
		</div>
	);
};

const InvalidateAllTasksModal = ({ projectId, close, token }) => {
	const [error, setError] = useState(null);

	const fn = async () => {
		const url = `${API_URL}projects/${projectId}/tasks/actions/invalidate-all/`;
		const res = await fetch(url, { method: 'POST', headers: { Authorization: `Token ${token}` } });
		if (res.status !== 200) {
			setError(true);
		} else {
			setError(false);
		}
	};

	const handlerButton = e => {
		fn();
	};

	return (
		<div className={styleClasses.modalClass}>
			<h2 className={styleClasses.modalTitleClass}>Task Invalidation</h2>

			<p className={styleClasses.pClass + ' pb3'}>
				Are you sure you want to invalidate all tasks in this project? You cannot undo this.
			</p>
			<p className={styleClasses.pClass + ' pb5 mt4'}>
				This will mark all tasks (except non completed and bad imagery tasks) as invalid. Please use
				this only if you are sure of what you are doing.
			</p>

			{checkError(error, 'INVALIDATE_ALL_TASKS')}
			<button className={styleClasses.drawButtonClass + ' mr2'} onClick={handlerButton}>
				Invalidate all tasks
			</button>
			<button className={styleClasses.deleteButtonClass} onClick={close}>
				cancel
			</button>
		</div>
	);
};

const MapAllTasksModal = ({ projectId, close, token }) => {
	const [error, setError] = useState(null);

	const fn = async () => {
		const url = `${API_URL}projects/${projectId}/tasks/actions/map-all/`;
		const res = await fetch(url, { method: 'POST', headers: { Authorization: `Token ${token}` } });
		if (res.status !== 200) {
			setError(true);
		} else {
			setError(false);
		}
	};

	const handlerButton = e => {
		fn();
	};

	return (
		<div className={styleClasses.modalClass}>
			<h2 className={styleClasses.modalTitleClass}>Task Mapping</h2>
			<p className={styleClasses.pClass + ' pb3'}>
				Are you sure you want to mark all tasks in this project as mapped? You cannot undo this.
			</p>
			<p className={styleClasses.pClass + ' pb5 mt4'}>
				This will mark all tasks (except bad imagery tasks) as mapped. Please use this only if you
				are sure of what you are doing.
			</p>
			{checkError(error, 'MAP_ALL_TASKS')}
			<button className={styleClasses.drawButtonClass + ' mr2'} onClick={handlerButton}>
				map all tasks
			</button>
			<button className={styleClasses.deleteButtonClass} onClick={close}>
				cancel
			</button>
		</div>
	);
};

const MessageContributorsModal = ({ projectId, close, token }) => {
	const [error, setError] = useState(null);
	const [data, setData] = useState({ message: '', subject: '' });

	const fn = async () => {
		const url = `${API_URL}projects/${projectId}/actions/message-contributors/`;
		const res = await fetch(url, {
			method: 'POST',
			body: JSON.stringify(data),
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Token ${token}`,
			},
		});
		if (res.status !== 200) {
			setError(true);
		} else {
			setError(false);
		}
	};

	const handleChange = e => {
		setData({ ...data, [e.target.name]: e.target.value });
	};

	const handlerButton = e => {
		fn();
	};

	return (
		<div className={styleClasses.modalClass}>
			<h2 className={styleClasses.modalTitleClass}>Message all contributors</h2>

			<p className={styleClasses.pClass + ' pb3'}>
				This will send a Tasking Manager message to every contributor of the current project. Please
				use this feature carefully.
			</p>
			<input
				value={data.subject}
				onChange={handleChange}
				name="subject"
				className="db w-50 center pv1 mb3"
				type="text"
				placeholder="Subject *"
			/>
			<input
				value={data.message}
				onChange={handleChange}
				name="message"
				className="w-50 center h2"
				type="textarea"
				placeholder="Message *"
				rows="4"
			/>

			<p className={styleClasses.pClass + ' pb5 mt4'}>
				This message is not translated to the selected language of the user, so you may want to
				include your own translations.
			</p>
			{checkError(error, 'MESSAGE_CONTRIBUTORS')}
			<button className={styleClasses.drawButtonClass + ' mr2'} onClick={handlerButton}>
				message all contributors
			</button>
			<button className={styleClasses.deleteButtonClass} onClick={close}>
				cancel
			</button>
		</div>
	);
};

const TransferProject = ({ projectId, token }) => {
	const [error, setError] = useState(null);
	const [username, setUsername] = useState('');
	const [users, setUsers] = useState([]);
	const handleUsers = e => {
		const fetchUsers = async user => {
			const res = await fetch(`${API_URL}users/queries/filter/${user}`);
			if (res.status === 200) {
				const res_json = await res.json();
				setUsers(res_json.usernames);
			} else {
				setUsers([]);
			}
		};

		const user = e.target.value;
		setUsername(user);
		fetchUsers(user);
	};

	const fn = async () => {
		const url = `${API_URL}projects/${projectId}/actions/transfer-ownership/`;

		const res = await fetch(url, {
			method: 'POST',
			body: JSON.stringify({ username: username }),
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Token ${token}`,
			},
		});
		if (res.status !== 200) {
			setError(true);
		} else {
			setError(false);
		}
	};

	const handlerButton = e => {
		fn();
	};

	// Redirect on success.
	if (error === false) {
		setTimeout(() => (window.location.href = '/explore'), 3000);
	}

	return (
		<div>
			<Popup
				contentStyle={{ padding: 0, border: 0 }}
				arrow={false}
				trigger={
					<input
						className={styleClasses.inputClass.replace('80', '40') + ' pv2 fl'}
						type="text"
						value={username}
						name="transferuser"
						onChange={handleUsers}
					/>
				}
				on="focus"
				position="bottom left"
				open={users.length !== 0 ? true : false}
			>
				<div>
					{users.map(u => (
						<span
							onClick={() => {
								setUsername(u);
								setUsers([]);
							}}
						>
							{u}
						</span>
					))}
				</div>
			</Popup>
			<button onClick={handlerButton} className={styleClasses.actionClass}>
				transfer project
			</button>
			{checkError(error, 'TRANSFER_PROJECT')}
		</div>
	);
};

export const ActionsForm = ({ projectId, token }) => {
	const modalStyle = {
		width: '100%',
		height: '100%',
		textAlign: 'center',
		opacity: '0.95',
	};

	return (
		<div className="w-100">
			<div className={styleClasses.divClass}>
				<label className={styleClasses.labelClass}>Message all contributors</label>
				<Popup
					trigger={<button className={styleClasses.actionClass}>Message all contributors</button>}
					contentStyle={modalStyle}
					modal
					closeOnDocumentClick
				>
					{close => <MessageContributorsModal projectId={projectId} close={close} token={token} />}
				</Popup>
			</div>
			<div className={styleClasses.divClass}>
				<label className={styleClasses.labelClass}>Mapping, Validation and Invalidation</label>
				<p className={styleClasses.pClass}>
					Use this if for some reason you need to map, validate or invalidate all tasks in this
					project in a single step.
				</p>
				<p className={styleClasses.pClass}>
					<b>Warning:</b> This cannot be undone.
				</p>
				<Popup
					trigger={<button className={styleClasses.actionClass}>map all tasks</button>}
					contentStyle={modalStyle}
					modal
					closeOnDocumentClick
				>
					{close => <MapAllTasksModal projectId={projectId} close={close} token={token} />}
				</Popup>
				<Popup
					trigger={<button className={styleClasses.actionClass}>invalidate all tasks</button>}
					contentStyle={modalStyle}
					modal
					closeOnDocumentClick
				>
					{close => <InvalidateAllTasksModal projectId={projectId} close={close} token={token} />}
				</Popup>
				<Popup
					trigger={<button className={styleClasses.actionClass}>validate all tasks</button>}
					contentStyle={modalStyle}
					modal
					closeOnDocumentClick
				>
					{close => <ValidateAllTasksModal projectId={projectId} close={close} token={token} />}
				</Popup>
				<Popup
					trigger={
						<button className={styleClasses.actionClass}>reset all bad imagery tasks</button>
					}
					contentStyle={modalStyle}
					modal
					closeOnDocumentClick
				>
					{close => <ResetBadImageryModal projectId={projectId} close={close} token={token} />}
				</Popup>
			</div>
			<div className={styleClasses.divClass}>
				<label className={styleClasses.labelClass}>Delete project</label>
				<p className={styleClasses.pClass}>You can only delete projects with no contributions.</p>
				<p className={styleClasses.pClass}>
					<b>Warning:</b> This cannot be undone.
				</p>
				<Popup
					trigger={<button className={styleClasses.actionClass}>delete project</button>}
					contentStyle={modalStyle}
					modal
					closeOnDocumentClick
				>
					{close => <DeleteProjectModal projectId={projectId} close={close} token={token} />}
				</Popup>
			</div>
			<div className={styleClasses.divClass}>
				<label className={styleClasses.labelClass}>Transfer project</label>
				<p className={styleClasses.pClass}>
					<b>Warning:</b> This cannot be undone.
				</p>
				<TransferProject projectId={projectId} token={token} />
			</div>
			<div className={styleClasses.divClass}>
				<label className={styleClasses.labelClass}>Reset Tasks</label>
				<p className={styleClasses.pClass}>
					Reset all tasks in the project to ready to map, preserving history.
				</p>
				<p className={styleClasses.pClass}>
					<b>Warning:</b> This cannot be undone.
				</p>
				<Popup
					trigger={<button className={styleClasses.actionClass}>reset tasks</button>}
					contentStyle={modalStyle}
					modal
					closeOnDocumentClick
				>
					{close => <ResetTasksModal projectId={projectId} close={close} token={token} />}
				</Popup>
			</div>
			<div className={styleClasses.divClass}>
				<label className={styleClasses.labelClass}>Clone Project</label>
				<p className={styleClasses.pClass}>
					This will clone all descriptions, instructions, metadata etc. The Area of Interest, the
					tasks and the priority areas will not be cloned. You will have to redraw/import these.
					Your newly cloned project will be in draft status.
				</p>
				<button
					onClick={() => navigate(`/manage/projects/new/${projectId}/`)}
					className={styleClasses.actionClass}
				>
					clone project
				</button>
			</div>
		</div>
	);
};

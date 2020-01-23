import React, { useContext, useState } from 'react';
import Popup from 'reactjs-popup';
import { StateContext, styleClasses } from '../../views/projectEdit';
import { TeamSelect } from './teamSelect';
import { API_URL } from '../../config';

export const PermissionsForm = () => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);
  const [users, setUsers] = useState([]);
  const [searchUser, setsearchUser] = useState('');

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
    setsearchUser(user);
    fetchUsers(user);
  };

  const appendUser = user => {
    let selectedUsers = projectInfo.allowedUsernames;
    if (selectedUsers.includes(user) === false) {
      selectedUsers.push(user);
      setProjectInfo({ ...projectInfo, allowedUsernames: selectedUsers });
    }
    setsearchUser('');
    setUsers([]);
  };

  const removeUser = user => {
    let selectedUsers = projectInfo.allowedUsernames;
    selectedUsers = selectedUsers.filter(u => u !== user);

    setProjectInfo({ ...projectInfo, allowedUsernames: selectedUsers });
    setsearchUser('');
    setUsers([]);
  };

  return (
    <div className="w-100">
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Mappers</label>
        <label className={styleClasses.pClass}>
          {' '}
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
          />{' '}
          Only mappers with experience level BEGINNER or higher can map{' '}
        </label>
        <p className={styleClasses.pClass}>
          If checked, only users with the listed mapper experience level will be able to contribute
          to this project. If unchecked, anyone can contribute. Go to the Metadata panel to change
          the mapper experience level for this project.
        </p>
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Validators</label>
        <label className={styleClasses.pClass}>
          <input
            className="mr2"
            onChange={() =>
              setProjectInfo({
                ...projectInfo,
                restrictValidationRole: !projectInfo.restrictValidationRole,
              })
            }
            type="checkbox"
            name="restrictValidationRole"
            value={projectInfo.restrictValidationRole}
          />
          Require users to be validators
        </label>
        <p className={styleClasses.pClass}>
          If checked, only users with the Validator role will be able to validate tasks in this
          project. If unchecked, anyone can validate or invalidate tasks.
        </p>

        <label className={styleClasses.pClass}>
          <input
            className="mr2"
            onChange={() =>
              setProjectInfo({
                ...projectInfo,
                restrictValidationLevelIntermediate: !projectInfo.restrictValidationLevelIntermediate,
              })
            }
            type="checkbox"
            name="restrictValidationLevelIntermediate"
            value={projectInfo.restrictValidationLevelIntermediate}
          />
          Require experience level INTERMEDIATE or ADVANCED
        </label>
        <p className={styleClasses.pClass}>
          If checked, only users with the experience level of Intermediate and Advanced will be able
          to validate tasks in this project.
        </p>
      </div>
      <div className={styleClasses.divClass.replace('w-70', 'w-90')}>
        <label className={styleClasses.labelClass}>Teams</label>
        <TeamSelect />
      </div>

      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Private project</label>
        <label className={styleClasses.pClass}>
          <input
            className="mr2"
            onChange={() => setProjectInfo({ ...projectInfo, private: !projectInfo.private })}
            type="checkbox"
            name="Private"
            value={projectInfo.private}
          />
          Private
        </label>
        <p className={styleClasses.pClass}>
          Private means that only the given list of users below can access this project. Before a
          user name can be added to the Allowed Users list the user must first login to this
          installation of OSM Tasking Manager.
        </p>
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Allowed users on private project</label>
        {projectInfo.allowedUsernames ? (
          <div>
            <p className="f7">
              <b>Note.</b>Click to remove
            </p>
            <ul className="list pa0 dib mv1">
              {projectInfo.allowedUsernames.map(u => (
                <li onClick={() => removeUser(u)} className="ph3 pv2 mb2 dib white bg-navy fl mr2 ">
                  {u}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Popup
          contentStyle={{ padding: 0, border: 0 }}
          arrow={false}
          trigger={
            <input value={searchUser} onChange={handleUsers} className="w-50 pa2" type="text" />
          }
          on="focus"
          position="bottom left"
          open={users.length !== 0 ? true : false}
        >
          <div>
            {users.map(u => (
              <span onClick={() => appendUser(u)}>{u}</span>
            ))}
          </div>
        </Popup>
      </div>
    </div>
  );
};

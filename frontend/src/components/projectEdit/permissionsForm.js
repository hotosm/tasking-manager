import React, { useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Popup from 'reactjs-popup';
import Select from 'react-select';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { SwitchToggle } from '../formInputs';
import { StateContext, styleClasses } from '../../views/projectEdit';
import { TeamSelect } from './teamSelect';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { API_URL } from '../../config';

export const PermissionsForm = () => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);
  const [users, setUsers] = useState([]);
  const [searchUser, setsearchUser] = useState('');
  const userDetails = useSelector(state => state.auth.get('userDetails'));
  const [organisations, setOrganisations] = useState([]);
  useEffect(() => {
    if (userDetails && userDetails.id) {
      const query = userDetails.role === 'ADMIN' ? '' : `?manager_user_id=${userDetails.id}`;
      fetchLocalJSONAPI(`organisations/${query}`)
        .then(result => setOrganisations(result.organisations))
        .catch(e => console.log(e));
    }
  }, [userDetails]);

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
        <SwitchToggle
          label={'Only mappers with experience level BEGINNER or higher can map'}
          labelPosition="right"
          isChecked={projectInfo.restrictMappingLevelToProject}
          onChange={() =>
            setProjectInfo({
              ...projectInfo,
              restrictMappingLevelToProject: !projectInfo.restrictMappingLevelToProject,
            })
          }
        />
        <p className={styleClasses.pClass}>
          If checked, only users with the listed mapper experience level will be able to contribute
          to this project. If unchecked, anyone can contribute. Go to the Metadata panel to change
          the mapper experience level for this project.
        </p>
      </div>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Validators</label>
        <SwitchToggle
          label={'Only users with validator role or higher'}
          labelPosition="right"
          isChecked={projectInfo.restrictValidationRole}
          onChange={() =>
            setProjectInfo({
              ...projectInfo,
              restrictValidationRole: !projectInfo.restrictValidationRole,
            })
          }
        />
        <p className={`styleClasses.pClass pb2`}>
          If checked, only users with the Validator or a higher role will be able to validate tasks
          in this project. If unchecked, anyone can validate or invalidate tasks.
        </p>

        <label className={styleClasses.pClass}>
          <SwitchToggle
            label={'Require experience level INTERMEDIATE or ADVANCED'}
            labelPosition="right"
            isChecked={projectInfo.restrictValidationLevelIntermediate}
            onChange={() =>
              setProjectInfo({
                ...projectInfo,
                restrictValidationLevelIntermediate: !projectInfo.restrictValidationLevelIntermediate,
              })
            }
          />
        </label>
        <p className={styleClasses.pClass}>
          If checked, only users with the experience level of Intermediate and Advanced will be able
          to validate tasks in this project.
        </p>
      </div>

      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Organisation</label>
        <p className={styleClasses.pClass}>
          Organisation that is coordinating the project, if there is any. The managers of that
          organisation will have administration rights over the project.
        </p>
        <Select
          isClearable={false}
          getOptionLabel={option => option.name}
          getOptionValue={option => option.organisationId}
          options={organisations}
          defaultValue={
            projectInfo.organisation && {
              name: projectInfo.organisationName,
              value: projectInfo.organisation,
            }
          }
          placeholder={<FormattedMessage {...messages.selectOrganisation} />}
          onChange={value =>
            setProjectInfo({ ...projectInfo, organisation: value.organisationId || '' })
          }
          className="z-5"
        />
      </div>

      <div className={styleClasses.divClass.replace('w-70', 'w-90')}>
        <label className={styleClasses.labelClass}>Teams</label>
        <TeamSelect />
      </div>

      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>Privacy</label>
        <SwitchToggle
          label={'Private project'}
          labelPosition="right"
          isChecked={projectInfo.private}
          onChange={() => setProjectInfo({ ...projectInfo, private: !projectInfo.private })}
        />

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

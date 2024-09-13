import { useContext } from 'react';
import { FormattedMessage } from 'react-intl';
import messages from './messages.js';
import { StateContext, styleClasses } from '../../views/projectEdit';

export const PermissionsBlock = ({ permissions, type }: Object) => {
  const { projectInfo, setProjectInfo } = useContext(StateContext);

  return (
    <div className={styleClasses.divClass}>
      <label className={styleClasses.labelClass}>
        {type === 'mappingPermission' ? (
          <FormattedMessage {...messages.mappingPermission} />
        ) : (
          <FormattedMessage {...messages.validationPermission} />
        )}
      </label>
      <p className={styleClasses.pClass}>
        {type === 'mappingPermission' ? (
          <FormattedMessage {...messages.mappingPermissionDescription} />
        ) : (
          <FormattedMessage {...messages.validationPermissionDescription} />
        )}
      </p>
      {permissions.map((permission) => (
        <label className="db pv2" key={permission.label.props.id}>
          <input
            value={permission.value}
            checked={projectInfo[type] === permission.value}
            onChange={() =>
              setProjectInfo({
                ...projectInfo,
                [type]: permission.value,
              })
            }
            type="radio"
            className={`radio-input input-reset pointer v-mid dib h2 w2 mr2 br-100 ba b--blue-light`}
          />
          {permission.label}
        </label>
      ))}
    </div>
  );
};

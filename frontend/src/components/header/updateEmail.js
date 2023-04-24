import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { func } from 'prop-types';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { updateUserEmail } from '../../store/actions/auth';
import { PROFILE_RELEVANT_FIELDS } from '../user/forms/personalInformation';
import { ORG_PRIVACY_POLICY_URL } from '../../config';
import { Button } from '../button';

export const UpdateEmail = ({ closeModal }) => {
  const dispatch = useDispatch();

  const userDetails = useSelector((state) => state.auth.userDetails);
  const token = useSelector((state) => state.auth.token);
  const [userState, setUserState] = useState({ email: '', success: false, details: '' });

  const onChange = (e) => {
    setUserState({ ...userState, [e.target.name]: e.target.value });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    let userData = userDetails;
    userData.emailAddress = userState.email;
    dispatch(updateUserEmail(userData, token, PROFILE_RELEVANT_FIELDS.concat(['id'])));
    setUserState({
      ...userState,
      success: true,
      details: <FormattedMessage {...messages.emailUpdateSuccess} />,
    });
    closeModal();
  };

  return (
    <div className="tl pa4 bg-white">
      <h1 className="pb2 ma0 barlow-condensed blue-dark">
        <FormattedMessage {...messages.emailUpdateTitle} />
      </h1>
      <p className="blue-dark lh-copy">
        <FormattedMessage {...messages.emailUpdateTextPart1} />
      </p>
      <p className="blue-dark lh-copy">
        <FormattedMessage {...messages.emailUpdateTextPart2} />
      </p>
      <form onSubmit={onSubmit}>
        <p>
          <FormattedMessage {...messages.emailPlaceholder}>
            {(msg) => {
              return (
                <input
                  className="pa2 w-60-l w-100"
                  type="email"
                  name="email"
                  placeholder={msg}
                  onChange={onChange}
                  value={userState.email}
                />
              );
            }}
          </FormattedMessage>
        </p>
        <Button className="bg-red white" type="submit">
          <FormattedMessage {...messages.emailUpdateButton} />
        </Button>
        {ORG_PRIVACY_POLICY_URL && (
          <p className="mb0">
            <a
              className="link pointer red fw5"
              target="_blank"
              rel="noopener noreferrer"
              href={`${ORG_PRIVACY_POLICY_URL}`}
            >
              <FormattedMessage {...messages.privacyPolicy} />
            </a>
          </p>
        )}
        <p className={userState.details ? 'dib mb0' : 'dn'}>{userState.details}</p>
      </form>
    </div>
  );
};

UpdateEmail.propTypes = {
  closeModal: func.isRequired,
};

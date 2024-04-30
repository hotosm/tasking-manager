import { setItem } from '../../utils/safe_storage';
import { postNewUser } from '../../network/user';
import { types } from './auth';

export const registerUser = (postData) => (dispatch) => {
  return postNewUser(postData).then((res) => {
    if (res.success === true) {
      setItem('userId', res.id);
    }

    dispatch({
      type: types.REGISTER_USER,
      payload: res,
    });

    return res;
  });
};

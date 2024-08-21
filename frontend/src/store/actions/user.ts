import { setItem } from '../../utils/safe_storage';
import { postNewUser } from '../../network/user';
import { types } from './auth';
import { Dispatch } from 'redux';

export const registerUser = (postData: unknown) => async (dispatch: Dispatch) => {
  return await postNewUser(postData).then((res) => {
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

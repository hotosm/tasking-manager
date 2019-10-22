import * as safeStorage from '../../utils/safe_storage';
import { postNewUser } from '../../network/user';
import { types } from '../actions/auth';

export const registerUser = postData => dispatch => {
  let response = postNewUser(postData).then(res => {
  	if (res.success === true) {
		  safeStorage.setItem('userId', res.id)
  	}

    dispatch({
      type: types.REGISTER_USER,
      payload: res
    })

    return res 
  })

  return response
};

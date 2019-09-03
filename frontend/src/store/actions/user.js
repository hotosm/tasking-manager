import * as safeStorage from '../../utils/safe_storage';
import { postNewUser } from '../../network/user';
import { types } from '../actions/auth';

export const registerUser = postData => dispatch => {
  //let userId = registerUser(postData)
  let userId = 1
  safeStorage.setItem('userId', userId)

  dispatch({
    type: types.REGISTER_USER,
    payload: postData
  })
};
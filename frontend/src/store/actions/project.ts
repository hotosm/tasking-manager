import { Dispatch } from "redux";

export const types = {
  CREATE_PROJECT: 'CREATE_PROJECT',
  SET_ID: 'SET_ID',
} as const;

export const createProject = (params: any) => (dispatch: Dispatch) => {
  const dispatch_params = {
    type: types.CREATE_PROJECT,
    params: params,
  };
  dispatch(dispatch_params);

  // Fetch request with project Params.
};

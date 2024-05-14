export const types = {
  CREATE_PROJECT: 'CREATE_PROJECT',
  SET_ID: 'SET_ID',
};

export const createProject = (params) => (dispatch) => {
  const dispatch_params = {
    type: types.CREATE_PROJECT,
    params: params,
  };
  dispatch(dispatch_params);

  // Fetch request with project Params.
};

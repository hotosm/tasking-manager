export const types = {
  SET_LOADER: 'SET_LOADER',
};

export function setLoader(isLoading) {
  return {
    type: types.SET_LOADER,
    isLoading: isLoading,
  };
}

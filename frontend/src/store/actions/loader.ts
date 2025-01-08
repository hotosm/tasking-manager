export const types = {
  SET_LOADER: 'SET_LOADER',
} as const;

export function setLoader(isLoading: boolean) {
  return {
    type: types.SET_LOADER,
    isLoading: isLoading,
  };
}

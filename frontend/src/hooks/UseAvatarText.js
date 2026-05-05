export const useAvatarText = (name, username, number) => {
  if (name) {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substr(0, 3);
  }
  if (number) {
    return number;
  }
  if (username) {
    return username
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substr(0, 3);
  }
  return '';
};

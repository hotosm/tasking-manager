export const useAvatarStyle = (size, editMode, picture) => {
  let sizeClasses = 'h2 w2 f5';
  if (size === 'large') {
    sizeClasses = 'h3 w3 f2';
  } else if (size === 'small') {
    sizeClasses = 'f6';
  } else if (size === 'medium' || !size) {
    sizeClasses = 'user-picture-medium f5';
  }

  let textPadding = {};
  if (size === 'large') {
    textPadding = editMode ? { top: '-0.5rem' } : { paddingTop: '0.625rem' };
  } else if (size === 'small') {
    textPadding = editMode ? { top: '-0.5rem' } : { paddingTop: '0.225rem' };
  } else if (size === 'medium' || !size) {
    textPadding = editMode ? { top: '-0.75rem' } : { paddingTop: '0.375rem' };
  }

  let closeIconStyle = { left: '0.4rem' };
  if (size === 'large') {
    closeIconStyle = { marginLeft: '3rem' };
  } else if (size === 'small') {
    closeIconStyle = { marginLeft: '0' };
  } else if (size === 'medium' || !size) {
    closeIconStyle = { left: '0.4rem' };
  }

  let sizeStyle = {};
  if (size === 'small') {
    sizeStyle = { height: '1.5rem', width: '1.5rem' };
    if (picture) sizeStyle.backgroundImage = `url("${picture}")`;
  } else {
    sizeStyle = picture ? { backgroundImage: `url("${picture}")` } : {};
  }

  return { sizeClasses, textPadding, closeIconStyle, sizeStyle };
};

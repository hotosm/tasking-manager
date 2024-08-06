import { useState, useEffect } from 'react';

export const useAvatarStyle = (size, editMode, picture) => {
  const [sizeClasses, setSizeClasses] = useState('h2 w2 f5');
  const [textPadding, setTextPadding] = useState({});
  const [sizeStyle, setSizeStyle] = useState({});
  const [closeIconStyle, setCloseIconStyle] = useState({ left: '0.4rem' });

  useEffect(() => {
    if (size === 'large') setSizeClasses('h3 w3 f2');
    if (size === 'small') setSizeClasses('f6');
    if (size === 'medium' || !size) setSizeClasses('user-picture-medium f5');
  }, [size]);
  useEffect(() => {
    if (size === 'large')
      setTextPadding(editMode ? { top: '-0.5rem' } : { paddingTop: '0.625rem' });
    if (size === 'small')
      setTextPadding(editMode ? { top: '-0.5rem' } : { paddingTop: '0.225rem' });
    if (size === 'medium' || !size)
      setTextPadding(editMode ? { top: '-0.75rem' } : { paddingTop: '0.375rem' });
  }, [size, editMode]);
  useEffect(() => {
    if (size === 'large') setCloseIconStyle({ marginLeft: '3rem' });
    if (size === 'small') setCloseIconStyle({ marginLeft: '0' });
    if (size === 'medium' || !size) setCloseIconStyle({ left: '0.4rem' });
  }, [size]);
  useEffect(() => {
    if (size === 'small') {
      const smallStyle = { height: '1.5rem', width: '1.5rem' };
      if (picture) smallStyle.backgroundImage = `url("${picture}")`;
      setSizeStyle(smallStyle);
    } else {
      setSizeStyle(picture ? { backgroundImage: `url("${picture}")` } : {});
    }
  }, [picture, size]);
  return { sizeClasses, textPadding, closeIconStyle, sizeStyle };
};

import React from 'react';
import { useSelector } from 'react-redux';

import { ProfilePictureIcon } from '../svgIcons'

export const UserAvatar = props => {
  const userPicture = useSelector(
    state => state.auth.getIn(['userDetails', 'pictureUrl'])
  );
  if (userPicture) {
    return <img {...props} src={userPicture} alt={'user avatar'} />;
  }
  return <ProfilePictureIcon {...props} />;
};

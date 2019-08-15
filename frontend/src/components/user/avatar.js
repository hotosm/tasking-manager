import React from 'react';
import { useSelector } from 'react-redux';

import profilePic from '../../assets/img/user.jpg';

export const UserAvatar = props => {
  const userPicture = useSelector(state => state.auth.get('userPicture'));
  if (userPicture) {
    return <img {...props} src={userPicture} alt={'user avatar'} />;
  }
  return <img {...props} src={profilePic} alt={'user avatar'} />;
};

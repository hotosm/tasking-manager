import React from 'react';
import { useSelector } from 'react-redux';

import { ProfilePictureIcon, CloseIcon } from '../svgIcons';
import { useFetch } from '../../hooks/UseFetch';

export const CurrentUserAvatar = props => {
  const userPicture = useSelector(state => state.auth.getIn(['userDetails', 'pictureUrl']));
  if (userPicture) {
    return <img {...props} src={userPicture} alt={'user avatar'} />;
  }
  return <ProfilePictureIcon {...props} />;
};

/* Specifying the avatar picture URL is most efficient, 
but it will be lookedup from the username if it is not available */
export const UserAvatar = ({name, username, picture, size, colorClasses, removeFn, editMode}: Object) => {
  let sizeClasses = 'h2 w2 f5';
  let textPadding = editMode ? {top: "-0.75rem"} : {paddingTop: "0.375rem"};
  let sizeStyles = {}; 
  let closeIconStyle = {left: "0.4rem"};
  /* only trigger loading user profile if picture prop is null */
  const [pictureLookupError, pictureLookupLoading, pictureLookup] = useFetch(
    `users/queries/${username}/`,
    picture === null,
  );
   
  if(size === 'large') {
    closeIconStyle = {marginLeft: "3rem"};
    sizeClasses = 'h3 w3 f2';
    textPadding = editMode ? {top: "-0.5rem"} : {paddingTop: "0.625rem"};
  }

  if(size === 'small') {
    closeIconStyle = {marginLeft: "0"};
    sizeClasses = 'f6';
    sizeStyles = {'height': '1.5rem',
                   'width': '1.5rem'};
    textPadding = editMode ? {top: "-0.5rem"} : {paddingTop: "0.225rem"};
  }

  let letters;
  if (name) {
    letters = name.split(' ').map(word => word[0]).join('');
  } else {
    letters = username.split(' ').map(word => word[0]).join('');
  }
  const pictureLookupSuccess = !pictureLookupError && !pictureLookupLoading && pictureLookup && pictureLookup.pictureUrl;

  return <div title={username} style={sizeStyles} className={`dib mh1 br-100 tc v-mid ${colorClasses} ${sizeClasses}`}>
    {removeFn && editMode &&
      <div
        className="relative top-0 z-1 fr br-100 f7 tc h1 w1 bg-red white pointer"
        style={closeIconStyle}
        onClick={() => removeFn(username)}
      >
        <CloseIcon className="pt1"/>
      </div>
    }
        {picture || pictureLookupSuccess ? (
        <img
          className={`tc br-100 dib v-mid ${sizeClasses} ${editMode ? 'relative top--1' : ''}`}
          src={picture || (pictureLookup && pictureLookup.pictureUrl)}
          alt={name || username}
        />
      ) : (
        <span className="relative tc w-100 dib ttu dib barlow-condensed v-mid" style={textPadding}>
          {letters.substr(0, 3)}
        </span>
      )}
  </div>;
};

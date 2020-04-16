import React from 'react';
import { Link } from '@reach/router';
import { useSelector } from 'react-redux';

import { ProfilePictureIcon, CloseIcon } from '../svgIcons';
import { getRandomArrayItem } from '../../utils/random';

export const CurrentUserAvatar = (props) => {
  const userPicture = useSelector((state) => state.auth.getIn(['userDetails', 'pictureUrl']));
  if (userPicture) {
    return (
      <div
        {...props}
        style={{ backgroundImage: `url(${userPicture})`, backgroundSize: 'cover' }}
        alt={'user avatar'}
      />
    );
  }
  return <ProfilePictureIcon {...props} />;
};

export const UserAvatar = ({
  name,
  username,
  number,
  picture,
  size,
  colorClasses,
  removeFn,
  editMode,
  disableLink = false,
}: Object) => {
  let sizeClasses = 'h2 w2 f5';
  let textPadding = editMode ? { top: '-0.75rem' } : { paddingTop: '0.375rem' };
  let sizeStyles = {};
  let closeIconStyle = { left: '0.4rem' };

  if (size === 'large') {
    closeIconStyle = { marginLeft: '3rem' };
    sizeClasses = 'h3 w3 f2';
    textPadding = editMode ? { top: '-0.5rem' } : { paddingTop: '0.625rem' };
  }

  if (size === 'small') {
    closeIconStyle = { marginLeft: '0' };
    sizeClasses = 'f6';
    sizeStyles = { height: '1.5rem', width: '1.5rem' };
    textPadding = editMode ? { top: '-0.5rem' } : { paddingTop: '0.225rem' };
  }

  let letters;
  if (name) {
    letters = name
      .split(' ')
      .map((word) => word[0])
      .join('');
  } else if (number) {
    letters = number;
  } else {
    letters = username
      .split(' ')
      .map((word) => word[0])
      .join('');
  }
  if (picture) sizeStyles.backgroundImage = `url(${picture})`;

  const avatar = (
    <div
      title={username}
      style={sizeStyles}
      className={`dib mh1 br-100 tc v-mid cover ${colorClasses} ${sizeClasses}`}
    >
      {removeFn && editMode && (
        <div
          className="relative top-0 z-1 fr br-100 f7 tc h1 w1 bg-red white pointer"
          style={closeIconStyle}
          onClick={() => removeFn(username)}
        >
          <CloseIcon className="pt1" />
        </div>
      )}
      {!picture && (
        <span className="relative tc w-100 dib ttu dib barlow-condensed v-mid" style={textPadding}>
          {letters.substr(0, 3)}
        </span>
      )}
    </div>
  );

  if ((removeFn && editMode) || disableLink) {
    return avatar;
  } else {
    return <Link to={`/users/${username}`}>{avatar}</Link>;
  }
};

export const UserAvatarList = ({
  users,
  maxLength,
  textColor = 'white',
  bgColor,
  size,
}: Object) => {
  const getColor = () =>
    bgColor ? bgColor : getRandomArrayItem(['bg-orange', 'bg-red', 'bg-blue-dark', 'bg-blue-grey']);
  let marginLeft = '-1.25rem';
  if (size === 'large') {
    marginLeft = '-1.5rem';
  }
  if (size === 'small') {
    marginLeft = '-0.875rem';
  }

  return (
    <>
      {users.slice(0, maxLength ? maxLength : users.length).map((user, n) => (
        <div style={{ marginLeft: n === 0 ? '' : marginLeft }} className="dib" key={n}>
          <UserAvatar
            username={user.username}
            picture={user.pictureUrl}
            size={size}
            colorClasses={`${textColor} ${getColor()}`}
          />
        </div>
      ))}
      {maxLength && users.length - maxLength > 0 && (
        <div style={{ marginLeft: '-1.5rem' }} className="dib">
          <UserAvatar
            number={`+${users.length - maxLength > 999 ? 999 : users.length - maxLength}`}
            size={size}
            colorClasses={`blue-dark bg-grey-light`}
            disableLink={true}
          />
        </div>
      )}
    </>
  );
};

import { useState, useEffect } from 'react';

export const useAvatarText = (name, username, number) => {
  const [text, setText] = useState('');
  useEffect(() => {
    if (name) {
      setText(
        name
          .split(' ')
          .map((word) => word[0])
          .join('')
          .substr(0, 3),
      );
    } else if (number) {
      setText(number);
    } else {
      setText(
        username
          .split(' ')
          .map((word) => word[0])
          .join('')
          .substr(0, 3),
      );
    }
  }, [name, number, username]);
  return text;
};

import { useState } from 'react';

export const useModifyMembers = (initialMembers) => {
  const [members, setMembers] = useState(initialMembers);

  const addMember = (values) => {
    const newValues = values.filter(
      (newUser) => !members.map((i) => i.username).includes(newUser.username),
    );
    setMembers(members.concat(newValues));
  };

  const removeMember = (username) => {
    setMembers(members.filter((i) => i.username !== username));
  };

  return {
    members,
    setMembers,
    addMember,
    removeMember,
  };
};

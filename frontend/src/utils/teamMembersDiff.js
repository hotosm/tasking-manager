export function getMembersDiff(oldMembers, newMembers, managers = false) {
  let filterFn;
  if (managers) {
    filterFn = filterActiveManagers;
  } else {
    filterFn = filterActiveMembers;
  }
  const oldUsernames = filterFn(oldMembers).map((i) => i.username);
  const newUsernames = filterFn(newMembers).map((i) => i.username);
  const added = newUsernames.filter((i) => !oldUsernames.includes(i));
  const removed = oldUsernames.filter((i) => !newUsernames.includes(i));

  return { usersAdded: added, usersRemoved: removed };
}

export function filterActiveMembers(members) {
  return members.filter((member) => member.function === 'MEMBER').filter((member) => member.active);
}

export function filterActiveManagers(members) {
  return members
    .filter((member) => member.function === 'MANAGER')
    .filter((member) => member.active);
}

export function filterInactiveMembersAndManagers(members) {
  return members.filter((member) => !member.active);
}

export function formatMemberObject(user, manager = false) {
  return {
    username: user.username,
    pictureUrl: user.pictureUrl,
    function: manager ? 'MANAGER' : 'MEMBER',
    active: true,
  };
}

export const filterOSMTeamsMembers = (members, moderators) => {
  const managersIds = moderators.map((user) => user.osm_id);
  const managers = members.filter((user) => managersIds.includes(user.id));
  members = members.filter((user) => !managersIds.includes(user.id));
  return { managers, members };
}
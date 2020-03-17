import React from 'react';
import { FormattedTimeParts, FormattedRelativeTime } from 'react-intl';
import { selectUnit } from '@formatjs/intl-utils';

export function TaskLockTimer({ tasks }: Object) {
  
  const unlockTime = new Date(tasks[0].lastUpdated).getTime() + (tasks[0].autoUnlockSeconds * 1000);
  const timeToUnlock = Math.abs(new Date(unlockTime) - new Date());
  console.log(unlockTime);
  console.log(timeToUnlock);

  return (
    <>

    </>
  );
}

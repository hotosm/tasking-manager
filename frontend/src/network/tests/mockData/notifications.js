export function generateSampleNotifications(numSamples) {
  const sampleData = [];

  for (let i = 0; i < numSamples; i++) {
    const messageId = Math.floor(Math.random() * 1000000);
    const subject = `Sample subject ${i}  <a href="https://tasks-stage.hotosm.org/manage/teams/19/">Sample Team</a>`;
    const message = `Sample message ${i} <a href="https://example.com">Example.com</a>`;
    const fromUsername = `User${i}`;
    const displayPictureUrl = `https://www.example.com/avatar${i}.jpg`;
    const messageType =
      i % 3 === 0
        ? 'REQUEST_TEAM_NOTIFICATION'
        : i % 3 === 1
        ? 'INVITATION_NOTIFICATION'
        : 'TEAM_BROADCAST';
    const sentDate = new Date().toISOString();
    const read = i % 3 !== 0;

    let projectId = null;
    let projectTitle = null;
    let taskId = null;

    if (i % 2 === 0) {
      projectId = Math.floor(Math.random() * 1000);
      projectTitle = `Sample Project ${projectId}`;
    } else {
      taskId = Math.floor(Math.random() * 1000);
    }

    const sample = {
      messageId,
      subject,
      message,
      fromUsername,
      displayPictureUrl,
      projectId,
      projectTitle,
      taskId,
      messageType,
      sentDate,
      read,
    };

    sampleData.push(sample);
  }

  return sampleData;
}

export const ownCountUnread = {
  newMessages: true,
  unread: 2,
};

export const notifications = {
  pagination: {
    hasNext: true,
    hasPrev: false,
    nextNum: 2,
    page: 1,
    pages: 21,
    prevNum: null,
    perPage: 10,
    total: 208,
  },
  userMessages: generateSampleNotifications(10),
};

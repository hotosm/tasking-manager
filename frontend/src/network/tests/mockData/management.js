export const licenses = {
  licenses: [
    {
      licenseId: 1,
      name: 'License 1',
      description:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s",
      plainText:
        'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old.',
    },
    {
      licenseId: 2,
      name: 'License Second',
      description:
        'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab',
      plainText:
        "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable.",
    },
  ],
};

export const license = {
  licenseId: 1,
  name: 'Sample License',
  description: 'Sample license description for sample license',
  plainText: 'Sample license plainText for sample description for sample license',
};

export const licenseCreationSuccess = {
  licenseId: 123,
};

export const licenseDeletionSuccess = {
  Success: 'License deleted',
};

export const campaigns = {
  campaigns: [
    {
      id: 1,
      name: 'Campaign Name 1',
    },
    {
      id: 2,
      name: 'Campaign Name Two',
    },
    {
      id: 3,
      name: 'Campaign Name Tres',
    },
  ],
};

export const campaign = {
  id: 123,
  name: 'Campaign Name 123',
};

export const campaignCreationSuccess = {
  campaignId: 123,
};

export const campaignUpdationSuccess = {
  Success: 'Campaign 123 updated',
};

export const campaignDeletionSuccess = {
  Success: 'Campaign deleted',
};

export const licenseAccepted = {
  Success: 'Terms Accepted',
};

export const interests = {
  interests: [
    {
      id: 1,
      name: 'Interest Name 1',
    },
    {
      id: 2,
      name: 'Interest Name Two',
    },
    {
      id: 3,
      name: 'Interest Name Tres',
    },
  ],
};

export const interest = {
  id: 123,
  name: 'Interest Name 123',
};

export const interestCreationSuccess = (name) => ({
  id: 123,
  name,
});

export const interestUpdationSuccess = (name) => ({
  id: 123,
  name,
});

export const interestDeletionSuccess = {
  Success: 'Interest deleted',
};

export const organisations = {
  organisations: [
    {
      organisationId: 1,
      managers: [
        {
          username: 'Giblet',
          pictureUrl:
            'https://www.gravatar.com/avatar/2e07ea6b8cfa68531397f18ccbe8a9af.jpg?s=100&d=https%3A%2F%2Fwww.openstreetmap.org%2Fassets%2Favatar_large-54d681ddaf47c4181b05dbfae378dc0201b393bbad3ff0e68143c3d5f3880ace.png',
        },
      ],
      name: 'American Red Cross',
      slug: 'american-red-cross',
      logo: 'https://cdn.hotosm.org/tasking-manager/uploads/1588662943162_American-Red-Cross-Logo.png',
      description: null,
      url: null,
      isManager: null,
      teams: null,
      campaigns: null,
      type: 'FULL_FEE',
      subscriptionTier: 2,
    },
    {
      organisationId: 123,
      managers: [
        {
          username: 'User Manager',
          pictureUrl:
            'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBMkkwQ0E9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--6db7ae9875c642a40cc49b6c17f7653c80f72abb/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBTU0lKYW5CbFp3WTZCa1ZVT2hSeVpYTnBlbVZmZEc5ZmJHbHRhWFJiQjJscGFXaz0iLCJleHAiOm51bGwsInB1ciI6InZhcmlhdGlvbiJ9fQ==--49342fc3b37f3c5c2ea7f489eb6f0b78e8c2bd4c/manoj.png',
        },
      ],
      name: 'Organisation Name 123',
      slug: 'organisation-name-123',
      logo: 'https://cdn.hotosm.org/tasking-manager/uploads/1652896455106_main-logo.png',
      description: null,
      url: null,
      isManager: false,
      teams: [
        {
          teamId: 9,
          name: 'Notification Test',
          description: 'hello',
          joinMethod: 'BY_REQUEST',
          visibility: 'PUBLIC',
          members: [
            {
              username: 'Aadesh Baral',
              pictureUrl:
                'https://www.openstreetmap.org/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBNXFHQ1E9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--aed68fa4deb4e4eeba02e233b68881c4c9d84ab8/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBTU0lJYW5CbkJqb0dSVlE2RkhKbGMybDZaVjkwYjE5c2FXMXBkRnNIYVdscGFRPT0iLCJleHAiOm51bGwsInB1ciI6InZhcmlhdGlvbiJ9fQ==--1d22b8d446683a272d1a9ff04340453ca7c374b4/89986176_1424302844399685_1705928282320404480_n.jpg',
              function: 'MANAGER',
              active: true,
            },
          ],
        },
      ],
      campaigns: null,
      type: 'FREE',
      subscriptionTier: null,
    },
  ],
};

export const organisation = organisations.organisations[1];

export const organisationCreationSuccess = {
  organisationId: 123,
};

export const organisationUpdationSuccess = {
  Status: 'Updated',
};

export const organisationDeletionSuccess = {
  Success: 'Organisation deleted',
};

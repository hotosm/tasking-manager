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

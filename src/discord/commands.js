export const commands = [
  {
    name: 'signin',
    description: 'Sign in with your email to link your account.',
    options: [
      {
        name: 'email',
        description: 'Your account email',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'whoami',
    description: 'Show your linked Firestore user ID.',
  },
  {
    name: 'getuserid',
    description: 'Returns User Id',
  },
];

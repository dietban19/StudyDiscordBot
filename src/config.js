import dotenv from 'dotenv';
dotenv.config();

const required = (value, name) => {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
};

export const TZ = 'America/Edmonton';
export const FOUR_HOURLY_MINUTE = parseInt(
  process.env.FOUR_HOURLY_MINUTE || '5',
  10,
);
export const HOURLY_MINUTE = parseInt(process.env.HOURLY_MINUTE || '10', 10);

export const DISCORD = {
  TOKEN: required(process.env.DISCORD_TOKEN, 'DISCORD_TOKEN'),
  CHANNEL_ID: required(process.env.DISCORD_CHANNEL_ID, 'DISCORD_CHANNEL_ID'),
};

export const FIREBASE = {
  PROJECT_ID: required(process.env.FIREBASE_PROJECT_ID, 'FIREBASE_PROJECT_ID'),
  CLIENT_EMAIL: required(
    process.env.FIREBASE_CLIENT_EMAIL,
    'FIREBASE_CLIENT_EMAIL',
  ),
  PRIVATE_KEY: required(
    process.env.FIREBASE_PRIVATE_KEY,
    'FIREBASE_PRIVATE_KEY',
  ).replace(/\\n/g, '\n'),
};

export const HTTP = {
  PORT: parseInt(process.env.PORT || '5000', 10),
};

// export const UPDATE_LINK = 'https://studytrackerbydiets.netlify.app/';
export const UPDATE_LINK = 'http://localhost:5173/';

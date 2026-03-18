import { Account, Client, Databases, Functions, ID, Query } from 'appwrite';

const client = new Client();

client
    .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);

export const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
export const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID!;
export const FUNCTION_ID = process.env.EXPO_PUBLIC_APPWRITE_FUNCTION_ID ?? 'estimate-calories';
export const GOALS_FUNCTION_ID = process.env.EXPO_PUBLIC_APPWRITE_GOALS_FUNCTION_ID ?? 'calculate-goals';

export { ID, Query, client };
export default client;

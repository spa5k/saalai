export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/user-service',
  },
  api: {
    randomUser: {
      baseUrl: 'https://randomuser.me/api/',
      requestsPerSecond: 5,
      sleepTime: 30000, // 30 seconds
      batchSize: 300,
      batchSleep: 5000, // 5 seconds between batches
    },
  },
  pagination: {
    defaultLimit: 10,
    defaultPage: 1,
    defaultSortBy: 'createdAt',
  },
}; 
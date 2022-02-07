const response = require('./mock/mockGoogleNearbyResponse.json');

export const getNearbyRestaurants = () => {
  return JSON.stringify(response);
}
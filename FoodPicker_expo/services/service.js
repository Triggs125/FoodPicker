const response = require('./mock/mockGoogleNearbyResponse.json');

export const getNearbyRestaurants = (searchText) => {
  return new Promise((resolve) => {
    resolve(response.results);
  });
}
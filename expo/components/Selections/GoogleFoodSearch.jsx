import { Component } from "react";
import { View } from "react-native";
import { SearchBar } from 'react-native-elements';
import Constants from 'expo-constants';
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { PLACE_DETAILS_API_KEY } from "../../config";

class GoogleFoodSearch extends Component {
  constructor(props) {
    super(props);

    this.state = {
      googleSearchText: ""
    }

    this.submit = this.submit.bind(this);
  }

  submit() {
    const { googleSearchText } = this.state;
    if (googleSearchText.trim(' ').length > 0) {
      this.props.googleSearchText(googleSearchText);
    }
  }

  setFoodData(data, details) {
    console.log("Food Data:", data)
    console.log("Food Details:", details)
  }

  render() {
    console.log("Google Food Search");
    const { lobbyData } = this.props.route.params;
    return (
      <GooglePlacesAutocomplete
        placeholder="Search Food"
        onPress={(data, details = null) => this.setFoodData(data, details)}
        query={{
          key: PLACE_DETAILS_API_KEY,
          language: 'en',
          types: 'establishment',
          location: lobbyData.location,
          radius: Math.round(lobbyData.distance * 1609.344)
        }}
        nearbyPlacesAPI='GooglePlacesSearch'
        isCurrentLocation
        isPredefinedPlace
        fetchDetails={true}
        GooglePlacesSearchQuery={{ type: 'restaurant' }}
        filterReverseGeocodingByTypes={['food']}
      />
    )
  }
}

export default GoogleFoodSearch;
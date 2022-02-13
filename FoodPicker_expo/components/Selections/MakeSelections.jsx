import { Component } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { Card, Icon, Input, Text } from 'react-native-elements';
import { HeaderHeightContext } from '@react-navigation/elements';

import FoodProfile from "../FoodProfile/FoodProfile";
import GoogleFoodSearch from "./GoogleFoodSearch";
import FoodChoices from "./FoodChoices";
import FoodPageNavigation from "./FoodPageNavigation";
import LoadingSpinner from "../LoadingSpinner";

class MakeSelections extends Component {

  constructor(props) {
    super(props);

    this.state = {
      screenHeight: Dimensions.get('window').height,
      selectedFoodProfile: undefined,
      googleSearchText: "",
      selectedFoodChoices: [],
      foodChoices: [],
      choicesPageIndex: 0,
      nextPageToken: undefined,
      tokenPage: -1,
      loading: true,
    }

    this.setSelectedFoodProfile = this.setSelectedFoodProfile.bind(this);
    this.setGoogleSearchText = this.setGoogleSearchText.bind(this);
    this.setChoices = this.setChoices.bind(this);
    this.addFoodChoice = this.addFoodChoice.bind(this);
    this.removeFoodChoice = this.removeFoodChoice.bind(this);
    this.nextChoicesPage = this.nextChoicesPage.bind(this);
    this.lastChoicesPage = this.lastChoicesPage.bind(this);
  }

  componentDidMount() {
    this.componentFocusUnsub = this.props.navigation.addListener('focus', () => {
      this.fetchNearestPlacesFromGoogle();
    });
  }

  componentWillUnmount() {
    this.componentFocusUnsub && this.componentFocusUnsub();
  }

  setSelectedFoodProfile(selectedFoodProfile) {
    this.setState({ selectedFoodProfile });
  }

  setGoogleSearchText(googleSearchText) {
    this.setState({ googleSearchText, choicesPageIndex: 0 });
  }

  setChoices(foodChoices) {
    this.setState({ foodChoices });
  }

  addFoodChoice(foodChoice) {
    const { selectedFoodChoices } = this.state;
    let newFoodChoices = selectedFoodChoices;
    newFoodChoices.push(foodChoice);
    this.setState({ selectedFoodChoices: newFoodChoices })
  }

  removeFoodChoice(foodChoice) {
    const { selectedFoodChoices } = this.state;
    let newFoodChoices = selectedFoodChoices;
    newFoodChoices = newFoodChoices.filter(choice => foodChoice.place_id !== choice.place_id);
    this.setState({ selectedFoodChoices: newFoodChoices });
  }

  nextChoicesPage() {
    const { choicesPageIndex, foodChoices } = this.state;
    if (choicesPageIndex < Math.ceil(foodChoices.length / 2) - 1) {
      this.setState({ choicesPageIndex: choicesPageIndex + 1 });
    } else {
      this.setState({ choicesPageIndex: 0 });
    }
  }

  lastChoicesPage() {
    const { choicesPageIndex, foodChoices } = this.state;
    if (choicesPageIndex !== 0) {
      this.setState({ choicesPageIndex: choicesPageIndex - 1 });
    } else {
      this.setState({ choicesPageIndex: Math.ceil(foodChoices.length / 2) - 1 });
    }
  }

  fetchNearestPlacesFromGoogle() {
    const { lobbyData } = this.props.route.params;
    
    const latitude = lobbyData.location.latitude;
    const longitude = lobbyData.location.longitude;
    const radius = Math.round(lobbyData.distance * 1609.344);
    const types = 'restaurant';
    const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?'
      + 'location=' + latitude + ',' + longitude
      + '&radius=' + radius
      + '&type=' + types
      // + '&keyword=restaurant'
      + '&key=' + 'AIzaSyABLEWTpgnHhloYv_JH301853XGEhVDpMc';
    
    this.setState({ loading: true });

    fetch(url)
      .then(res => {
        return res.json();
      })
      .then(res => {
        var places = []
        const GooglePicBaseUrl = `https://maps.googleapis.com/maps/api/place/photo?key=AIzaSyB1q8bz0Sr14VhwhwKaUiinzUHZmwtj9oo&maxwidth=400&photo_reference=`;
        for(let googlePlace of res.results) {
          var place = {};
          var lat = googlePlace.geometry.location.lat;
          var lng = googlePlace.geometry.location.lng;
          var coordinate = {
            latitude: lat,
            longitude: lng,
          };

          var gallery = [];
          if (googlePlace.photos) {
            for(let photo of googlePlace.photos) {
              var photoUrl = GooglePicBaseUrl + photo.photo_reference;
              gallery.push(photoUrl);
            }
          }

          place['types'] = googlePlace.types;
          place['coordinate'] = coordinate;
          place['id'] = googlePlace.place_id;
          place['name'] = googlePlace.name;
          place['rating'] = googlePlace.rating;
          place['priceLevel'] = googlePlace.price_level;
          place['types'] = googlePlace.types;
          place['vicinity'] = googlePlace.vicinity;
          place['userRatingsTotal'] = googlePlace.user_ratings_total;
          place['photos'] = gallery;

          places.push(place);
        }
        this.setChoices(places, res.next_page_token);
        this.setState({ loading: false })
      })
      .catch(error => {
        console.error("FoodChoices::fetchNearestPlacesFromGoogle", error);
        this.setState({ loading: false });
      });
  }

  render() {
    const {
      screenHeight,
      googleSearchText,
      choicesPageIndex,
      selectedFoodChoices,
      nextPageToken,
      foodChoices,
      loading
    } = this.state;

    const { lobbyData } = this.props.route.params;

    return (
      <HeaderHeightContext.Consumer>
        {headerHeight => (
          <ScrollView style={{ height: screenHeight, paddingHorizontal: 10 }} contentContainerStyle={{ height: screenHeight - headerHeight, display: 'flex', justifyContent: 'space-between' }}>
            <FoodProfile
              {...this.props}
              selectedFoodProfile={this.setSelectedFoodProfile}
            />
            {/* <GoogleFoodSearch
              {...this.props}
              googleSearchText={this.setGoogleSearchText}
            /> */}
            {
              loading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <FoodChoices
                    {...this.props}
                    googleSearchText={googleSearchText}
                    removeFoodChoice={this.removeFoodChoice}
                    addFoodChoice={this.addFoodChoice}
                    choicesPageIndex={choicesPageIndex}
                    setChoices={this.setChoices}
                    nextPageToken={nextPageToken}
                    foodChoices={foodChoices}
                    lobbyData={lobbyData}
                  />
                  <View style={{ justifyContent: 'space-between', flexDirection: 'row', marginTop: -8 }}>
                    <Text style={{ paddingLeft: 12 }}>**Select up to 4</Text>
                    <Text style={{ paddingRight: 12 }}>Hold down card for more details**</Text>
                  </View>
                </>
              )
            }
            <FoodPageNavigation
              {...this.props}
              nextChoicesPage={this.nextChoicesPage}
              lastChoicesPage={this.lastChoicesPage}
              selectedFoodChoices={selectedFoodChoices}
            />
          </ScrollView>
        )}
      </HeaderHeightContext.Consumer>
      
    )
  }
}

export default MakeSelections;
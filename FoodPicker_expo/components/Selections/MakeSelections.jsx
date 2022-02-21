import { Component } from "react";
import { Dimensions, ScrollView, View } from "react-native";
import { Card, Icon, Input, Text } from 'react-native-elements';
import { HeaderHeightContext } from '@react-navigation/elements';
// import FoodProfile from "../FoodProfile/FoodProfile";
// import GoogleFoodSearch from "./GoogleFoodSearch";
import FoodChoices from "./FoodChoices";
import FoodPageNavigation from "./FoodPageNavigation";
import LoadingSpinner from "../LoadingSpinner";
import Constants from 'expo-constants';
import { getDoc, doc } from "firebase/firestore";

class MakeSelections extends Component {
  constructor(props) {
    super(props);
    const offset = Constants.platform.android ? 35 : 0;
    const screenHeight = Dimensions.get('screen').height - offset;
    const maxNumberOfSelections = 5

    this.state = {
      screenHeight: screenHeight,
      selectedFoodProfile: undefined,
      googleSearchText: "",
      selectedFoodChoices: [],
      foodChoices: [],
      choicesPageIndex: 0,
      nextPageToken: undefined,
      tokenPage: -1,
      loading: true,
      maxNumberOfSelections: maxNumberOfSelections,
    }

    this.setSelectedFoodProfile = this.setSelectedFoodProfile.bind(this);
    this.setGoogleSearchText = this.setGoogleSearchText.bind(this);
    this.setChoices = this.setChoices.bind(this);
    this.addFoodChoice = this.addFoodChoice.bind(this);
    this.removeFoodChoice = this.removeFoodChoice.bind(this);
    this.nextChoicesPage = this.nextChoicesPage.bind(this);
    this.lastChoicesPage = this.lastChoicesPage.bind(this);
    this.clearSelections = this.clearSelections.bind(this);
    this.getUserFoodSelections = this.getUserFoodSelections.bind(this);
  }

  componentDidMount() {
    const { lobbyData } = this.props;
    this.componentFocusUnsub = this.props.navigation.addListener('focus', () => {
      this.fetchNearestPlacesFromGoogle();
      this.getUserFoodSelections();
    });
    if (lobbyData) {
      this.fetchNearestPlacesFromGoogle();
      this.getUserFoodSelections();
    }
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
    const { selectedFoodChoices, maxNumberOfSelections } = this.state;
    if (selectedFoodChoices.includes(foodChoice) || selectedFoodChoices.length >= maxNumberOfSelections) return;
    let newFoodChoices = selectedFoodChoices;
    newFoodChoices.push(foodChoice);
    this.setState({ selectedFoodChoices: newFoodChoices });
  }

  removeFoodChoice(foodChoice) {
    const { selectedFoodChoices } = this.state;
    let newFoodChoices = selectedFoodChoices;
    newFoodChoices = newFoodChoices.filter(choice => foodChoice.id !== choice.id);
    this.setState({ selectedFoodChoices: newFoodChoices });
  }

  clearSelections() {
    this.setState({ selectedFoodChoices: [] });
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

  async fetchNearestPlacesFromGoogle() {
    const { lobbyData } = this.props;
    
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

    await fetch(url)
      .then(res => {
        return res.json();
      })
      .then(res => {
        var places = []
        const GooglePicBaseUrl = `https://maps.googleapis.com/maps/api/place/photo?key=AIzaSyB1q8bz0Sr14VhwhwKaUiinzUHZmwtj9oo&maxwidth=400&photo_reference=`;
        for(let googlePlace of res.results) {
          var place = {};
          const coordinate = {
            latitude: googlePlace.geometry.location.lat,
            longitude: googlePlace.geometry.location.lng,
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
          place['rating'] = googlePlace.rating ?? 0;
          place['priceLevel'] = googlePlace.price_level ?? 0;
          place['vicinity'] = googlePlace.vicinity;
          place['userRatingsTotal'] = googlePlace.user_ratings_total ?? 0;
          place['photos'] = gallery;
          place['opennow'] = googlePlace.opening_hours?.open_now ?? false

          places.push(place);
        }
        this.setChoices(places);
      })
      .catch(error => {
        console.error("FoodChoices::fetchNearestPlacesFromGoogle", error);
      })
      .finally(() => {
        this.setState({ loading: false })
      });
  }

  async getUserFoodSelections() {
    const { lobbyData, user, db } = this.props;

    try {
      const selectedFoodChoicesDoc = await getDoc(doc(db, 'food_selections', `${lobbyData.ref.id}_${user.uid}`));
      const selectedFoodChoices = selectedFoodChoicesDoc.data()?.selections;
      this.setState({ selectedFoodChoices: selectedFoodChoices ?? [] });
    } catch (err) {
      console.error("MakeSelections::getUserFoodSelections", err);
    }
  }

  render() {
    const {
      screenHeight,
      googleSearchText,
      choicesPageIndex,
      selectedFoodChoices,
      nextPageToken,
      foodChoices,
      loading,
      maxNumberOfSelections,
    } = this.state;

    const { user } = this.props;

    const { lobbyData } = this.props;

    const addressName = lobbyData.locationGeocodeAddress &&
      lobbyData.locationGeocodeAddress[0]?.city + ", " + 
      lobbyData.locationGeocodeAddress[0]?.region;

    return (
      <HeaderHeightContext.Consumer>
        {headerHeight => (
          <View
            style={{
              height: screenHeight - headerHeight,
              paddingHorizontal: 10,
              justifyContent: 'space-between',
            }}
          >
            {/* <FoodProfile
              {...this.props}
              selectedFoodProfile={this.setSelectedFoodProfile}
            /> */}
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
                    selectedFoodChoices={selectedFoodChoices}
                    lobbyData={lobbyData}
                    maxNumberOfSelections={maxNumberOfSelections}
                  />
                  <View style={{ justifyContent: 'space-between', flexDirection: 'row', marginTop: -8, paddingHorizontal: 10 }}>
                    <Text>{addressName}</Text>
                    <Text>Page {choicesPageIndex}</Text>
                  </View>
                </>
              )
            }
            <FoodPageNavigation
              {...this.props}
              nextChoicesPage={this.nextChoicesPage}
              lastChoicesPage={this.lastChoicesPage}
              choicesPageIndex={choicesPageIndex}
              clearSelections={this.clearSelections}
              selectedFoodChoices={selectedFoodChoices}
              lobbyData={lobbyData}
              user={user}
              maxNumberOfSelections={maxNumberOfSelections}
            />
          </View>
        )}
      </HeaderHeightContext.Consumer>
      
    )
  }
}

export default MakeSelections;
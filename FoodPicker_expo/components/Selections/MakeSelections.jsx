import { Component } from "react";
import { Dimensions, View } from "react-native";
import { Button, Icon, Switch, Text } from 'react-native-elements';
import { HeaderHeightContext } from '@react-navigation/elements';
// import FoodProfile from "../FoodProfile/FoodProfile";
// import GoogleFoodSearch from "./GoogleFoodSearch";
import FoodChoices from "./FoodChoices";
import FoodPageNavigation from "./FoodPageNavigation";
import LoadingSpinner from "../LoadingSpinner";
import Constants from 'expo-constants';
import { getDoc, doc, setDoc } from "firebase/firestore";
import { PLACE_DETAILS_API_KEY, GOOGLE_MAPS_API_KEY } from "../../config";
import ThemeColors from "../../assets/ThemeColors";
import { TouchableOpacity } from "react-native-gesture-handler";

class MakeSelections extends Component {
  constructor(props) {
    super(props);
    const offset = Constants.platform.android ? 35 : 0;
    const adBannerHeight = 60;
    const screenHeight = Dimensions.get('screen').height - offset;
    const maxNumberOfSelections = 5;

    this.openNowFilter = true;

    this.state = {
      screenHeight: screenHeight,
      selectedFoodProfile: undefined,
      googleSearchText: "",
      selectedFoodChoices: [],
      foodChoices: [],
      choicesPageIndex: 0,
      tokenPage: -1,
      loading: true,
      maxNumberOfSelections: maxNumberOfSelections,
      nextPageToken: null,
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
    this.userSelectionPage = this.userSelectionPage.bind(this);
  }

  componentDidMount() {
    const { lobbyData } = this.props;
    this.componentFocusUnsub = this.props.navigation.addListener('focus', () => {
      this.fetchNearestPlacesFromGoogle();
      this.getUserFoodSelections();
    });

    this.props.navigation.addListener('blur', () => {
      this.setState({ nextPageToken: null, foodChoices: [], choicesPageIndex: 0 });
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
      if (foodChoices.length < 60) {
        this.fetchNearestPlacesFromGoogle();
        this.setState({ choicesPageIndex: choicesPageIndex + 1 });
      } else {
        this.setState({ choicesPageIndex: 0 });
      }
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

  async fetchNearestPlacesFromGoogle(
    foodChoices = this.state.foodChoices,
    nextPageToken = this.state.nextPageToken
  ) {
    const { lobbyData } = this.props;
    
    const latitude = lobbyData.location.latitude;
    const longitude = lobbyData.location.longitude;
    const radius = Math.round(lobbyData.distance * 1609.344);
    const types = 'restaurant';
    let url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?'
      + 'location=' + latitude + ',' + longitude
      + '&radius=' + radius
      + '&type=' + types
      + '&key=' + GOOGLE_MAPS_API_KEY;

    let places = foodChoices;
    if (nextPageToken != null) {
      url += "&pagetoken=" + nextPageToken;
    } else {
      places = [];
    }

    if (this.openNowFilter) {
      url = url + '&opennow=true';
    }
    
    this.setState({ loading: true });

    await fetch(url)
      .then(res => {
        return res.json();
      })
      .then(res => {
        if (res.status !== "OK") {
          throw new Error(res.status);
        }

        const GooglePicBaseUrl = `https://maps.googleapis.com/maps/api/place/photo?key=${PLACE_DETAILS_API_KEY}&maxwidth=400&photo_reference=`;
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
          place['opennow'] = googlePlace.opening_hours?.open_now ?? false;

          places.push(place);
        }
        this.setChoices(places);
        this.setState({ nextPageToken: res.next_page_token });
      })
      .catch(error => {
        console.error("FoodChoices::fetchNearestPlacesFromGoogle", error);
      })
      .finally(() => {
        this.setState({ loading: false });
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

  userSelectionPage() {
    const { lobbyData, user, db } = this.props;
    const { selectedFoodChoices } = this.state;
    
    this.setState({ loading: true });
    // Add food selections to firestore
    setDoc(doc(db, 'food_selections', `${lobbyData.ref.id}_${user.uid}`), {
      lobbyId: lobbyData.ref.id,
      uid: user.uid,
      selections: selectedFoodChoices,
    }, {
      merge: false,
    })
    .then(() => {
      // Add user to lobby usersReady list
      const usersReady = lobbyData.usersReady || [];
      if (!usersReady?.includes(user.uid)) {
        console.log("Adding user to ready list")
        setDoc(lobbyData.ref, { usersReady: [...usersReady, user.uid] }, { merge: true })
        .then(() => {
          this.clearSelections();

          // Go to user's selection page
          if (selectedFoodChoices.length === 0) {
            this.props.navigation.navigate('LobbyView', { lobbyRef: lobbyData.ref });
          } else {
            this.props.navigation.navigate('UserSelections', { lobbyData: lobbyData, user: user });
          }
          this.setState({ loading: false });
        });
      } else {
        // Go to user's selection page
        if (selectedFoodChoices.length === 0) {
          this.props.navigation.navigate('LobbyView', { lobbyRef: lobbyData.ref });
        } else {
          this.props.navigation.navigate('UserSelections', { lobbyData: lobbyData, user: user });
        }
        this.setState({ loading: false });
      }
    })
    .catch((err) => {
      console.error("MakeSelections::userSelectionPage", err);
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
      loading,
      maxNumberOfSelections,
    } = this.state;

    const { user, lobbyData } = this.props;

    return (
      <HeaderHeightContext.Consumer>
        {headerHeight => (
          <View
            key={'make-selections-view'}
            style={{
              height: screenHeight - headerHeight,
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
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingTop: 5,
                  justifyContent: 'center'
                }}
              >
                <Switch
                  value={this.openNowFilter}
                  color={ThemeColors.button}
                  style={{ alignSelf: 'center' }}
                  onValueChange={(value) => {
                    this.openNowFilter = value;
                    this.setState({ choicesPageIndex: 0 });
                    this.fetchNearestPlacesFromGoogle([], null);
                  }}
                />
                <Text
                  style={{ marginLeft: 10, alignSelf: 'center', fontSize: 20 }}
                  ellipsizeMode='tail'
                  numberOfLines={1}
                >
                  Only open now?
                </Text>
              </View>
              <View style={{ paddingRight: 15, paddingTop: 5 }}>
                <TouchableOpacity
                  onPress={this.userSelectionPage}
                >
                  <Text style={{ textAlign: 'center', fontSize: 18 }}>Picks</Text>
                  <Text
                    style={{
                      textAlign: 'center',
                      fontSize: 20,
                      fontWeight: 'bold'
                    }}
                  >
                    {
                      loading ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <Text
                          style={{ fontWeight: 'bold', color: ThemeColors.text }}
                        >
                          {selectedFoodChoices?.length || 0}
                        </Text>
                      )
                    }
                    {` / ${maxNumberOfSelections}`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {
              loading ? (
                <>
                  <Text>{''}</Text>
                  <LoadingSpinner />
                  <Text>{''}</Text>
                </>
              ) : (
                <View
                  style={{ justifyContent: 'center' }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      marginLeft: 15,
                      textAlign: 'center'
                    }}
                  >
                    Choose 0 - 5 selections
                  </Text>
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
                    selectedFoodChoices={selectedFoodChoices}
                    maxNumberOfSelections={maxNumberOfSelections}
                  />
                </View>
              )
            }
            <FoodPageNavigation
              {...this.props}
              nextChoicesPage={this.nextChoicesPage}
              lastChoicesPage={this.lastChoicesPage}
              userSelectionPage={this.userSelectionPage}
              choicesPageIndex={choicesPageIndex}
              clearSelections={this.clearSelections}
              selectedFoodChoices={selectedFoodChoices}
              foodChoices={foodChoices}
              lobbyData={lobbyData}
              user={user}
              maxNumberOfSelections={maxNumberOfSelections}
              loading={loading}
            />
          </View>
        )}
      </HeaderHeightContext.Consumer>
    )
  }
}

export default MakeSelections;
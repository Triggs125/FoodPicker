import { Component } from "react";
import { Dimensions, FlatList, StatusBar, View } from "react-native";
import { Switch, Text, Button } from 'react-native-elements';
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
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import * as Analytics from 'expo-firebase-analytics';

class MakeSelections extends Component {
  constructor(props) {
    super(props);

    this.openNowFilter = true;

    const maxNumberOfSelections = 5;

    this.state = {
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
    this.saveUserSelections = this.saveUserSelections.bind(this);
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
    if (foodChoices.length < 60) {
      this.fetchNearestPlacesFromGoogle();
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
        for (let googlePlace of res.results) {
          var place = {};
          const coordinate = {
            latitude: googlePlace.geometry.location.lat,
            longitude: googlePlace.geometry.location.lng,
          };

          var gallery = [];
          if (googlePlace.photos) {
            for (let photo of googlePlace.photos) {
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
        Analytics.logEvent("exception", {
          description: "MakeSelections::fetchNearestPlacesFromGoogle"
        });
        console.error("MakeSelections::fetchNearestPlacesFromGoogle", error);
      })
      .finally(() => {
        this.setState({ loading: false });
        Analytics.logEvent("event", {
          description: "MakeSelections::fetchNearestPlacesFromGoogle"
        });
      });
  }

  async getUserFoodSelections() {
    const { lobbyData, user, db } = this.props;

    try {
      const selectedFoodChoicesDoc = await getDoc(doc(db, 'food_selections', `${lobbyData.ref.id}_${user.uid}`));
      const selectedFoodChoices = selectedFoodChoicesDoc.data()?.selections;
      this.setState({ selectedFoodChoices: selectedFoodChoices ?? [] });
    } catch (err) {
      Analytics.logEvent("exception", {
        description: "MakeSelections::getUserFoodSelections"
      });
      console.error("MakeSelections::getUserFoodSelections", err);
    }
  }

  saveUserSelections() {
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
      .then(async () => {
        // Add user to lobby's usersReady list
        const usersReady = lobbyData.usersReady || [];
        if (selectedFoodChoices.length === 0) {
          const index = usersReady.indexOf(user.uid);
          if (index > -1) {
            usersReady.splice(index, 1);
            setDoc(lobbyData.ref, { usersReady }, { merge: true })
              .then(() => {
                this.clearSelections();
                this.setState({ loading: false });
                this.props.navigation.navigate('LobbyView', { lobbyRef: lobbyData.ref });
              })
              .catch(err => {
                Analytics.logEvent("exception", {
                  description: "MakeSelections::userSelectionPage::NoSelections"
                });
                console.error("MakeSelections::userSelectionPage::NoSelections", err);
                this.setState({ loading: false });
              });
          } else {
            this.props.navigation.navigate('LobbyView', { lobbyRef: lobbyData.ref });
            this.setState({ loading: false });
          }
        } else {
          const index = usersReady.indexOf(user.uid);
          if (index === -1) {
            usersReady.push(user.uid);
            setDoc(lobbyData.ref, { usersReady }, { merge: true })
              .then(() => {
                this.clearSelections();
                this.setState({ loading: false });
                this.props.navigation.navigate('UserSelections', { lobbyData: lobbyData, user: user });
              })
              .catch(err => {
                Analytics.logEvent("exception", {
                  description: "MakeSelections::userSelectionPage::SelectionsPresent"
                });
                console.error("MakeSelections::userSelectionPage::SelectionsPresent", err);
                this.setState({ loading: false });
              });
          } else {
            this.setState({ loading: false });
            this.props.navigation.navigate('UserSelections', { lobbyData: lobbyData, user: user });
          }
        }
      })
      .catch((err) => {
        Analytics.logEvent("exception", {
          description: "MakeSelections::userSelectionPage"
        });
        console.error("MakeSelections::userSelectionPage", err);
        this.setState({ loading: false });
      });
  }

  render() {
    if (Constants.platform.web) {
      return <></>;
    }
    const {
      googleSearchText,
      choicesPageIndex,
      selectedFoodChoices,
      nextPageToken,
      foodChoices,
      loading,
      maxNumberOfSelections,
    } = this.state;

    const { lobbyData } = this.props;

    return (
      <View
        key={'make-selections-view'}
        style={{
          justifyContent: 'space-between',
          flex: 1
        }}
      >
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
          <View style={{ paddingRight: 15, paddingTop: 5, marginBottom: 15 }}>
            <Text style={{ textAlign: 'center', fontSize: 18 }}>Picks</Text>
            <Text
              style={{
                textAlign: 'center',
                fontSize: 20,
                fontWeight: 'bold'
              }}
            >
              <Text
                style={{ fontWeight: 'bold', color: ThemeColors.text }}
              >
                {
                  loading ?
                    "-" :
                    selectedFoodChoices?.length || 0
                }
              </Text>
              {` / ${maxNumberOfSelections}`}
            </Text>
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
              style={{ justifyContent: 'center', flex: 1 }}
            >
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
                nextChoicesPage={this.nextChoicesPage}
              />
              <Button
                onPress={this.saveUserSelections}
                title="Save Selections"
                titleStyle={{
                  fontSize: 20,
                  fontWeight: 'bold'
                }}
                buttonStyle={{
                  backgroundColor: ThemeColors.text,
                  borderRadius: 0,
                  height: 50
                }}
                containerStyle={{
                  borderRadius: 0
                }}
              />
            </View>
          )
        }
      </View>
    )
  }
}

export default MakeSelections;
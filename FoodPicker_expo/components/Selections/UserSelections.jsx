import { Component } from "react";
import Constants from 'expo-constants';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { View, Dimensions, StatusBar } from "react-native";
import LoadingSpinner from '../LoadingSpinner';
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { HeaderHeightContext } from '@react-navigation/elements';
import { Text, Icon, Button, Card } from 'react-native-elements';
import { getDistance } from 'geolib';
import ThemeColors from "../../assets/ThemeColors";
import { ScreenWidth } from "react-native-elements/dist/helpers";
import * as Analytics from 'expo-firebase-analytics';


class UserSelections extends Component {
  constructor(props) {
    super(props);
    const offset = Constants.platform.android ? 48 : 20;
    const adBannerHeight = StatusBar.currentHeight + 60;
    const screenHeight = Dimensions.get('screen').height - offset - adBannerHeight;

    this.state = {
      screenHeight: screenHeight,
      selectedFoodProfile: undefined,
      selectedFoodChoices: [],
      choicesPageIndex: 0,
      loading: true,
    }

    this.componentAppeared = this.componentAppeared.bind(this);
    this.removeFoodChoice = this.removeFoodChoice.bind(this);
    this.clearSelections = this.clearSelections.bind(this);
  }

  componentDidMount() {
    this.componentFocusUnsub = this.props.navigation.addListener('focus', () => {
      this.componentAppeared();
    });
    const { user } = this.props.route?.params;
    const { lobbyData } = this.props;
    if (lobbyData && user) {
      this.componentAppeared();
    }
  }

  componentWillUnmount() {
    this.componentFocusUnsub && this.componentFocusUnsub();
  }

  componentAppeared() {
    const { user } = this.props.route?.params;
    const { lobbyData, db } = this.props;
    this.setState({ loading: true });
    const foodSelectionsDoc = doc(db, 'food_selections', `${lobbyData.ref.id}_${user.uid}`);

    this.foodChoicesUnsub = onSnapshot(foodSelectionsDoc, selectedFoodChoices => {
      this.setState({
        selectedFoodChoices: {
          data: selectedFoodChoices.data(),
          ref: selectedFoodChoices.ref,
          id: selectedFoodChoices.id,
        },
        loading: false,
      });
    },
    err => {
      console.error("UserSelections::componentAppeared", err);
    });
  }

  componentWillUnmount() {
    this.foodChoicesUnsub && this.foodChoicesUnsub();
  }

  async removeFoodChoice(foodChoice) {
    Analytics.logEvent("event", {
      description: "UserSelections::removeFoodChoice"
    });
    
    const { selectedFoodChoices } = this.state;
    const { lobbyData } = this.props;
    const { user } = this.props.route?.params;

    let newFoodChoices = selectedFoodChoices?.data?.selections;
    newFoodChoices = newFoodChoices.filter(choice => choice.id !== foodChoice.id);
    await setDoc(selectedFoodChoices.ref, { selections: newFoodChoices }, { merge: true });

    if (newFoodChoices.length === 0) {
      // Remove user from lobby usersReady list
      let usersReady = lobbyData.usersReady;
      if (usersReady.includes(user.uid)) {
        usersReady = usersReady.filter(uid => uid !== user.uid);
        await setDoc(lobbyData.ref, { usersReady: usersReady }, { merge: true });
        this.props.navigation.navigate('LobbyView', { lobbyRef: lobbyData.ref });
      }
    }
  }

  clearSelections() {
    const { selectedFoodChoices } = this.state;
    const { lobbyData, user } = this.props;
    setDoc(selectedFoodChoices.ref, { selections: [] }, { merge: true })
      .then(() => {
        const usersReady = lobbyData.usersReady || [];
        const index = usersReady.indexOf(user.uid);
        if (index > -1) {
          usersReady.splice(index, 1);
          setDoc(lobbyData.ref, { usersReady }, { merge: true })
            .then(() => {
              this.props.navigation.navigate("LobbyView", { lobbyRef: lobbyData.ref });
              Analytics.logEvent("event", {
                description: "UserSelections::clearSelections"
              });
            })
            .catch(err => {
              Analytics.logEvent("exception", {
                description: "UserSelections::clearSelections::usersReadyRemoval"
              });
              console.error("UserSelections::clearSelections::usersReadyRemoval", err);
            })
        }
      })
      .catch(err => {
        Analytics.logEvent("exception", {
          description: "UserSelections::clearSelections"
        });
        console.error("UserSelection::clearSelections:setDoc", err);
      });
  }

  stars(rating) {
    if (!rating && isNaN(rating)) return [];
    const _rating = Math.round(rating * 2);
    const fullStars = Math.floor(_rating / 2);
    const halfStar = _rating % 2 !== 0;
    const stars = [];

    // Gets the number of full stars to display
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Icon name="star" type="font-awesome" color='gold' size={18} />);
    }

    // Adds a half star if the rating decimal is .5 or above
    if (halfStar) {
      stars.push(<Icon name="star-half-full" type="font-awesome" color='gold' size={18} />);
    }

    for (let i = fullStars + halfStar; i < 5; i++) {
      stars.push(<Icon name="star-o" type="font-awesome" color='gold' size={18} />)
    }

    return stars;
  }

  totalRatings(num) {
    if (!num || isNaN(num)) return;
    return `(${Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + 'k' : Math.sign(num) * Math.abs(num)})`;
  }

  priceLevel(priceLevel) {
    let price = "";
    for (let i = 0; i < priceLevel; i++) {
      price += '$';
    }
    return price;
  }

  distanceAway(coords) {
    const { lobbyData } = this.props;
    const lobbyCoords = { latitude: lobbyData.location.latitude, longitude: lobbyData.location.longitude };
    return Math.round((getDistance(lobbyCoords, coords) / 1609.344) * 10) / 10;
  }

  placeTypes(types) {
    let typeNames = "";
    if (types.length === 0) return typeNames;
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      if (i >= 4) break;
      if (type.toLowerCase() === "restaurant") {
        typeNames += " " + type.replace('_', ' ') + ",";
        break;
      }
      typeNames += " " + type.replace('_', ' ') + ",";
    }
    return typeNames.substring(1, typeNames.length - 1);
  }

  render() {
    const {
      screenHeight,
      selectedFoodChoices,
      loading,
    } = this.state;

    const { user } = this.props.route.params;
    const { lobbyData } = this.props;

    // const addressName = lobbyData.locationGeocodeAddress &&
    //   lobbyData.locationGeocodeAddress[0]?.city + ", " +
    //   lobbyData.locationGeocodeAddress[0]?.region;

    const userDisplayName = user.displayName ? user.displayName : user.firstName + " " + user.lastName

    const isUserChoices = user.uid === this.props.user.uid;

    return (
      <HeaderHeightContext.Consumer>
        {headerHeight => (
          <View
            key={'user-selection-view'}
            style={{
              height: screenHeight - headerHeight,
              paddingHorizontal: 10,
              justifyContent: 'space-between',
            }}
          >
            {
              loading ? (
                <>
                  <Text></Text>
                  <LoadingSpinner />
                </>
              ) : (
                <ScrollView>
                  <Text
                    style={{
                      textAlign: 'center',
                      alignSelf: 'center',
                      marginTop: 5,
                      marginBottom: 10,
                      fontWeight: '600',
                      fontSize: 30,
                      fontWeight: 'normal',
                      width: ScreenWidth - 40,
                      color: isUserChoices ? ThemeColors.text : 'black'
                    }}
                    ellipsizeMode='tail'
                    numberOfLines={1}
                  >
                    {userDisplayName}
                  </Text>
                  <View style={{ paddingBottom: 3, paddingLeft: 12 }}>
                    <Text style={{ fontSize: 10 }}>**Select Card to see the place details</Text>
                    {
                      isUserChoices &&
                      <Text style={{ fontSize: 10 }}>**Hold down to delete</Text>
                    }
                  </View>
                  {
                    selectedFoodChoices?.data?.selections?.map((foodChoice, i) => {
                      return (
                        <TouchableOpacity
                          onLongPress={() => isUserChoices && this.removeFoodChoice(foodChoice)}
                          onPress={() => this.props.navigation.navigate("PlaceDetails", { foodChoice, finalDecision: false })}
                          key={'food-choice-' + i}
                          containerStyle={{ marginHorizontal: -5 }}
                        >
                          <Card
                            containerStyle={{
                              elevation: 6,
                              height: 80,
                              marginBottom: 10,
                              marginTop: 0,
                              marginHorizontal: 10,
                              paddingTop: 10,
                              justifyContent: 'center'
                            }}
                          >
                            <Card.Title
                              style={{ fontSize: 18, textAlign: 'left', marginBottom: 0 }}
                              ellipsizeMode='tail'
                              numberOfLines={1}
                            >
                              {foodChoice.name}
                            </Card.Title>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={{ marginRight: 5, alignSelf: 'center' }}>{foodChoice.rating}</Text>
                              <View style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
                                {
                                  this.stars(foodChoice?.rating)
                                }
                              </View>
                              <Text style={{ alignSelf: 'center', marginRight: 5 }}>{this.totalRatings(foodChoice.userRatingsTotal)}</Text>
                              <Icon
                                name="circle"
                                type="font-awesome"
                                size={5}
                                color='#333'
                                style={{ alignSelf: 'center', marginRight: 5 }}
                              />
                              <Text style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
                                {
                                  this.priceLevel(foodChoice.priceLevel)
                                }
                              </Text>
                              <Icon
                                name="circle"
                                type="font-awesome"
                                size={5}
                                color='#333'
                                style={{ alignSelf: 'center', marginRight: 5 }}
                              />
                              <Text style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
                                {
                                  `${this.distanceAway(foodChoice.coordinate)} mi`
                                }
                              </Text>
                            </View>
                            <Text
                              style={{ textTransform: 'capitalize', marginRight: 5 }}
                              ellipsizeMode='tail'
                              numberOfLines={1}
                            >
                              {this.placeTypes(foodChoice.types)}
                            </Text>
                          </Card>
                        </TouchableOpacity>
                      );
                    })
                  }
                </ScrollView>
              )
            }
            <View
              style={{ paddingTop: 5 }}
            >
              {
                isUserChoices && (
                  <Button
                    title="Clear Selections"
                    raised
                    titleStyle={{ color: ThemeColors.text, fontWeight: 'bold', fontSize: 26 }}
                    buttonStyle={{ backgroundColor: 'white' }}
                    containerStyle={{ marginBottom: 10 }}
                    icon={{
                      name: 'remove-circle',
                      type: 'material-icons',
                      color: ThemeColors.text
                    }}
                    onPress={this.clearSelections}
                  />
                )
              }
              <Button
                title="Back to Lobby"
                raised
                titleStyle={{ color: 'white', fontWeight: 'bold', fontSize: 26 }}
                buttonStyle={{ backgroundColor: ThemeColors.text }}
                containerStyle={{ marginBottom: 10 }}
                onPress={() => this.props.navigation.navigate('LobbyView', { lobbyRef: lobbyData.ref })}
              />
            </View>
          </View>
        )}
      </HeaderHeightContext.Consumer>
    )
  }
}

export default UserSelections;
import { Component } from "react";
import Constants from 'expo-constants';
import { collection, doc, getDocs, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { View, Dimensions } from "react-native";
import LoadingSpinner from '../LoadingSpinner';
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { HeaderHeightContext } from '@react-navigation/elements';
import { Tile, Text, Icon, Button, Card } from 'react-native-elements';
import { getDistance } from 'geolib';
import ThemeColors from "../../assets/ThemeColors";


class UserSelections extends Component {
  constructor(props) {
    super(props);
    const offset = Constants.platform.android ? 48 : 0;
    const screenHeight = Dimensions.get('screen').height - offset;

    this.state = {
      screenHeight: screenHeight,
      selectedFoodProfile: undefined,
      selectedFoodChoices: [],
      choicesPageIndex: 0,
      loading: true,
    }

    this.componentAppeared = this.componentAppeared.bind(this);
    this.removeFoodChoice = this.removeFoodChoice.bind(this);
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
    const { selectedFoodChoices } = this.state;
    const { lobbyData } = this.props;
    const { user } = this.props.route?.params;

    let newFoodChoices = selectedFoodChoices?.data?.selections;
    newFoodChoices = newFoodChoices.filter(choice => choice.id !== foodChoice.id);
    await setDoc(selectedFoodChoices.ref, { selections: newFoodChoices }, { merge: true });

    if (newFoodChoices.length <= 0) {
      // Remove user from lobby usersReady list
      let usersReady = lobbyData.usersReady;
      if (usersReady.includes(user.uid)) {
        usersReady = usersReady.filter(uid => uid !== user.uid);
        await setDoc(lobbyData.ref, { usersReady: usersReady }, { merge: true });
      }
    }
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

    const addressName = lobbyData.locationGeocodeAddress &&
      lobbyData.locationGeocodeAddress[0]?.city + ", " +
      lobbyData.locationGeocodeAddress[0]?.region;

    const userDisplayName = user.displayName ? user.displayName : user.firstName + " " + user.lastName

    const isDisabled = user.uid !== this.props.user.uid;

    return (
      <HeaderHeightContext.Consumer>
        {headerHeight => (
          <View
            key={0}
            style={{
              height: screenHeight - headerHeight,
              paddingHorizontal: 10,
              justifyContent: 'space-between',
            }}
          >
            {
              loading ? (
                <LoadingSpinner />
              ) : (
                <View>
                  <Text style={{ textAlign: 'center', marginTop: 5, fontWeight: '600', fontSize: 30, fontWeight: 'normal' }}>{userDisplayName}</Text>
                  <ScrollView>
                    {
                      selectedFoodChoices?.data?.selections?.map((foodChoice, i) => {
                        if (selectedFoodChoices?.data?.selections?.length <= 2) {
                          return (
                            <Tile
                              key={i}
                              width={'94%'}
                              title={foodChoice.name}
                              titleStyle={{ textAlign: 'left', fontSize: 18, fontWeight: 'bold', marginTop: -5 }}
                              imageSrc={{ uri: foodChoice.photos[0] }}
                              imageContainerStyle={selectedFoodChoices?.data?.selections?.length <= 2 ? {} : { height: 0 }}
                              containerStyle={{
                                marginVertical: 10,
                                borderRadius: 10,
                                borderWidth: Constants.platform.ios ? 0.5 : 0,
                                borderColor: 'gray',
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                elevation: 6,
                                height: (screenHeight - headerHeight) / (0.8 + selectedFoodChoices.data.selections.length),
                                alignSelf: 'center',
                              }}
                              wrapperStyle={{
                                margin: -15,
                              }}
                              onPress={() => this.props.navigation.navigate("PlaceDetails", { foodChoice })}
                              onLongPress={() => !isDisabled && this.removeFoodChoice(foodChoice)}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ marginRight: 5, alignSelf: 'center' }}>{foodChoice.rating}</Text>
                                <View style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
                                  {
                                    this.stars(foodChoice?.rating).map(star => star)
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
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5, flexWrap: 'wrap' }}>
                                <Text style={{ textTransform: 'capitalize', marginRight: 5 }}>{this.placeTypes(foodChoice.types)}</Text>
                                <Icon
                                  name="circle"
                                  type="font-awesome"
                                  size={5}
                                  color='#333'
                                  style={{ alignSelf: 'center', marginRight: 5 }}
                                />
                                <Text>{foodChoice.vicinity}</Text>
                              </View>
                            </Tile>
                          );
                        } else {
                          return (
                            <TouchableOpacity
                              onLongPress={() => !isDisabled && this.removeFoodChoice(foodChoice)}
                              onPress={() => this.props.navigation.navigate("PlaceDetails", { foodChoice })}
                            >
                              <Card
                                containerStyle={{
                                  elevation: 6,
                                  maxHeight: (screenHeight - headerHeight) / (2.3 + selectedFoodChoices.data.selections.length),
                                  marginBottom: 10,
                                  marginTop: 0,
                                  paddingTop: 10
                                }}
                              >
                                <Card.Title style={{ fontSize: 18, textAlign: 'left', marginBottom: 0 }}>{foodChoice.name}</Card.Title>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <Text style={{ marginRight: 5, alignSelf: 'center' }}>{foodChoice.rating}</Text>
                                  <View style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
                                    {
                                      this.stars(foodChoice?.rating).map(star => star)
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
                                <Text style={{ textTransform: 'capitalize', marginRight: 5 }}>{this.placeTypes(foodChoice.types)}</Text>
                              </Card>
                            </TouchableOpacity>
                          );
                        }
                      })
                    }
                  </ScrollView>
                  <Text style={{ fontSize: 10, paddingLeft: 12 }}>**Select Card to see details</Text>
                  {
                    !isDisabled &&
                    <Text style={{ fontSize: 10, paddingLeft: 12, paddingBottom: 3 }}>**Hold down to delete</Text>
                  }
                </View>
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
        )}
      </HeaderHeightContext.Consumer>
    )
  }
}

export default UserSelections;
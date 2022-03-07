import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, doc, getDocs, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { Component } from "react";
import { Dimensions, Share, StyleSheet, View } from "react-native";
import { Card, Icon, Input, Text, Button, Overlay } from 'react-native-elements';
import Constants from 'expo-constants';
import { HeaderHeightContext } from '@react-navigation/elements';
import { ScrollView } from "react-native-gesture-handler";
import ThemeColors from "../../assets/ThemeColors";
import LocationView from "./LocationView";
import { ScreenWidth } from "react-native-elements/dist/helpers";
import { getDistance } from 'geolib';

class LobbyView extends Component {
  constructor(props) {
    super(props);

    const offset = Constants.platform.android ? 48 : 0;
    const adBannerHeight = 60;
    const screenHeight = Dimensions.get('screen').height - offset;

    this.state = {
      screenHeight: screenHeight,
      loading: true,
      lobbyData: {},
      lobbyRef: {},
      lobbyName: "",
      isHost: false,
      removeUserOverlay: false,
      removeUserOverlayUser: null,
      removeUserOverlayLoading: false,
      removeUserOverlayError: false,
    }

    this.setLocationData = this.setLocationData.bind(this);
  }

  componentDidMount() {
    this.componentFocusUnsub = this.props.navigation.addListener('focus', () => {
      this.componentDidAppear();
    });
    if (this.props.route?.params.lobbyRef) {
      this.componentDidAppear();
    }
    if (this.navState === undefined) {
      this.navState = this.props.navigation.addListener('state', (e) => {
        const index = e.data.state.index;
        // 2 - 4 encompass all the lobby view pages
        // Only unsub to the lobby view if the lobby pages are out of focus
        if (![2,3,4].includes(index)) {
          this.componentFocusUnsub && this.componentFocusUnsub();
          this.state.unsubscribeLobby && this.state.unsubscribeLobby();
        }
      });
    }
  }

  componentDidAppear() {
    const { lobbyRef } = this.props.route?.params;
    if (!lobbyRef) {
      this.props.navigation.navigate('LobbyPicker');
    }
    const unsubscribeLobby = onSnapshot(lobbyRef, async (lobby) => {
      const { user, db } = this.props;
      if (user && lobby) {
        this.setState({ loading: true });
        const lobbyData = lobby.data();
        try {
          const isHost = lobbyData.host === user.uid;
          const matchingUsers = (await getDocs(query(collection(db, 'users'), where('uid', 'in', [...lobbyData.users, lobbyData.host]))));
          const lobbyUsers = matchingUsers.docs.map((doc) => { return {...doc.data(), id: doc.id} });
          this.setState({ lobbyData: {...lobbyData, ref: lobby.ref}, lobbyName: lobbyData.name, lobbyUsers, isHost });
          this.props.setLobbyData({...lobbyData, ref: lobby.ref});
        } catch(err) {
          console.error(err);
        }
        this.setState({ loading: false });
      }
    });
    this.setState({ unsubscribeLobby });
  }

  componentWillUnmount() {
    this.state.unsubscribeLobby && this.state.unsubscribeLobby();
    this.componentFocusUnsub && this.componentFocusUnsub();
    if (this.navState !== undefined) {
      this.navState();
    }
  }

  numberOfUsersReady() {
    const { lobbyUsers, lobbyData } = this.state;
    return lobbyUsers?.filter(user => lobbyData.usersReady?.includes(user.uid)).length;
  }

  async share() {
    const { lobbyData } = this.state;
    const lobbyName = "lobbies/" + lobbyData.ref.id;
    Share.share({
      message: "Help me choose which restaurant to choose. After logging into the app, paste this into the search box: " + lobbyName,
      title: "Join this Food Picker Lobby!",
    }, {
      subject: "Food Picker Lobby",
      dialogTitle: "Food Picker Lobby",
      tintColor: ThemeColors.text,
    })
    .catch(err => {
      console.error("LobbyView:share", err);
    });
  }

  userTitle(user, userReady, userIsHost) {
    const isHost = this.state.lobbyData?.host === user.uid;
    return (
      <>
        <Text
          style={{
            fontSize: 18,
            color: userReady ? 'green' : ThemeColors.text,
            marginRight: 8,
          }}
        >
          {`${user.firstName}${user.lastName ?? " " + user.lastName}`}
        </Text>
        {
          isHost ? (
            <Text style={{ color:'gray', alignSelf: 'center' }}>Host</Text>
          ) : (
            userIsHost ? (
              <Icon
                name="person-remove"
                size={20}
                color={ThemeColors.text}
                containerStyle={{ marginRight: 5, alignSelf: 'center' }}
              />
            ) : (
              <Text>{''}</Text>
            )
          )
        }
      </>
    );
  }

  removeUser(user) {
    if (user.uid === this.state.lobbyData.host) { // Host can not be removed
      return;
    }
    const { lobbyData } = this.state;
    let newUsers = lobbyData.users;
    newUsers = newUsers.filter(uid => uid !== user.uid);
    return setDoc(lobbyData.ref, { users: newUsers }, { merge: true });
  }

  setLocationData(location, locationGeocodeAddress, distance) {
    const data = {};
    if (location) {
      data.location = location;
    }
    if (locationGeocodeAddress) {
      data.locationGeocodeAddress = locationGeocodeAddress;
    }
    if (distance) {
      data.distance = distance;
    }
    if (Object.keys(data).length > 0) {
      console.log("Submit location data")
      setDoc(this.state.lobbyData.ref,
        data,
        { merge: true }
      );
    }
  }

  getFinalDecision() {
    const { user, db } = this.props;
    const { lobbyData } = this.state;
    if (
      user.uid !== lobbyData.host &&
      lobbyData.usersReady?.length > 0
    ) {
      return;
    }

    this.setState({ loading: true });

    getDocs(query(
      collection(db, 'food_selections'),
      where('lobbyId', '==', lobbyData.ref.id),
      where('uid', 'in', lobbyData.users)
    ))
    .then(foodSelections => {
      // Put everyone's selections into one array
      const selections = [];
      foodSelections?.forEach(userFoodSelections => {
        // console.log("food selections", userFoodSelections);
        userFoodSelections.data().selections?.forEach(selection => {
          selections.push(selection);
        });
      });
      return selections;
    })
    .then(selections => {
      // Choose one selection to be the final decision
      const finalSelection = this.getBestSelection(selections);
      
      // Set final decision in database
      setDoc(lobbyData.ref, { finalDecision: finalSelection }, { merge: true })
      .then(() => {
        // Navigate to place details page
        this.props.navigation.navigate("PlaceDetails", { foodChoice: finalSelection, finalSelection: true });
        this.setState({ loading: false });
      });
    })
    .catch(err => {
      console.error("LobbyView::getFinalDecision", err);
      this.setState({ loading: false });
    });
  }

  /**
   * Gets the best selection based on an array of food choic selections
   * @param {array} selections Array of food choice selections from every user
   * @returns {object} One final choice food selection
   */
  getBestSelection(selections) {
    // Filter selections based on max count of restaurant names
    const names = {};
    selections.forEach(selection => {
      names[selection.name] = names[selection.name] ? names[selection.name] + 1 : 1;
    });
    const maxNames = this.getMax(names);

    // Filter selections based on max counts of restaurant ids
    const ids = {}
    selections.forEach(selection => {
      if (maxNames.includes(selection.name)) {
        ids[selection.id] = ids[selection.id] ? ids[selection.id] + 1 : 1;
      }
    });
    const maxIds = this.getMax(ids);

    let matchingSelections = selections
      .filter(s => {
        return maxIds.includes(s.id);
      });
    
    if (matchingSelections.length === 1) {
      return matchingSelections[0];
    }
    // Filter selections based on ranking distance and rating together
    const minRankedObjects = {};
    matchingSelections.forEach(s => {
      const distanceAway = 1 / this.distanceAway(s.coordinate);
      const ratingRank = s.rating * s.rating;
      minRankedObjects[s.id] = distanceAway * ratingRank;
    });
    const minRankedIds = this.getMax(minRankedObjects);
    
    matchingSelections = selections
      .filter(s => {
        return minRankedIds.includes(s.id);
      });

    if (matchingSelections.length === 1) {
      return matchingSelections[0];
    }

    // Filter selections based on min distance away
    const minDistancObjects = {};
    matchingSelections.forEach(s => {
      minDistancObjects[s.id] = this.distanceAway(s.coordinate);
    });
    const minDistanceIds = this.getMin(minDistancObjects);
    
    matchingSelections = selections
      .filter(s => {
        return minDistanceIds.includes(s.id);
      });

    if (matchingSelections.length === 1) {
      return matchingSelections[0];
    }
    
    // Filter selections based on max rating
    const maxRatingObjects = {};
    matchingSelections.forEach(s => {
      maxRatingObjects[id] = s.rating;
    });
    const maxRatingIds = this.getMax(maxRatingObjects);
    
    matchingSelections = selections
      .filter(s => {
        return maxRatingIds.includes(s.id);
      });

    return matchingSelections[0];
  }

  distanceAway(coords) {
    const { lobbyData } = this.state;
    const lobbyCoords = { latitude: lobbyData.location.latitude, longitude: lobbyData.location.longitude };
    return Math.round((getDistance(lobbyCoords, coords) / 1609.344) * 10) / 10;
  }

  getMax(object) {
    return Object.keys(object).filter(x => {
      return object[x] == Math.max.apply(null, 
        Object.values(object));
    });
  }

  getMin(object) {
    return Object.keys(object).filter(x => {
      return object[x] == Math.min.apply(null, 
        Object.values(object));
    });
  }

  resetFinalDecision() {
    this.setState({ loading: true });
    setDoc(this.state.lobbyData.ref, { finalDecision: null }, { merge: true })
    .then(() => this.setState({ loading: false }))
    .catch(err => { console.error("LobbyView::resetFinalDecision", err); this.setState({ loading: false }) });
  }

  goToFinalDecision() {
    this.props.navigation.navigate("PlaceDetails", { foodChoice: this.state.lobbyData.finalDecision, finalSelection: true });
  }

  removeUserOverlay() {
    const {
      removeUserOverlay, removeUserOverlayUser, removeUserOverlayLoading, removeUserOverlayError,
    } = this.state;
    return (
      <Overlay
        isVisible={removeUserOverlay}
        overlayStyle={{ width: ScreenWidth - 20, borderRadius: 10 }}
        onBackdropPress={() => {
          this.setState({
            removeUserOverlay: false,
            removeUserOverlayUser: null,
            removeUserOverlayLoading: false,
          });
        }}
      >
        <Text
          style={{ fontSize: 24, textAlign: 'center', marginTop: 10, marginBottom: 20 }}
        >
          {`${removeUserOverlayUser?.firstName}${removeUserOverlayUser?.lastName ?? " " + removeUserOverlayUser?.lastName}`}
        </Text>
        {
          removeUserOverlayError && (
            <Text>Error removing the user. Please try again or contact support.</Text>
          )
        }
        <Button
          title="Remove User"
          loading={removeUserOverlayLoading}
          titleStyle={{ fontSize: 24 }}
          buttonStyle={{ backgroundColor: ThemeColors.button }}
          onPress={() => {
            this.setState({ removeUserOverlayLoading: true });
            this.removeUser(removeUserOverlayUser)
              .then(() => {
                this.setState({
                  removeUserOverlay: false,
                  removeUserOverlayUser: null,
                  removeUserOverlayLoading: false,
                  removeUserOverlayError: false,
                });
              })
              .catch(err => {
                console.log("LobbyView::RemoveUserOverlay", err);
                this.setState({
                  removeUserOverlayLoading: false,
                  removeUserOverlayError: true,
                });
              });
          }}
        />
        <Button
          title="Cancel"
          type="clear"
          disabled={removeUserOverlayLoading}
          titleStyle={{ color: ThemeColors.text, fontSize: 24 }}
          onPress={() => {
            this.setState({
              removeUserOverlay: false,
              removeUserOverlayUser: null,
              overlayPasswordLoading: false,
            });
          }}
        />
      </Overlay>
    );
  }

  render() {
    const {
      lobbyData, lobbyName, lobbyUsers, isHost, screenHeight, loading,
      removeUserOverlay, removeUserOverlayUser, removeUserOverlayLoading, removeUserOverlayError,
    } = this.state;

    const { user } = this.props;

    if (!loading && !lobbyData.users?.includes(user.uid)) {
      this.props.navigation.navigate("LobbyPicker", { kickedFromLobby: true });
    }

    return (
      <HeaderHeightContext.Consumer>
        {headerHeight => (
          <View
            style={{
              paddingHorizontal: 10,
              paddingTop: 10,
              height: screenHeight - headerHeight,
              justifyContent: 'space-between',
            }}
          >
            {this.removeUserOverlay()}
            <View style={{ display: 'flex', flexDirection: "row", justifyContent: 'space-between', width: ScreenWidth - 20 }}>
              <Button
                buttonStyle={{ backgroundColor: 'transparent' }}
                icon={<Icon name="settings" color={isHost ? 'black' : 'transparent'} />}
                onPress={() => isHost && this.props.navigation.navigate("LobbyCreator", { lobbyData })}
              />
              <Text
                style={{ fontSize: 24, alignSelf: 'center' }}
                ellipsizeMode='tail'
              >
                {lobbyName}
              </Text>
              <Button
                type='clear'
                titleStyle={{ color: ThemeColors.text }}
                onPress={() => this.share()}
                icon={<Icon name="share" type="font-awesome" />}
              />
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
            >
              <LocationView
                {...this.props}
                setLocationData={this.setLocationData}
                location={lobbyData?.location}
                locationGeocodeAddress={lobbyData?.locationGeocodeAddress}
                distance={lobbyData?.distance}
                isHost={isHost}
                loading={loading}
              />
              <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginBottom: 10, marginTop: -10 }}>
                <Card containerStyle={{ marginHorizontal: 0, borderRadius: 10, borderColor: 'lightgray' }}>
                  <Card.Title>People Ready: {this.numberOfUsersReady()} of {lobbyUsers?.length}</Card.Title>
                  <Card.Divider />
                  {
                    isHost &&
                    <Text style={{ fontSize: 12, marginBottom: 2, marginTop: -5 }}>*Hold down user to remove them</Text>
                  }
                  {
                    lobbyUsers &&
                    lobbyUsers
                    .sort((userA, userB) => {
                      const userAReady = lobbyData.usersReady?.includes(userA.uid);
                      const userBReady = lobbyData.usersReady?.includes(userB.uid);
                      if (
                        userB.uid === lobbyData.host 
                        || userBReady === true
                      ) {
                        return 1;
                      }
                      
                      if (
                        userA.uid === lobbyData.host
                        || userA.uid === this.props.user.uid
                        || userAReady === true
                      ) {
                        return -1;
                      }

                      return 0;
                    })
                    .map((user, i) => {
                      const userReady = lobbyData.usersReady?.includes(user.uid);
                      return (
                        <Button
                          title={this.userTitle(user, userReady, isHost)}
                          key={i}
                          raised={userReady}
                          containerStyle={{ marginVertical: 1, borderWidth: Constants.platform.ios && userReady ? 0.3 : 0, borderColor: 'lightgray' }}
                          buttonStyle={{ justifyContent: 'space-between', backgroundColor: 'transparent', paddingVertical: 5 }}
                          icon={<Icon name="angle-right" color={!userReady ? 'transparent' : 'black'} type="font-awesome" style={{ paddingHorizontal: 3, paddingVertical: 0 }} />}
                          iconRight
                          onPress={() => userReady && this.props.navigation.navigate('UserSelections', { user: user })}
                          onLongPress={() => isHost && this.setState({ removeUserOverlay: true, removeUserOverlayUser: user })}
                        />
                      );
                    })
                  }
                </Card>
              </View>
            </ScrollView>
            <View style={{ marginBottom: 10, marginTop: 3 }}>
              <Button
                title="Make Selections"
                disabled={!lobbyData.location}
                raised
                titleStyle={{ color: 'white', fontWeight: 'bold', fontSize: 26 }}
                buttonStyle={{ backgroundColor: ThemeColors.text }}
                containerStyle={{ marginTop: 10 }}
                onPress={() => this.props.navigation.navigate('MakeSelections')}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {
                  isHost && lobbyData.finalDecision && (
                    <Button
                      title="Reset Decision"
                      disabled={!lobbyData.finalDecision}
                      raised
                      titleStyle={{ color: ThemeColors.text, fontWeight: 'bold', fontSize: 25 }}
                      buttonStyle={{ backgroundColor: 'white', borderColor: 'lightgray', borderWidth: 0.5 }}
                      containerStyle={{ marginTop: 10, marginRight: 10, flex: 1 }}
                      onPress={() => this.resetFinalDecision()}
                    />
                  )
                }
                <Button
                  title={isHost && !lobbyData.finalDecision ? "Calculate Final Decision" : "Final Decision"}
                  disabled={isHost ? !lobbyData.finalDecision && lobbyData.usersReady?.length === 0 : !lobbyData.finalDecision}
                  raised
                  titleStyle={{ color: 'white', fontWeight: 'bold', fontSize: 26 }}
                  buttonStyle={{ backgroundColor: ThemeColors.text }}
                  containerStyle={{ marginTop: 10, flex: 1 }}
                  onPress={() => lobbyData.finalDecision ? this.goToFinalDecision() : this.getFinalDecision()}
                />
              </View>
            </View>
          </View>
        )}
      </HeaderHeightContext.Consumer>
    );
  }
}

export default LobbyView;
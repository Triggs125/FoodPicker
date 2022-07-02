import { collection, deleteDoc, doc, getDocs, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { Component } from "react";
import { Dimensions, Share, StatusBar, View } from "react-native";
import { Card, Icon, Text, Button, Overlay } from 'react-native-elements';
import Constants from 'expo-constants';
import { HeaderHeightContext } from '@react-navigation/elements';
import { ScrollView } from "react-native-gesture-handler";
import ThemeColors from "../../assets/ThemeColors";
import LocationView from "./LocationView";
import { ScreenWidth } from "react-native-elements/dist/helpers";
import { getDistance } from 'geolib';
import LoadingSpinner from "../LoadingSpinner";
import * as Analytics from 'expo-firebase-analytics';
import FoodChoiceCard from "../Selections/FoodChoiceCard";

class LobbyView extends Component {
  constructor(props) {
    super(props);

    this.state = {
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
    this.goToFinalDecision = this.goToFinalDecision.bind(this);
    this.getFinalDecision = this.getFinalDecision.bind(this);
    this.resetFinalDecision = this.resetFinalDecision.bind(this);
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
        if (![2, 3, 4].includes(index)) {
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
      Analytics.logEvent("exception", {
        description: "LobbyView::componentDidAppear::lobbyRefNotPresent"
      });
    }
    const unsubscribeLobby = onSnapshot(lobbyRef, async (lobby) => {
      const { user, db } = this.props;
      if (user && lobby) {
        if (this.state.lobbyData == {}) {
          this.setState({ loading: true });
        }
        const lobbyData = lobby.data();
        try {
          const isHost = lobbyData.host === user.uid;
          const matchingUsers = (await getDocs(query(collection(db, 'users'), where('uid', 'in', [...lobbyData.users, lobbyData.host]))));
          const lobbyUsers = matchingUsers.docs.map((doc) => { return { ...doc.data(), id: doc.id } });
          this.setState({ lobbyData: { ...lobbyData, ref: lobby.ref }, lobbyName: lobbyData.name, lobbyUsers, isHost });
          this.props.setLobbyData({ ...lobbyData, ref: lobby.ref });
        } catch (err) {
          Analytics.logEvent("exception", {
            description: "LobbyView::componentDidAppear::unsubscribeLobby"
          });
          console.error("LobbyView::componentDidAppear::unsubscribeLobby", err);
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

  share() {
    const { lobbyData } = this.state;
    const lobbyName = "lobbies/" + lobbyData.ref.id;
    Share.share({
      message: "Join me in picking a restaurant to go to! After logging into the FoodPicker app, paste this into the lobby search box: " + lobbyName,
      title: "Join this Food Picker Lobby!",
    }, {
      subject: "Food Picker Lobby",
      dialogTitle: "Food Picker Lobby",
      tintColor: ThemeColors.text,
    })
      .then((action) => {
        Analytics.logEvent("event", {
          description: "LobbyView::share::" + action.activityType
        });
      })
      .catch(err => {
        Analytics.logEvent("exception", {
          description: "LobbyView::share"
        });
        console.error("LobbyView:share", err);
      });
  }

  userTitle(user, userReady, userIsHost) {
    const isHost = this.state.lobbyData?.host === user.uid;
    return (
      <>
        {
          isHost ? (
            <Text style={{ color: 'gray', alignSelf: 'center', width: 40 }}>Host</Text>
          ) : (
            userIsHost || user.uid === this.props.user.uid ? (
              <Icon
                name="person-remove"
                size={20}
                color={ThemeColors.text}
                containerStyle={{
                  marginRight: 5,
                  alignSelf: 'center',
                  width: 40,
                  marginLeft: -7,
                  paddingRight: 7
                }}
              />
            ) : (
              <Text style={{ width: 40 }}>{''}</Text>
            )
          )
        }
        <Text
          style={{
            fontSize: 18,
            color: userReady ? 'green' : 'black',
            marginRight: 8,
            maxWidth: ScreenWidth - 152,
            textAlign: 'center'
          }}
          ellipsizeMode='tail'
          numberOfLines={1}
        >
          {
            user.firstName || user.lastName ?
              `${user.firstName ? user.firstName : ""}${user.lastName && " " + user.lastName}` :
              user.displayName
          }
        </Text>
        <Icon
          name="angle-right"
          color={!userReady ? 'transparent' : 'black'}
          type="font-awesome"
          style={{
            paddingHorizontal: 3,
            paddingVertical: 0,
            width: 40,
            marginRight: -10
          }}
        />
      </>
    );
  }

  removeUser(user) {
    if (user.uid === this.state.lobbyData.host) { // Host can not be removed
      return;
    }
    const { lobbyData } = this.state;
    let users = lobbyData.users;
    users = users.filter(uid => uid !== user.uid);
    const usersReady = lobbyData.usersReady || [];
    const indexUR = usersReady?.indexOf(this.props.user.uid);
    if (indexUR > -1) {
      usersReady.splice(indexUR, 1);
    }
    return setDoc(lobbyData.ref, { users, usersReady }, { merge: true })
      .then(() => {
        deleteDoc(doc(this.props.db, `food_selections/${lobbyData.ref.id}_${this.props.user.uid}`))
          .then(() => {
            Analytics.logEvent("event", {
              description: "LobbyView::removeUser::deleteDoc"
            });
          })
          .catch(err => {
            Analytics.logEvent("exception", {
              description: "LobbyView::removeUser::deleteDoc"
            });
            console.error("LobbyView::removeUser::deleteDoc", err);
          });
      });
  }

  setLocationData(location, locationGeocodeAddress, distance, utcOffset) {
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
    if (utcOffset) {
      data.utcOffset = utcOffset;
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

    this.setState({ decisionLoading: true });

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
            // this.props.navigation.navigate("PlaceDetails", { foodChoice: finalSelection, finalDecision: true });
            this.setState({ decisionLoading: false });
            Analytics.logEvent("event", {
              description: "LobbyView::getFinalDecision::decisionMade"
            });
          })
          .catch(err => {
            Analytics.logEvent("exception", {
              description: "LobbyView::getFinalDecision::" + err.message
            });
            console.error("LobbyView::getFinalDecision", err);
            this.setState({ decisionLoading: false });
          });
      })
      .catch(err => {
        Analytics.logEvent("exception", {
          description: "LobbyView::getFinalDecision"
        });
        console.error("LobbyView::getFinalDecision", err);
        this.setState({ decisionLoading: false });
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
      console.log("Returning")
      return matchingSelections[0];
    }

    // Filter selections based on max rating
    const maxRatingObjects = {};
    matchingSelections.forEach(s => {
      maxRatingObjects[s.id] = s.rating;
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
    this.setState({ decisionLoading: true });
    setDoc(this.state.lobbyData.ref, { finalDecision: null }, { merge: true })
      .then(() => {
        this.setState({ decisionLoading: false });
        Analytics.logEvent("event", {
          description: "LobbyView::resetFinalDecision"
        });
      })
      .catch(err => {
        Analytics.logEvent("exception", {
          description: "LobbyView::resetFinalDecision"
        });
        console.error("LobbyView::resetFinalDecision", err);
        this.setState({ decisionLoading: false });
      });
  }

  goToFinalDecision() {
    this.props.navigation.navigate("PlaceDetails", { foodChoice: this.state.lobbyData.finalDecision, finalDecision: true });
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
          ellipsizeMode='tail'
          numberOfLines={1}
        >
          {removeUserOverlayUser?.displayName && removeUserOverlayUser?.displayName !== ""
            ? removeUserOverlayUser?.displayName
            : `${removeUserOverlayUser?.firstName}${removeUserOverlayUser?.lastName ?? " " + removeUserOverlayUser?.lastName}`}
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
                Analytics.logEvent("exception", {
                  description: "LobbyView::RemoveUserOverlay"
                });
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
      lobbyData, lobbyName, lobbyUsers, isHost, loading, decisionLoading
    } = this.state;

    const { user, navigation, setKickedFromLobby } = this.props;

    if (!loading && !lobbyData.users?.includes(user.uid)) {
      setKickedFromLobby(true);
      navigation.navigate("LobbyPicker");
      Analytics.logEvent("event", {
        description: "LobbyView::render::userKickedFromLobby"
      });
    }

    return (
      <View
        style={{
          paddingHorizontal: 10,
          paddingTop: 10,
          flex: 1,
          justifyContent: 'space-between',
        }}
      >
        {this.removeUserOverlay()}
        <View
          style={{ flexDirection: "row", justifyContent: 'space-between', width: ScreenWidth - 20 }}
        >
          <Button
            buttonStyle={{ backgroundColor: 'transparent' }}
            icon={<Icon name="settings" color={isHost ? 'black' : 'transparent'} />}
            onPress={() => isHost && !loading && navigation.navigate("LobbyCreator", { lobbyData })}
          />
          <Text
            style={{ fontSize: 24, width: ScreenWidth - 120, alignSelf: 'center', textAlign: 'center' }}
            ellipsizeMode='tail'
            numberOfLines={1}
          >
            {lobbyName}
          </Text>
          <Button
            type='clear'
            titleStyle={{ color: ThemeColors.text }}
            onPress={() => !loading && this.share()}
            icon={{
              name: 'share',
              type: 'feather',
              color: loading ? 'transparent' : 'black'
            }}
          />
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
        >
          {
            (lobbyData?.finalDecision || isHost) && (
              <Card
                containerStyle={{
                  marginHorizontal: 0,
                  marginBottom: 5,
                  marginTop: 10,
                  borderRadius: 10,
                  borderColor: 'lightgray',
                  padding: 0
                }}
                wrapperStyle={{
                  marginHorizontal: 0
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    alignSelf: 'center',
                    marginTop: 10,
                    marginBottom: 5,
                    fontWeight: 'bold'
                  }}
                >
                  Final Decision
                </Text>
                {(lobbyData.finalDecision || decisionLoading) && (
                  <View style={{ marginHorizontal: 5, marginBottom: 5 }}>
                    {
                      decisionLoading
                      ? <LoadingSpinner style={{ paddingVertical: 28 }} />
                      : (
                        <FoodChoiceCard
                          i={0}
                          foodChoice={lobbyData.finalDecision}
                          lobbyData={lobbyData}
                          navigation={navigation}
                          deleteFunction={this.resetFinalDecision}
                          finalDecision={true}
                        />
                      )
                    }
                  </View>
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 5 }}>
                  {
                    isHost && (
                      <Button
                        title={
                          decisionLoading ?
                            'Analyzing Restaurants...' :
                            !lobbyData.finalDecision ? "Calculate Decision" : "Recalulate Decision"
                        }
                        disabled={!(lobbyData.finalDecision || lobbyData.usersReady?.length > 0) || decisionLoading}
                        raised
                        titleStyle={{ color: ThemeColors.text, fontWeight: 'bold', fontSize: 26 }}
                        buttonStyle={{ backgroundColor: 'transparent', borderRadius: 10, borderWidth: 0.5, borderColor: 'lightgray' }}
                        containerStyle={{ marginBottom: 10, marginTop: 5, marginHorizontal: 5, flex: 1, borderRadius: 10 }}
                        onPress={this.getFinalDecision}
                      />
                    )
                  }
                </View>
                {
                  !(lobbyData.finalDecision || lobbyData.usersReady?.length > 0) && (
                    <Text
                      style={{
                        paddingHorizontal: 15,
                        paddingBottom: 10,
                        fontSize: 15,
                        alignSelf: 'center'
                      }}
                    >
                      *At least one person must make selections
                    </Text>
                  )
                }
              </Card>
            )
          }
          <LocationView
            {...this.props}
            setLocationData={this.setLocationData}
            location={lobbyData?.location}
            locationGeocodeAddress={lobbyData?.locationGeocodeAddress}
            distance={lobbyData?.distance}
            isHost={isHost}
            loading={loading}
          />
          <View style={{ justifyContent: 'space-between', marginBottom: 10, marginTop: -10 }}>
            <Card containerStyle={{ marginHorizontal: 0, borderRadius: 10, borderColor: 'lightgray' }}>
              <Card.Title>People Ready: {this.numberOfUsersReady() || 0} of {lobbyUsers?.length || 0}</Card.Title>
              <Card.Divider />
              {
                loading ? (
                  <LoadingSpinner />
                ) : (
                  <View>
                    {
                      isHost ? (
                        <Text style={{ fontSize: 12, marginBottom: 2, marginTop: -5 }}>*Hold down any user to remove them</Text>
                      ) : (
                        <Text style={{ fontSize: 12, marginBottom: 2, marginTop: -5 }}>*Hold down your user to remove yourself</Text>
                      )
                    }
                    {
                      lobbyUsers &&
                      lobbyUsers
                        .sort((userA, userB) => {
                          const userAReady = lobbyData.usersReady?.includes(userA.uid);
                          const userBReady = lobbyData.usersReady?.includes(userB.uid);
                          // Host is always on top
                          if (userB.uid === lobbyData.host) return 1;
                          if (userA.uid === lobbyData.host) return -1;
                          // Current user is always second
                          if (userB.uid === this.props.user.uid) return 1;
                          if (userA.uid === this.props.user.uid) return -1;
                          // Group everyone that's ready next
                          if (userBReady === true) return 1;
                          if (userAReady === true) return -1;
                          // Everyone not ready stays at the bottom
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
                              onPress={() => userReady && this.props.navigation.navigate('UserSelections', { user: user })}
                              onLongPress={() => {
                                ((isHost && user.uid !== lobbyData.host) || (user.uid === this.props.user.uid && user.uid !== lobbyData.host)) && this.setState({ removeUserOverlay: true, removeUserOverlayUser: user })
                              }}
                            />
                          );
                        })
                    }
                  </View>
                )
              }
            </Card>
          </View>
        </ScrollView>
        <View style={{ marginBottom: 10, marginTop: 5 }}>
          <Button
            title="Make Selections"
            disabled={!lobbyData.location}
            raised
            titleStyle={{ color: 'white', fontWeight: 'bold', fontSize: 26 }}
            buttonStyle={{ backgroundColor: ThemeColors.text }}
            containerStyle={{ marginTop: 0 }}
            onPress={() => this.props.navigation.navigate('MakeSelections')}
          />
        </View>
      </View>
    );
  }
}

export default LobbyView;
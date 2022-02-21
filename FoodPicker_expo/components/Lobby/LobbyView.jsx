import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, doc, getDocs, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { Component } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Card, Icon, Input, Text, Button } from 'react-native-elements';
import Constants from 'expo-constants';
import { HeaderHeightContext } from '@react-navigation/elements';
import { ScrollView } from "react-native-gesture-handler";
import ThemeColors from "../../assets/ThemeColors";
import LocationView from "./LocationView";
import { ScreenWidth } from "react-native-elements/dist/helpers";

class LobbyView extends Component {
  constructor(props) {
    super(props);

    const offset = Constants.platform.android ? 48 : 0;
    const screenHeight = Dimensions.get('screen').height - offset;

    this.state = {
      screenHeight: screenHeight,
      loading: true,
      lobbyData: {},
      lobbyRef: {},
      lobbyName: "",
      isHost: false,
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
          if (!isHost && !lobbyData.users?.includes(user.uid)) {
            await setDoc(lobby.ref, { users: [...lobbyData.users, user.uid] }, { merge: true});
            console.log("User added to lobby users")
          } else {
            const matchingUsers = (await getDocs(query(collection(db, 'users'), where('uid', 'in', [...lobbyData.users, lobbyData.host]))));
            const lobbyUsers = matchingUsers.docs.map((doc) => { return {...doc.data(), id: doc.id} });
            this.setState({ lobbyData: {...lobbyData, ref: lobby.ref}, lobbyName: lobbyData.name, lobbyUsers, isHost });
            this.props.setLobbyData({...lobbyData, ref: lobby.ref})
          }
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
  }

  numberOfUsersReady() {
    const { lobbyUsers, lobbyData } = this.state;
    return lobbyUsers?.filter(user => lobbyData.usersReady?.includes(user.uid)).length;
  }

  copyShareLink() {

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
              <Text></Text>
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
    setDoc(lobbyData.ref, { users: newUsers }, { merge: true });
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

  render() {
    const { lobbyData, lobbyName, lobbyUsers, isHost, screenHeight, loading } = this.state;

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
            <View style={{ display: 'flex', flexDirection: "row", justifyContent: 'space-between', width: ScreenWidth - 20 }}>
              {
                isHost ? (
                  <Button
                    buttonStyle={{ backgroundColor: 'transparent' }}
                    icon={<Icon name="settings" />}
                  />
                ) : (
                  <Text></Text>
                )
              }
              <Text
                style={{ fontSize: 24, alignSelf: 'center' }}
                ellipsizeMode='tail'
              >
                {lobbyName}
              </Text>
              <Button
                buttonStyle={{ backgroundColor: 'transparent' }}
                onPress={this.copyShareLink()}
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
              <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginBottom: 10 }}>
                <Card containerStyle={{ marginHorizontal: 0, borderRadius: 10, borderColor: 'lightgray' }}>
                  <Card.Title>People Ready: {this.numberOfUsersReady()} of {lobbyUsers?.length}</Card.Title>
                  <Card.Divider />
                  {
                    isHost &&
                    <Text style={{ fontSize: 12, marginBottom: 2, marginTop: -5 }}>*Hold down to remove user</Text>
                  }
                  {
                    lobbyUsers?.map((user, i) => {
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
                          onLongPress={() => isHost && this.removeUser(user)}
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
              <Button
                title="Get Final Decision"
                disabled={isHost ? !lobbyData.location || !lobbyData.usersReady || lobbyData.usersReady.length === 0 : !lobbyData.finalDecisionReady}
                raised
                titleStyle={{ color: 'white', fontWeight: 'bold', fontSize: 26 }}
                buttonStyle={{ backgroundColor: ThemeColors.text }}
                containerStyle={{ marginTop: 10 }}
                onPress={() => {}}
              />
            </View>
          </View>
        )}
      </HeaderHeightContext.Consumer>
    );
  }
}

export default LobbyView;
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
      lobbyNameEditable: false,
      lobbyName: "",
      isHost: false,
    }
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

  async updateName() {
    const { lobbyNameEditable, lobbyData, lobbyName } = this.state;
    if (lobbyNameEditable) {
      await setDoc(lobbyData.ref, { name: lobbyName }, { merge: true });
    }
    this.setState({ lobbyNameEditable: !lobbyNameEditable });
  }

  userTitle(user, userReady) {
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
        <Text style={{ color: isHost ? 'gray' : 'transparent', alignSelf: 'center' }}>Host</Text>
      </>
    );
  }

  render() {
    const { lobbyData, lobbyName, lobbyUsers, isHost, lobbyNameEditable, lobbyNameRef, screenHeight, loading } = this.state;
    return (
      <HeaderHeightContext.Consumer>
        {headerHeight => (
          <View
            style={{
              paddingLeft: 20,
              paddingRight: 20,
              paddingTop: 10,
              height: screenHeight - headerHeight,
              justifyContent: 'space-between',
            }}
          >
            <View style={{ display: 'flex', flexDirection: "row", justifyContent: 'flex-start' }}>
              <Input
                value={lobbyName}
                autoFocus={lobbyNameEditable}
                style={{ textAlign: 'center', fontSize: 30 }}
                leftIcon={isHost && <Button buttonStyle={{ backgroundColor: 'transparent' }} onPress={() => this.updateName()} icon={<Icon name={lobbyNameEditable ? "check" : "edit"} type="font-awesome" />} />}
                editable={lobbyNameEditable}
                onChange={(event) => this.setState({ lobbyName: event.nativeEvent.text })}
                rightIcon={<Button buttonStyle={{ backgroundColor: 'transparent' }} onPress={this.copyShareLink()} icon={<Icon name="share" type="font-awesome" />} />}
              />
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
            >
              <LocationView {...this.props} user={this.props.user} lobbyData={lobbyData} isHost={isHost} loading={loading} />
              <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginVertical: 10 }}>
                <Card containerStyle={{ marginHorizontal: 0, borderRadius: 10, borderColor: 'lightgray' }}>
                  <Card.Title>People Ready: {this.numberOfUsersReady()} of {lobbyUsers?.length}</Card.Title>
                  <Card.Divider />
                  {
                    lobbyUsers?.map((user, i) => {
                      const userReady = lobbyData.usersReady?.includes(user.uid);
                      return (
                        <Button
                          title={this.userTitle(user, userReady)}
                          key={i}
                          containerStyle={{ marginVertical: -2 }}
                          buttonStyle={{ justifyContent: 'space-between', backgroundColor: 'transparent' }}
                          icon={<Icon name="angle-right" color={!userReady ? 'transparent' : 'black'} type="font-awesome" style={{ paddingHorizontal: 3, paddingVertical: 0 }} />}
                          iconRight
                          onPress={() => userReady && this.props.navigation.navigate('UserSelections', { user: user })}
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
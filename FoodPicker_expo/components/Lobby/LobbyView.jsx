import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, doc, getDocs, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { Component } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Card, Icon, Input, Text, Button } from 'react-native-elements';
import { ScrollView } from "react-native-gesture-handler";
import ThemeColors from "../../assets/ThemeColors";
import LocationView from "./LocationView";

class LobbyView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      lobbyData: {},
      lobbyRef: {},
      lobbyNameEditable: false,
      lobbyName: "",
      isHost: false,
      screenHeight: Dimensions.get('window').height
    }
  }

  componentDidMount() {
    this.componentFocusUnsub = this.props.navigation.addListener('focus', () => {
      this.componentDidAppear();
    });
  }

  componentDidAppear() {
    const { lobbyRef } = this.props.route?.params;
    if (!lobbyRef) {
      this.props.navigation.navigate('LobbyPicker');
    }
    const unsubscribeLobby = onSnapshot(lobbyRef, async (lobby) => {
      const { user, db } = this.props;
      if (user) {
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
    return (
      <>
        <Text style={{ color: userReady ? 'green' : 'red' }}>{`${user.firstName} ${user.lastName ?? user.lastName}`}</Text>
        {userReady && <Icon name="user" type="font-awesome" iconStyle={{ color: 'white' }} style={{ alignSelf: 'flex-start', height: 0 }} />}
      </>
    )
  }

  render() {
    const { lobbyData, lobbyName, lobbyUsers, isHost, lobbyNameEditable, lobbyNameRef, screenHeight, loading } = this.state;
    return (
      <ScrollView>
        <View style={styles.container}>
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
          {
            !loading && (
              <LocationView {...this.props} lobbyData={lobbyData} isHost={isHost} />
            )
          }
          <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginVertical: 10 }}>
            <Card containerStyle={{ marginHorizontal: 0, borderRadius: 10 }}>
              <Card.Title>People Ready: {this.numberOfUsersReady()} of {lobbyUsers?.length}</Card.Title>
              <Card.Divider />
              {
                lobbyUsers?.map((user, i) => {
                  const userReady = lobbyData.usersReady?.includes(user.uid);
                  return (
                    <Button
                      title={this.userTitle(user, userReady)}
                      key={i}
                      buttonStyle={{ justifyContent: userReady ? 'space-between' : 'center', backgroundColor: 'transparent' }}
                      icon={userReady && <Icon name="angle-right" type="font-awesome" style={{ paddingLeft: 3, paddingRight: 3, paddingTop: 0, paddingBottom: 0 }} />}
                      iconRight
                    />
                  );
                })
              }
            </Card>
            <View style={{ marginVertical: 10 }}>
              <Button
                title="Make Selections"
                raised
                titleStyle={{ color: 'white', fontWeight: 'bold', fontSize: 26 }}
                buttonStyle={{ backgroundColor: ThemeColors.text }}
                containerStyle={{ marginTop: 10, marginBottom: 10 }}
                onPress={() => this.props.navigation.navigate('MakeSelections', { lobbyData: lobbyData })}
              />
              {
                isHost &&
                <Button
                  title="Get Final Decision"
                  raised
                  titleStyle={{ color: 'white', fontWeight: 'bold', fontSize: 26 }}
                  buttonStyle={{ backgroundColor: ThemeColors.text }}
                  containerStyle={{ marginTop: 10, marginBottom: 10 }}
                  onPress={() => {}}
                />
              }
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 10,
    height: '100%',
    display: 'flex',
    justifyContent: 'flex-start',
  },
});

export default LobbyView;
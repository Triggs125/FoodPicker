import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, doc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { Component } from "react";
import { StyleSheet, View } from "react-native";
import { Card, Icon, Input, Text } from 'react-native-elements';
import { Button } from "react-native-elements/dist/buttons/Button";

class LobbyView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      lobbyData: {},
      lobbyRef: {},
      lobbyNameEditable: false,
    }
  }

  componentDidMount() {
    const { lobbyRef } = this.props.route?.params;
    if (!lobbyRef) {
      this.props.navigation.navigate('LobbyPicker');
    }
    AsyncStorage.setItem('foodPicker_currentLobby', JSON.stringify(lobbyRef));
    const unsubscribeLobby = onSnapshot(lobbyRef, async (lobbyRef) => {
      const lobbyData = lobbyRef.data();
      const whereClauses = [...lobbyData.users, lobbyData.host].map(uid => where('uid', '==', uid));
      const lobbyUsers = (await getDocs(
        query(collection(this.props.db, 'users'), ...whereClauses))
      ).docs.map((doc) => { return {...doc.data(), id: doc.id} });

      const isHost = lobbyData.host === this.props.user.uid;

      this.setState({ lobbyData: {...lobbyData, ref: lobbyRef}, lobbyUsers, isHost });
    });
    this.setState({ unsubscribeLobby });
  }

  componentWillUnmount() {
    this.state.unsubscribeLobby && this.state.unsubscribeLobby();
  }

  numberOfUsersReady() {
    const { lobbyUsers, lobbyData } = this.state;
    return lobbyUsers?.filter(user => lobbyData.usersReady?.contains(user.uid)).length;
  }

  copyShareLink() {

  }

  render() {
    const { lobbyData, lobbyUsers, isHost, lobbyNameEditable, lobbyNameRef } = this.state;
    return (
      <View style={styles.container}>
        <View style={{ display: 'flex', flexDirection: "row", justifyContent: 'center' }}>
          <Input
            value={lobbyData?.name}
            autoFocus={lobbyNameEditable}
            style={{ textAlign: 'center', fontSize: 30 }}
            leftIcon={isHost && <Button onPress={() => this.setState({ lobbyNameEditable: !lobbyNameEditable })} icon={<Icon name={lobbyNameEditable ? "check" : "edit"} type="font-awesome" />} />}
            editable={lobbyNameEditable}
            rightIcon={<Button onPress={this.copyShareLink()} icon={<Icon name="share" type="font-awesome" />} />}
          />
        </View>
        <Card>
          <Card.Title>Ready: {this.numberOfUsersReady()} of {lobbyUsers?.length}</Card.Title>
          <Card.Divider />
          {
            lobbyUsers?.map(user => {
              const userReady = lobbyData.usersReady?.contains(user.uid);
              return (
                <Button
                  title={`${user.firstName} ${user.lastName ?? user.lastName}`}
                  titleStyle={{ color: userReady ? 'green' : 'red' }}
                  buttonStyle={{ justifyContent: userReady ? 'space-between' : 'flex-end' }}
                  icon={userReady && <Icon name="angle-right" type="font-awesome" style={{ paddingLeft: 3, paddingRight: 3 }} />}
                  iconRight
                />
              );
            })
          }
        </Card>
      </View>
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
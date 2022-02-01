import { Component } from "react";
import { SafeAreaView, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { Button, Card, Icon } from 'react-native-elements';
import LoadingSpinner from '../LoadingSpinner';
import { ScrollView } from "react-native-gesture-handler";
// import ThemeColors from '../../assets/ThemeColors';
import SearchAlgolia from "../Algolia/SearchAlgolia";
import { addDoc, collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';

class LobbyPicker extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      searchLoading: false,
      error: false,
      userLobbiesUnsubscribe: () => {},
    }

    this.createLobby = this.createLobby.bind(this);
    this.getLobbyRef = this.getLobbyRef.bind(this);
    this.lobbyComponent = this.lobbyComponent.bind(this);
  }

  componentDidMount() {
    const { user } = this.props;
    if (!user) {
      this.setState({ user: undefined, userLobbiesUnsubscribe: undefined });
      this.props.navigation.navigate('Account');
    }
  }

  componentDidUpdate(newProps) {
    const { user } = this.props;
    if (user !== newProps.user) {
      this.state.userLobbiesUnsubscribe && this.state.userLobbiesUnsubscribe();
      if (user) {
        this.addUserSubscription();
      }
    }
  }

  componentWillUnmount() {
    const { userLobbiesUnsubscribe } = this.state;
    userLobbiesUnsubscribe && userLobbiesUnsubscribe();
  }

  addUserSubscription() {
    const { user, db } = this.props;
    const userLobbiesUnsubscribe = onSnapshot(query(collection(db, 'lobbies'), where('host', '==', user.uid)), (lobbies) => { 
      let userLobbies = [];
      lobbies.forEach((lobby) => {
        userLobbies.push({ ...lobby.data(), path: lobby.ref.path });
      });
      this.setState({ userLobbies });
    });
    this.setState({ userLobbiesUnsubscribe, user });
  }

  getLobbyRef(lobby) {
    return doc(this.props.db, lobby.path);
  }

  lobbyComponent(lobby, i) {
    return (
      <Button
        key={i}
        title={lobby.arrow === false ? {textAlign: 'center'} : lobby.name}
        buttonStyle={styles.lobbyButton}
        titleStyle={styles.name}
        icon={lobby?.arrow === false ? <></> : <Icon name="angle-right" type="font-awesome" />}
        iconRight
        onPress={() => {
          if (lobby.arrow === undefined || lobby.arrow === true) {
            const lobbyRef = this.getLobbyRef(lobby);
            this.props.navigation.navigate('LobbyView', { lobbyRef });
          }
        }}
      />
    );
  }

  async createLobby() {
    const docRef = await addDoc(collection(this.props.db, 'lobbies'), {
      host: this.props.user.uid,
      name: 'Default Lobby',
      users: [],
    });
    this.props.navigation.navigate('LobbyView', { lobbyRef: docRef });
  }

  render() {
    const { loading } = this.state;
    if (!this.props.user) this.props.navigation.navigate('Account');
    return (
      <SafeAreaView>
        <ScrollView>
          <LoadingSpinner spinning={loading} />
          <View style={styles.container}>
            <Button
              title="Create a Lobby"
              raised
              icon={{
                name: 'home',
                type: 'font-awesome',
                color: 'white',
                marginRight: 8
              }}
              titleStyle={{ fontWeight: '500', fontSize: 22 }}
              buttonStyle={{
                backgroundColor: '#E54040',
                borderColor: 'transparent',
                borderWidth: 0,
                height: 60,
              }}
              containerStyle={{
                width: '100%',
                alignSelf: 'center',
                marginTop: 10,
                overflow: 'visible'
              }}
              onPress={this.createLobby}
            />
            <Card
              id="user-lobbies"
              containerStyle={styles.cardContainer}
            >
              <Card.Title style={styles.cardTitle}>Your Lobbies</Card.Title>
              <ScrollView style={{ maxHeight: 140 }}>
                {this.state.userLobbies?.map((lobby, i) => {
                  return this.lobbyComponent(lobby, i);
                })}
              </ScrollView>
            </Card>
            <Card
              id="search-for-lobbies"
              containerStyle={styles.cardContainer}
            >
              <Card.Title style={styles.cardTitle}>Lobby Search</Card.Title>
              <SearchAlgolia lobbyComponent={this.lobbyComponent} db={this.props.db} />
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: 20,
    paddingRight: 20,
    height: '100%',
    display: 'flex',
    justifyContent: 'flex-start',
  },
  button: {
    width: '100%',
    marginTop: 20,
    alignSelf: 'center',
  },
  cardContainer: {
    overflow: 'scroll',
    backgroundColor: 'transparent',
    paddingBottom: 15,
    marginLeft: 0,
    marginRight: 0,
  },
  cardTitle: {
    fontSize: 24,
    color: 'black',
  },
  lobbyButton: {
    paddingTop: 5,
    paddingBottom: 5,
    marginBottom: 3,
    backgroundColor: 'white',
    display: 'flex',
    justifyContent: 'space-between'
  },
  name: {
    textAlign: 'left',
    fontSize: 18,
    color: 'black',
  }
});

export default LobbyPicker;
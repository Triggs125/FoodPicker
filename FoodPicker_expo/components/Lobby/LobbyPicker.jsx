import { Component } from "react";
import { SafeAreaView, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { Button, Card, Icon, Text } from 'react-native-elements';
import LoadingSpinner from '../LoadingSpinner';
import { ScrollView } from "react-native-gesture-handler";
// import ThemeColors from '../../assets/ThemeColors';
import SearchAlgolia from "../Algolia/SearchAlgolia";
import { addDoc, collection, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

class LobbyPicker extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      searchLoading: false,
      error: false,
    }

    this.createLobby = this.createLobby.bind(this);
    this.getLobbyRef = this.getLobbyRef.bind(this);
    this.lobbyComponent = this.lobbyComponent.bind(this);
    this.refreshLobbySearch = this.refreshLobbySearch.bind(this);
  }

  componentDidMount() {
    onAuthStateChanged(this.props.auth, () => {
      if (this.state.userLobbiesUnsubscribe) {
        this.state.userLobbiesUnsubscribe();
      }
      const userLobbiesUnsubscribe = this.userLobbiesUnsubscribe();
      this.setState({ userLobbiesUnsubscribe });
    });
    if (this.props.user && !this.state.userLobbies) {
      const userLobbiesUnsubscribe = this.userLobbiesUnsubscribe();
      this.setState({ userLobbiesUnsubscribe });
    }
  }

  componentWillUnmount() {
    const { userLobbiesUnsubscribe } = this.state;
    userLobbiesUnsubscribe && userLobbiesUnsubscribe();
  }

  userLobbiesUnsubscribe() {
    const { user, db } = this.props;
    return onSnapshot(
      query(
        collection(db, 'lobbies'),
        where('users', 'array-contains', user.uid),
        where('active', '==', true)
      ),
      (lobbies) => {
        let userLobbies = [];
        lobbies.forEach((lobby) => {
          userLobbies.push({ ...lobby.data(), path: lobby.ref.path, id: lobby.ref.id });
        });
        this.setState({ userLobbies });
      },
      (error) => {
        console.error("App::onAuthStateChanged", error)
      },
      () => { // Auth Complete (ie. user logged out)
        this.setState({ userLobbiesUnsubscribe: userLobbiesUnsubscribe });
      }
    );
  }

  getLobbyRef(lobby) {
    return doc(this.props.db, lobby.path);
  }

  lobbyComponent(lobby, i) {
    if (!lobby.active) return;
    return (
      <Button
        key={i}
        title={lobby.arrow === false ? {textAlign: 'center'} : lobby.name}
        buttonStyle={styles.lobbyButton}
        containerStyle={{ margin: 1 }}
        raised
        titleStyle={styles.name}
        icon={lobby?.arrow === false ? <></> : <Icon name="angle-right" type="font-awesome" />}
        iconRight
        onPress={() => {
          if (lobby.arrow === undefined || lobby.arrow === true) {
            const lobbyRef = this.getLobbyRef(lobby);
            this.props.navigation.navigate('LobbyView', { lobbyRef });
          }
        }}
        onLongPress={() => {
          let isUserLobby = lobby.host === this.props.user.uid
          if (isUserLobby) {
            this.removeLobby(lobby);
          }
        }}
      />
    );
  }

  refreshLobbySearch() {
    this.setState({ refresh: true }, () => {
      this.setState({ refresh: false });
    });
  }

  async createLobby() {
    const docRef = await addDoc(collection(this.props.db, 'lobbies'), {
      host: this.props.user.uid,
      name: 'Default Lobby',
      users: [this.props.user.uid],
      active: true,
    });
    this.props.navigation.navigate('LobbyView', { lobbyRef: docRef });
  }

  async removeLobby(lobby) {
    try {
      await setDoc(doc(this.props.db, lobby.path), { active: false }, { merge: true });
      this.refreshLobbySearch();
    } catch (err) {
      console.log("LobbyPicker::removeLobby", err);
    }
  }

  render() {
    const { loading, refresh, userLobbies } = this.state;
    return (
      <SafeAreaView>
        {
          loading &&
          <LoadingSpinner />
        }
        <View style={styles.container}>
          <Button
            title="Create a Lobby"
            disabled={loading}
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
              height: 50,
            }}
            containerStyle={{
              width: '100%',
              alignSelf: 'center',
              marginTop: 10,
              overflow: 'visible'
            }}
            onPress={this.createLobby}
          />
          <ScrollView
            contentContainerStyle={{ paddingBottom: 10 }}
          >
            <Card
              id="user-lobbies"
              containerStyle={styles.cardContainer}
            >
              <Card.Title style={styles.cardTitle}>Your Lobbies</Card.Title>
              {
                userLobbies && userLobbies.length > 0 &&
                <Text style={{ fontSize: 12, marginBottom: 2, marginTop: -5 }}>*Remove Lobby by holding it down</Text>
              }
              {userLobbies?.map((lobby, i) => {
                return this.lobbyComponent(lobby, i);
              })}
            </Card>
            <Card
              id="search-for-lobbies"
              containerStyle={styles.cardContainer}
            >
              <Card.Title style={styles.cardTitle}>Lobby Search</Card.Title>
              <SearchAlgolia
                lobbyComponent={this.lobbyComponent}
                db={this.props.db}
                refreshHits={this.refreshLobbySearch}
                refresh={refresh}
              />
            </Card>
          </ScrollView>
        </View>
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
    backgroundColor: 'white',
    paddingBottom: 15,
    marginLeft: 0,
    marginRight: 0,
  },
  cardTitle: {
    fontSize: 24,
    color: 'black',
  },
  containerStyle: {
    marginTop: 1,
    marginBottom: 1,
  },
  lobbyButton: {
    paddingTop: 5,
    paddingBottom: 5,
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
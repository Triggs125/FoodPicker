import { Component } from "react";
import { SafeAreaView, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { Button, Card, Icon, Overlay, Text, Input } from 'react-native-elements';
import LoadingSpinner from '../LoadingSpinner';
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
// import ThemeColors from '../../assets/ThemeColors';
import SearchAlgolia from "../Algolia/SearchAlgolia";
import { collection, doc, getDocs, onSnapshot, query, setDoc, where, arrayUnion, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import ThemeColors from "../../assets/ThemeColors";
import { ScreenWidth } from "react-native-elements/dist/helpers";
import Password from "../Utils/Password";

class LobbyPicker extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      searchLoading: false,
      error: false,
      openOverlay: false,
      overlayLobby: null,
      overlayPasswordText: "",
      overlayPasswordShowing: false,
      overlayPasswordHash: "",
      overlayPasswordError: false,
      kickedMessage: false,
      removeLobbyOverlay: false,
      removeLobbyOverlayLobby: null,
      removeLobbyOverlayLoading: false,
      removeLobbyOverlayError: false,
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

    this.componentFocusUnsub = this.props.navigation.addListener('focus', () => {
      if (this.props.route?.params?.kickedFromLobby) {
        this.setState({ kickedMessage: true });
      }
    })

    this.componentBlurUnsub = this.props.navigation.addListener('blur', () => {
      this.setState({ loading: false });
      this.state.userLobbiesUnsubscribe && this.state.userLobbiesUnsubscribe();
    });
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

  getTitle(lobby) {
    const userOwned = lobby.host === this.props.user.uid;
    return (
      <View style={{ flexDirection: 'row', alignContent: 'center', justifyContent: 'flex-start' }}>
        {
          lobby.passwordProtected &&
          <Icon name="lock" size={18} containerStyle={{ marginRight: 5, alignSelf: 'center' }} />
        }
        <Text style={{ ...styles.name, alignSelf: 'center', color: userOwned ? ThemeColors.text : 'black' }}>{lobby.name}</Text>
      </View>
    )
  }

  async addUserToLobby(lobby) {
    await updateDoc(doc(this.props.db, lobby.path), { users: arrayUnion(this.props.user.uid) });
  }

  lobbyComponent(lobby, i) {
    if (!lobby.active) return;
    return (
      <Button
        key={i}
        title={this.getTitle(lobby)}
        buttonStyle={{ ...styles.lobbyButton }}
        containerStyle={{ margin: 1, borderWidth: 0.5, borderColor: 'lightgray' }}
        raised
        titleStyle={{ ...styles.name }}
        icon={lobby?.arrow === false ? <></> : <Icon name="angle-right" type="font-awesome" />}
        iconRight
        onPress={async () => {
          if (lobby.passwordProtected) {
            try {
              const passwordHash = (await getDocs(
                query(
                  collection(this.props.db, 'lobby_passwords'),
                  where('lobbyPath', '==', lobby.path)
                )
              )).docs[0]?.data().passwordHash;
              if (passwordHash && passwordHash.length > 0) {
                this.addUserToLobby(lobby);
                this.setState({ openOverlay: true, overlayLobby: lobby, overlayPasswordHash: passwordHash });
              }
            } catch(err) {
              console.error("LobbyPicker::lobbyComponent::onPress", err);
            }
          } else {
            this.addUserToLobby(lobby);
            const lobbyRef = this.getLobbyRef(lobby);
            this.props.navigation.navigate('LobbyView', { lobbyRef });
          }
        }}
        onLongPress={() => {
          let isUserLobby = lobby.host === this.props.user.uid
          if (isUserLobby) {
            this.setState({ removeLobbyOverlay: true, removeLobbyOverlayLobby: lobby });
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
    this.props.navigation.navigate("LobbyCreator");
  }

  async removeLobby(lobby) {
    return setDoc(doc(this.props.db, lobby.path), { active: false }, { merge: true })
      .then(() => {
        this.refreshLobbySearch();
      });
  }

  render() {
    const {
      loading, refresh, userLobbies,
      openOverlay, overlayLobby, overlayPasswordText,
      overlayPasswordShowing, overlayPasswordHash, overlayPasswordError,
      overlayLoading, kickedMessage,
      removeLobbyOverlay, removeLobbyOverlayLobby, removeLobbyOverlayLoading, removeLobbyOverlayError
    } = this.state;
    return (
      <SafeAreaView>
        {
          loading &&
          <LoadingSpinner />
        }
        <Overlay
          isVisible={removeLobbyOverlay}
          overlayStyle={{ width: ScreenWidth - 20, borderRadius: 10 }}
          onBackdropPress={() => {
            this.setState({
              removeLobbyOverlay: false,
              removeLobbyOverlayUser: null,
              removeLobbyOverlayLoading: false,
            });
          }}
        >
          <Text
            style={{ fontSize: 24, textAlign: 'center', marginTop: 10, marginBottom: 20 }}
          >
            {`${removeLobbyOverlayLobby?.name}`}
          </Text>
          {
            removeLobbyOverlayError && (
              <Text>Error removing the user. Please try again or contact support.</Text>
            )
          }
          <Button
            title="Remove Lobby"
            loading={removeLobbyOverlayLoading}
            titleStyle={{ fontSize: 24 }}
            buttonStyle={{ backgroundColor: ThemeColors.button }}
            onPress={() => {
              this.setState({ removeLobbyOverlayLoading: true });
              this.removeLobby(removeLobbyOverlayLobby)
                .then(() => {
                  this.setState({
                    removeLobbyOverlay: false,
                    removeLobbyOverlayLobby: null,
                    removeLobbyOverlayLoading: false,
                  });
                })
                .catch(err => {
                  console.log("LobbyView::RemoveLobbyOverlay", err);
                  this.setState({
                    removeLobbyOverlayLoading: false,
                    removeLobbyOverlayError: true,
                  });
                });
            }}
          />
          <Button
            title="Cancel"
            type="clear"
            disabled={removeLobbyOverlayLoading}
            titleStyle={{ color: ThemeColors.text, fontSize: 24 }}
            onPress={() => {
              this.setState({
                removeLobbyOverlay: false,
                removeLobbyOverlayLobby: null,
              });
            }}
          />
        </Overlay>
        <Overlay
          isVisible={kickedMessage}
          style={{ width: ScreenWidth - 20 }}
        >
          <Text style={{ fontSize: 20, marginBottom: 15, textAlign: 'center' }}>You have been kicked from the lobby</Text>
          <Button
            title="Continue"
            titleStyle={{ fontSize: 24 }}
            buttonStyle={{ backgroundColor: ThemeColors.button }}
            onPress={() => this.setState({ kickedMessage: false })}
          />
        </Overlay>
        <Overlay
          isVisible={openOverlay}
          overlayStyle={{ width: ScreenWidth - 20, borderRadius: 10 }}
          onBackdropPress={() => {
            this.setState({
              openOverlay: false,
              overlayLobby: null,
              overlayPasswordText: "",
              overlayPasswordShowing: false,
              overlayPasswordHash: "",
              overlayPasswordError: false,
            });
          }}
        >
          <Text style={{ fontSize: 24, textAlign: 'center' }}>{overlayLobby?.name}</Text>
          <Input
            placeholder="Password"
            textContentType="password"
            secureTextEntry={!overlayPasswordShowing}
            autoCapitalize='none'
            disabled={overlayLoading}
            value={overlayPasswordText}
            leftIcon={
              <Icon
                name='key'
                type='font-awesome-5'
                size={18}
              />
            }
            rightIcon={
              <Button
                title={overlayPasswordShowing ? 'hide' : 'show'}
                type="clear"
                titleStyle={{ color: 'gray' }}
                onPress={() => this.setState({ overlayPasswordShowing: !overlayPasswordShowing })}
              />
            }
            onChangeText={(text) => this.setState({ overlayPasswordText: text })}
            inputStyle={{ fontSize: 24, paddingLeft: 5 }}
            containerStyle={{ marginTop: 10 }}
            errorMessage={overlayPasswordError ? "Incorrect Password. Please try again." : ""}
          />
          <Button
            title="Open Lobby"
            loading={overlayLoading}
            onPress={() => {
              this.setState({ overlayLoading: true, overlayPasswordError: false });
              this.props.comparePassword(overlayPasswordText, overlayPasswordHash, (err, passwordCorrect) => {
                if (err) {
                  console.error("LobbyPicker::Overlay::PasswordCompare", err);
                  return;
                }
                if (passwordCorrect && openOverlay) {
                  const lobbyRef = this.getLobbyRef(overlayLobby);
                  this.props.navigation.navigate('LobbyView', { lobbyRef });
                  this.setState({
                    openOverlay: false,
                    overlayLobby: null,
                    overlayPasswordText: "",
                    overlayPasswordShowing: false,
                    overlayPasswordHash: "",
                    overlayPasswordError: false,
                  });
                } else {
                  this.setState({ overlayPasswordError: true });
                }
                this.setState({ overlayLoading: false });
              })
            }}
            titleStyle={{ fontSize: 24 }}
            buttonStyle={{ backgroundColor: ThemeColors.button }}
          />
          <Button
            title="Cancel"
            type="clear"
            titleStyle={{ color: ThemeColors.text, fontSize: 24 }}
            onPress={() => {
              this.setState({
                openOverlay: false,
                overlayLobby: null,
                overlayPasswordText: "",
                overlayPasswordShowing: false,
                overlayPasswordHash: "",
                overlayPasswordError: false,
              });
            }}
          />
        </Overlay>
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
              marginTop: 15,
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
              <Card.Title style={styles.cardTitle}>Joined Lobbies</Card.Title>
              {
                userLobbies && userLobbies.length > 0 &&
                <Text style={{ fontSize: 12, marginBottom: 2, marginTop: -5, marginLeft: 5 }}>
                  *Hold down <Text style={{ color: ThemeColors.text }}>your lobby</Text> to delete it
                </Text>
              }
              {userLobbies?.map((lobby, i) => {
                return this.lobbyComponent(lobby, i);
              })}
            </Card>
            <Card
              id="search-for-lobbies"
              containerStyle={styles.cardContainer}
            >
              <Card.Title style={styles.cardTitle}>All Lobbies</Card.Title>
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
    paddingBottom: 10,
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

export default Password(LobbyPicker);
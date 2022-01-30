import { Component } from "react";
import { SafeAreaView, StyleSheet, View, Text } from 'react-native';
import Constants from 'expo-constants';
import { Button, Card, Icon } from 'react-native-elements';
import LoadingSpinner from '../LoadingSpinner';
import { ScrollView } from "react-native-gesture-handler";
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { Input } from "react-native-elements/dist/input/Input";
// import ThemeColors from '../../assets/ThemeColors';
import SearchAlgolia from "../Algolia/SearchAlgolia";

class Lobby extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      searchLoading: false,
      error: false,
      user: this.props.route.params.user,
    }

    this.searchForLobbies = this.searchForLobbies.bind(this);
  }

  componentDidMount() {
    const { user } = this.state;
    const userLobbiesUnsubscribe = onSnapshot(query(collection(this.props.db, 'lobbies'), where('host', '==', user.uid)), (lobbies) => { 
      let userLobbies = [];
      lobbies.forEach((lobby) => {
        const lobbyData = lobby.data();
        userLobbies.push(lobbyData);
      });
      this.setState({ userLobbies });
    });
    
    this.setState({ userLobbiesUnsubscribe });
  }

  componentWillUnmount() {
    const { userLobbiesUnsubscribe } = this.state;
    userLobbiesUnsubscribe ?? userLobbiesUnsubscribe();
  }

  lobby(lobby, i) {
    return (
      <Button
        key={i}
        title={lobby?.arrow === false ? {textAlign: 'center'} : lobby.name}
        buttonStyle={styles.lobbyButton}
        titleStyle={styles.name}
        icon={lobby?.arrow === false ? <></> : <Icon name="angle-right" type="font-awesome" />}
        iconRight
      />
    );
  }

  async searchForLobbies() {
    const { lobbySearchText } = this.state;
    this.setState({ searchLoading: true });
    try {
      const q = query(collection(this.props.db, 'lobbies'), where('name', 'in', lobbySearchText));
      const matchingDocs = await getDocs(q);
      
      const searchLobbies = [];
      matchingDocs.forEach((doc) => {
        searchLobbies.push(doc);
      });
      this.setState({ searchLobbies, searchLoading: false });
    } catch (err) {
      console.error("Lobby Search Error", err);
      this.setState({ searchLobbies: [{ name: "None Found", arrow: false }], searchLoading: false });
    }
  }

  render() {
    const { loading, searchLoading, error, user, searchClient } = this.state;
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
              onPress={() => { this.props.navigation.navigate('CreateLobby'); }}
            />
            <Card
              id="user-lobbies"
              containerStyle={styles.cardContainer}
            >
              <Card.Title style={styles.cardTitle}>Your Lobbies</Card.Title>
              <ScrollView style={{ maxHeight: 140 }}>
                {this.state.userLobbies?.map((lobby, i) => {
                  return this.lobby(lobby, i);
                })}
              </ScrollView>
            </Card>
            <Card
              id="search-for-lobbies"
              containerStyle={styles.cardContainer}
            >
              <Card.Title style={styles.cardTitle}>Lobby Search</Card.Title>
              <SearchAlgolia lobbyComponent={this.lobby} />
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

export default Lobby;
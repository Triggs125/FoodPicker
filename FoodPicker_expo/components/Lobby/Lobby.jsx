import { Component } from "react";
import { SafeAreaView, StyleSheet, View, Text } from 'react-native';
import Constants from 'expo-constants';
import { Button, Card, Icon } from 'react-native-elements';
import LoadingSpinner from '../LoadingSpinner';
import { ScrollView } from "react-native-gesture-handler";
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Input } from "react-native-elements/dist/input/Input";
// import ThemeColors from '../../assets/ThemeColors';

class Lobby extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      error: false,
      user: this.props.route.params.user,
    }
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
        title={lobby.name}
        buttonStyle={styles.lobbyButton}
        titleStyle={styles.name}
        icon={<Icon name="angle-right" type="font-awesome" />}
        iconRight
      />
    )
  }

  render() {
    const { loading, error, user } = this.state;
    return (
      <SafeAreaView>
        <ScrollView>
          <LoadingSpinner spinning={loading} />
          <View style={styles.container}>
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
              <Input
                placeholder="Search for a Lobby"
                containerStyle={{ backgroundColor: 'white' }}
                rightIcon={
                  <Icon
                    name='search'
                    type='font-awesome'
                    iconStyle={styles.inputIcon}
                    onPress={() => this.setState({ passwordShowing: !passwordShowing })}
                  />
                }
                inputStyle={styles.inputStyle}
                onChangeText={(text) => this.setState({ passwordText: text })}
              />
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
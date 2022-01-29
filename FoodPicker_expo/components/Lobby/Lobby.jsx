import { Component } from "react";
import { SafeAreaView, StyleSheet, View, TextInput } from 'react-native';
import Constants from 'expo-constants';
import { Button } from 'react-native-elements';
import LoadingSpinner from '../LoadingSpinner';

class Lobby extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      username: "",
      error: false,
    }
  }

  render() {
    const { loading, username, error } = this.state;
    return (
      <SafeAreaView>
        <LoadingSpinner spinning={loading} />
        <View>
          <TextInput
            label="Username"
            placeholder="Username"
            onChangeText={this.handleUsernameChange}
            errorMessage={this.getErrorMessage}
            maxLength={20}
          />
          <Button disabled={!username || error} onPress={this.createUser} title="Sign up" style={styles.button} />
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: Constants.statusBarHeight + 50,
    paddingLeft: 20,
    paddingRight: 20,
    height: '100%',
  },
  button: {
    width: '100%',
    marginTop: 20,
    alignSelf: 'center',
  }
});

export default Lobby;
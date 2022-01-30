import { Component } from "react";
import { connectSearchBox } from "react-instantsearch-native";
import { View, StyleSheet } from "react-native";
import { Input, Icon } from "react-native-elements";

class ConnectedSearchBox extends Component {
  render() {
    return (
      <View>
        <Input
          placeholder="Search for a Lobby"
          containerStyle={{ backgroundColor: 'white' }}
          clearButtonMode="always"
          spellCheck={false}
          autoCorrect={false}
          inputStyle={styles.inputStyle}
          onChangeText={(text) => this.props.refine(text)}
        />
      </View>
    )
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

export default connectSearchBox(ConnectedSearchBox);
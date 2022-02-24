import { Component } from "react";
import { connectSearchBox } from "react-instantsearch-native";
import { View, StyleSheet } from "react-native";
import { Input, Icon, Button } from "react-native-elements";
import ThemeColors from "../../assets/ThemeColors";

class ConnectedSearchBox extends Component {
  render() {
    return (
      <View style={{ display: 'flex', flexDirection: 'row' }}>
        <Button
          icon={<Icon name="refresh" type="font-awesome" />}
          type='clear'
          titleStyle={{ color: ThemeColors.button }}
          onPress={this.props.refreshHits}
          containerStyle={{ justifyContent: 'flex-start', paddingRight: 0, paddingTop: 3 }}
        />
        <Input
          placeholder="Search for a Lobby"
          containerStyle={{ backgroundColor: 'white', borderWidth: 0, paddingLeft: 1, width: '87.5%' }}
          clearButtonMode="always"
          spellCheck={false}
          autoCorrect={false}
          onChangeText={(text) => this.props.refine(text)}
          value={this.props.currentRefinement}
          errorStyle={{ height: 0 }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({

});

export default connectSearchBox(ConnectedSearchBox);
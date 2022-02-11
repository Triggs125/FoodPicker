import { Component } from "react";
import { View } from "react-native";
import { SearchBar } from 'react-native-elements';
import Constants from 'expo-constants';

class GoogleFoodSearch extends Component {
  constructor(props) {
    super(props);

    this.state = {
      googleSearchText: ""
    }

    this.submit = this.submit.bind(this);
  }

  submit() {
    const { googleSearchText } = this.state;
    if (googleSearchText.trim(' ').length > 0) {
      this.props.googleSearchText(googleSearchText);
    }
  }

  render() {
    return (
      <View>
        <SearchBar
          lightTheme
          platform={Constants.platform.ios ? 'ios' : Constants.platform.android ? 'android' : 'default'}
          placeholder='Restaurant Search'
          onChangeText={(googleSearchText) => this.setState({ googleSearchText })}
          onSubmitEditing={this.submit}
          inputStyle={{ paddingBottom: 0 }}
          inputContainerStyle={{ backgroundColor: 'lightgray', borderRadius: 10 }}
        />
      </View>
    )
  }
}

export default GoogleFoodSearch;
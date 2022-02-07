import { Component } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Card, Icon, Input, Text } from 'react-native-elements';

import FoodProfile from "../FoodProfile/FoodProfile";
import GoogleFoodSearch from "./GoogleFoodSearch";
import FoodChoices from "./FoodChoices";
import FoodPageNavigation from "./FoodPageNavigation";

class MakeSelections extends Component {

  constructor(props) {
    super(props);

    this.state = {
      screenHeight: Dimensions.get('window').height,
    }

    this.setSelectedFoodProfile = this.setSelectedFoodProfile.bind(this);
  }

  setSelectedFoodProfile(selectedFoodProfile) {
    this.setState({ selectedFoodProfile });
  }

  render() {
    const { screenHeight, selectedFoodProfile } = this.state;
    return (
      <View style={{ height: screenHeight }}>
        <FoodProfile {...this.props} selectedFoodProfile={this.setSelectedFoodProfile} />
        <GoogleFoodSearch {...this.props} />
        <FoodChoices {...this.props} />
        <FoodPageNavigation {...this.props} />
      </View>
    )
  }
}

export default MakeSelections;
import { Component } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
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
      selectedFoodProfile: undefined,
      googleSearchText: "",
      foodChoices: [],
      choicesPageIndex: 0,
    }

    this.setSelectedFoodProfile = this.setSelectedFoodProfile.bind(this);
  }

  setSelectedFoodProfile(selectedFoodProfile) {
    this.setState({ selectedFoodProfile });
  }

  setGoogleSearchText(googleSearchText) {
    this.setState({ googleSearchText, choicesPageIndex: 0 });
  }

  addFoodChoice(foodChoice) {
    const { foodChoices } = this.state;
    let newFoodChoices = foodChoices.push(foodChoice);
    this.setState({ foodChoices: newFoodChoices })
  }

  removeFoodChoice(foodChoice) {
    const { foodChoices } = this.state;
    let newFoodChoices = foodChoices.filter(choice => foodChoice !== choice);
    this.setState({ foodChoices: newFoodChoices });
  }

  nextChoicesPage() {
    const { choicesPageIndex, foodChoices } = this.state;
    if (Math.ceil(foodChoices.length % 4) > choicesPageIndex) {
      this.setState({ choicesPageIndex: choicesPageIndex + 1 });
    } else {
      this.setState({ choicesPageIndex: 0 });
    }
  }

  lastChoicesPage() {
    const { choicesPageIndex, foodChoices } = this.state;
    if (choicesPageIndex !== 0) {
      this.setState({ choicesPageIndex: choicesPageIndex - 1 });
    } else {
      this.setState({ choicesPageIndex: foodChoices.length - 1 });
    }
  }

  render() {
    const { screenHeight, googleSearchText, choicesPageIndex } = this.state;
    return (
      <ScrollView style={{ height: screenHeight, paddingHorizontal: 10 }}>
        <FoodProfile
          {...this.props}
          selectedFoodProfile={this.setSelectedFoodProfile}
        />
        {/* <GoogleFoodSearch
          {...this.props}
          googleSearchText={this.setGoogleSearchText}
        /> */}
        <FoodChoices
          {...this.props}
          googleSearchText={googleSearchText}
          addFoodChoice={this.addFoodChoice}
          removeFoodChoice={this.removeFoodChoice}
          choicesPageIndex={choicesPageIndex}
        />
        <FoodPageNavigation
          {...this.props}
          nextChoicesPage={this.nextChoicesPage}
          lastChoicesPage={this.lastChoicesPage}
        />
      </ScrollView>
    )
  }
}

export default MakeSelections;
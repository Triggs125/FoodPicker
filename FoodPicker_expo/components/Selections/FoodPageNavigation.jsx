import { Component } from "react";
import { View } from "react-native";
import { Button, Text } from 'react-native-elements';
import ThemeColors from '../../assets/ThemeColors';

class FoodPageNavigation extends Component {
  render() {
    const {
      lobbyData, choicesPageIndex, foodChoices, lastChoicesPage, nextChoicesPage, userSelectionPage,
    } = this.props;

    const addressName = lobbyData.locationGeocodeAddress &&
      lobbyData.locationGeocodeAddress[0]?.city + ", " + 
      lobbyData.locationGeocodeAddress[0]?.region;

    return (
      <View>
        <View style={{ justifyContent: 'space-between', flexDirection: 'row', marginTop: -8, paddingHorizontal: 15 }}>
          <Text>{addressName}</Text>
          <Text>Page {choicesPageIndex + 1}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 5 }}>
          <Button
            title={"Last Page"}
            disabled={foodChoices.length < 60 && choicesPageIndex === 0}
            onPress={lastChoicesPage}
            titleStyle={{ fontSize: 20, color: ThemeColors.text }}
            buttonStyle={{
              backgroundColor: 'white',
              paddingLeft: 20,
              paddingRight: 12,
              borderRadius: 10,
              borderTopLeftRadius: 25,
              borderBottomLeftRadius: 25,
            }}
            raised
            containerStyle={{
              borderRadius: 10,
              borderTopLeftRadius: 25,
              borderBottomLeftRadius: 25,
              marginVertical: 20,
              marginLeft: 5,
            }}
          />
          <Button
            title="Finish"
            onPress={userSelectionPage}
            titleStyle={{ fontSize: 20, color: 'white' }}
            buttonStyle={{ 
              backgroundColor: ThemeColors.text,
              borderRadius: 10,
              paddingHorizontal: 15
            }}
            raised
            containerStyle={{
              borderRadius: 10,
              marginVertical: 20,
            }}
          />
          <Button
            title="Next Page"
            onPress={nextChoicesPage}
            disabled={choicesPageIndex >= Math.floor(foodChoices.length / 2)}
            titleStyle={{ fontSize: 20, color: 'white' }}
            buttonStyle={{ 
              backgroundColor: ThemeColors.text,
              paddingRight: 20,
              paddingLeft: 12,
              borderRadius: 10,
              borderTopRightRadius: 25,
              borderBottomRightRadius: 25,
            }}
            raised
            containerStyle={{
              borderRadius: 10,
              borderTopRightRadius: 25,
              borderBottomRightRadius: 25,
              marginVertical: 20,
              marginRight: 5,
            }}
          />
        </View>
      </View>
    )
  }
}

export default FoodPageNavigation;
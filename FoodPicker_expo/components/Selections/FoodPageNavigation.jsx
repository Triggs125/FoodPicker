import { Component } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Button, Card, Icon, Input, Text } from 'react-native-elements';
import ThemeColors from '../../assets/ThemeColors';

class FoodPageNavigation extends Component {
  render() {
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 5 }}>
        <Button
          title="Last Page"
          onPress={this.props.lastChoicesPage}
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
            marginVertical: 20
          }}
        />
        <View>
          <Button
            title={`${this.props.selectedFoodChoices.length}`}
            titleStyle={{ marginLeft: -15, marginTop: 11, fontSize: 20, color: 'white', paddingRight: 7, fontWeight: 'bold' }}
            icon={
              <Icon
                name="shopping-bag"
                type="foundation"
                color='#222'
                size={60}
                containerStyle={{ marginHorizontal: 0, paddingLeft: 0, paddingRight: 10, marginRight: -27 }}
              />
            }
            buttonStyle={{ padding: 0, backgroundColor: 'transparent', marginRight: 15 }}
            containerStyle={{ paddingRight: 0 }}
            onPress={this.props.navigation.goBack} // TODO: Go to the user's selections page
          />
          <Text style={{ marginTop: -7, fontWeight: 'bold' }}>Selections</Text>
        </View>
        <Button
          title="Next Page"
          onPress={this.props.nextChoicesPage}
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
            marginVertical: 20
          }}
        />
      </View>
    )
  }
}

export default FoodPageNavigation;
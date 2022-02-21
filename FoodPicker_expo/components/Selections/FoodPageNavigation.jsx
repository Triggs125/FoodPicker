import { doc, setDoc } from "firebase/firestore";
import { Component } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Button, Card, Icon, Input, Text } from 'react-native-elements';
import ThemeColors from '../../assets/ThemeColors';

class FoodPageNavigation extends Component {
  async userSelectionPage() {
    const { lobbyData, user, selectedFoodChoices, db } = this.props;
    
    if (selectedFoodChoices.length > 0) {
      try {
        // Add food selections to firestore
        await setDoc(doc(db, 'food_selections', `${lobbyData.ref.id}_${user.uid}`), {
          lobbyId: lobbyData.ref.id,
          uid: user.uid,
          selections: selectedFoodChoices,
        }, {
          merge: false,
        });

        // Add user to lobby usersReady list
        const usersReady = lobbyData.usersReady || [];
        if (!usersReady?.includes(user.uid)) {
          console.log("Adding user to ready list")
          await setDoc(lobbyData.ref, { usersReady: [...usersReady, user.uid] }, { merge: true });
        }

        this.props.clearSelections();
        // Go to user's selection page
        this.props.navigation.navigate('UserSelections', { lobbyData: lobbyData, user: user });
      } catch (err) {
        console.error("FoodPageNavigation::userSelectionPage", err);
      }
    }
  }
  
  render() {
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 5 }}>
        <Button
          title="Last Page"
          disabled={this.props.choicesPageIndex <= 0}
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
            title={`${this.props.selectedFoodChoices.length} / ${this.props.maxNumberOfSelections}`}
            titleStyle={{ marginLeft: 0, marginTop: 11, fontSize: 20, color: 'white', paddingRight: 7, fontWeight: 'bold' }}
            icon={
              <Icon
                name="shopping-bag"
                type="foundation"
                color='#333'
                size={60}
                containerStyle={{ marginHorizontal: 0, paddingLeft: 0, paddingRight: 11, marginRight: -58 }}
              />
            }
            buttonStyle={{ padding: 0, backgroundColor: 'transparent', marginRight: 15 }}
            containerStyle={{ paddingRight: 0, marginLeft: 15 }}
            onPress={() => this.userSelectionPage()}
          />
          <Text style={{ marginTop: -7, fontWeight: 'bold', textAlign: 'center' }}>Finish</Text>
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
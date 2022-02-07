import { Component } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Card, Icon, Input, Text } from 'react-native-elements';
import { Dropdown } from 'react-native-element-dropdown';
import { collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { Button } from "react-native-elements/dist/buttons/Button";
import RNPickerSelect from 'react-native-picker-select';
import { onAuthStateChanged } from "firebase/auth";

class FoodProfile extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userFoodProfiles: [],
      selectedFoodProfile: {},
      renameFoodProfile: false,
    }
  }

  componentDidMount() {
    onAuthStateChanged(this.props.auth, (authUser) => {
      if (!authUser) {
        this.setState({ foodProfiles: [], selectedFoodProfile: undefined });
        return;
      }
      const unsubFoodProfiles = onSnapshot(query(collection(this.props.db, 'food_profiles'), where('uid', '==', authUser.uid)), (queryDocs) => {
        let foodProfiles = [];
        queryDocs.forEach(doc => foodProfiles.push({ ...doc.data(), id: doc.id }));
        const selectedFoodProfile = foodProfiles.find(foodProfile => foodProfile.selected === true);
        if (selectedFoodProfile) {
          this.selectedFoodProfile && this.selectedFoodProfile(selectedFoodProfile);
          this.setState({ foodProfileName: selectedFoodProfile.name });
        } else {
          this.selectedFoodProfile && this.selectedFoodProfile(undefined);
          this.setState({ foodProfileName: "" });
        }
        this.setState({ userFoodProfiles: foodProfiles, selectedFoodProfile });
      });
      this.setState({ unsubFoodProfiles });
    });
  }

  componentWillUnmount() {
    this.state.unsubFoodProfiles && this.state.unsubFoodProfiles();
  }

  changeSelectedFoodProfileName() {
    const { foodProfileName, selectedFoodProfile } = this.state;
    if (foodProfileName !== selectedFoodProfile?.name) {
      setDoc(doc(this.props.db, `food_profiles/${this.state.selectedFoodProfile?.id}`), { name: foodProfileName }, { merge: true });
    }
  }

  render() {
    const { userFoodProfiles, selectedFoodProfile, renameFoodProfile, foodProfileName } = this.state;

    const userFoodProfileNames = userFoodProfiles.map(foodProfile => {
      if (foodProfile) {
        return { label: foodProfile.name, value: foodProfile.id };
      }
    });

    console.log("Selected Food Profile:", selectedFoodProfile);

    return (
      <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 10 }}>
        <Text style={{ fontSize: 20, alignSelf: 'center', marginLeft: -5 }}>Food Profile:</Text>
        {
          !renameFoodProfile ? (
            <RNPickerSelect
              items={userFoodProfileNames}
              value={foodProfileName}
              placeholder={{ label: 'Food Profile...' }}
              onValueChange={(value) => {
                if (value) {
                  const selectedFoodProfile = userFoodProfiles.find(foodProfile => foodProfile.id === value);
                  this.props.selectedFoodProfile && this.props.selectedFoodProfile(selectedFoodProfile);
                  this.setState({ selectedFoodProfile, foodProfileName: selectedFoodProfile.name })};
                }
              }
              useNativeAndroidPickerStyle={false}
              style={{
                placeholder: { color: foodProfileName? 'black' : 'gray' },
                inputIOS: {
                  fontSize: 18,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  marginVertical: 5,
                  minWidth: 150,
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: 'black',
                  borderRadius: 8,
                  color: 'black',
                  paddingRight: 30, // to ensure the text is never behind the icon
                },
                inputAndroid: {
                  fontSize: 18,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  marginVertical: 5,
                  minWidth: 150,
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: 'black',
                  borderRadius: 8,
                  color: 'black',
                  paddingRight: 30, // to ensure the text is never behind the icon
                },
                inputWeb: {
                  fontSize: 18,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  marginVertical: 5,
                  minWidth: 150,
                  backgroundColor: 'white',
                  borderWidth: 0.8,
                  borderColor: 'black',
                  borderRadius: 8,
                  color: 'black',
                  paddingRight: 30, // to ensure the text is never behind the icon
                }
              }}
            />
          ) : (
            <Input
              value={foodProfileName}
              containerStyle={{ width: 200 }}
              inputStyle={{ paddingHorizontal: 5 }}
              editable={true}
              onChange={(event) => this.setState({ foodProfileName: event.nativeEvent.text })}
            />
          )
        }
        <Button
          icon={<Icon name={this.props.renamable ? renameFoodProfile ? "check" : "edit" : "plus"} type="font-awesome" iconStyle={{ fontSize: 26, color: renameFoodProfile ? 'green' : 'black' }} />}
          onPress={() => {
            if (!this.props.renamable) {
              this.props.navigation.navigate('EditFoodProfile')
            } else {
              if (renameFoodProfile) {
                this.changeSelectedFoodProfileName();
              }
              this.setState({ renameFoodProfile: !renameFoodProfile });
            }
          }}
          containerStyle={{ marginRight: -10, alignSelf: 'center' }}
        />
      </View>
    )
  }
}

export default FoodProfile;
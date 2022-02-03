import { Component } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Card, Icon, Input, Text } from 'react-native-elements';
import { Dropdown } from 'react-native-element-dropdown';
import { collection, getDoc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { Button } from "react-native-elements/dist/buttons/Button";

class FoodProfile extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userFoodProfiles: [],
    }

    this.componentFocusUnsub = props.navigation.addListener('focus', () => {
      this.componentDidAppear();
    });
  }

  componentWillUnmount() {
    this.componentFocusUnsub && this.componentFocusUnsub();
  }

  componentDidAppear() {
    const { db, user, navigation } = this.props;
    if (!user) {
      navigation.navigate('Account');
    }
    const userProfilesQuery = query(collection(db, 'foodProfiles'), where('uid', '==', user.uid));
    const userFoodProfilesUnsub = onSnapshot(userProfilesQuery, (querySnapshot) => {
      const userFoodProfiles = [];
      querySnapshot.forEach((doc) => {
        userFoodProfiles.push({ data: doc.data(), ref: doc.ref, default: doc.data().default });
      });
      this.setState({ userFoodProfiles });
    });
    this.setState({ userFoodProfilesUnsub });
  }

  render() {
    const { userFoodProfiles, selectedFoodProfile } = this.state;
    let foodProfiles = [];
    if (!userFoodProfiles.data || userFoodProfiles.data?.length === 0) {
      foodProfiles.push({ name: "No Food Profiles", value: undefined });
    } else {
      foodProfiles = userFoodProfiles.data;
    }
    let foodProfileSelection = selectedFoodProfile;
    if (!foodProfileSelection) {
      foodProfileSelection = userFoodProfiles?.filter((profile) => profile.default)[0];
    }

    return (
      <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 10 }}>
        <Text style={{ fontSize: 20, alignSelf: "center" }}>Food Profile:</Text>
        <Dropdown
          labelField="name"
          valueField="value"
          style={{ backgroundColor: 'lightgrey', minWidth: 180, paddingLeft: 10 }}
          data={foodProfiles}
          value={foodProfileSelection}
          placeholder='Select Food Profile'
          onChange={(item) => this.setState({ selectedFoodProfile: item })}
        />
        <Button
          icon={<Icon name={userFoodProfiles.data?.length > 0 ? "edit" : "plus"} type="font-awesome" iconStyle={{ fontSize: 26 }} />}
          onPress={() => this.props.navigation.navigate('EditFoodProfile')}
        />
      </View>
    )
  }
}

export default FoodProfile;
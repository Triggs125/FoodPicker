import { Component } from "react";
import { View, StyleSheet } from "react-native";
import { Button } from 'react-native-elements';
import { ScrollView } from "react-native-gesture-handler";
import FoodFilters from "./FoodFilters";
import FoodProfile from "./FoodProfile";
import CurrentFilters from "./CurrentFilters";
import ThemeColors from "../../assets/ThemeColors";
import { setDoc, doc, addDoc, collection } from "firebase/firestore";

class EditFoodProfile extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filters: [],
    }

    this.addFilter = this.addFilter.bind(this);
    this.removeFilter = this.removeFilter.bind(this);
    this.setSelectedFoodProfile = this.setSelectedFoodProfile.bind(this);
    this.saveFoodProfile = this.saveFoodProfile.bind(this);
    this.addFoodProfile = this.addFoodProfile.bind(this);
  }

  addFilter(filter) {
    if (filter) {
      let filters = [ ...this.state.filters, filter ];
      filters = [...new Map(filters.map((item) => [item["value"], item])).values()];
      this.setState({ filters });
    }
  }

  removeFilter(filter) {
    if (filter) {
      const filters = this.state.filters.filter(f => f.value !== filter.value);
      this.setState({ filters: filters });
    }
  }

  saveFoodProfile() {
    const { filters, selectedFoodProfile } = this.state;
    const filtersObject = this.extractFilters(filters);
    setDoc(doc(this.props.db, `food_profiles/${selectedFoodProfile.id}`), {...filtersObject}, { merge: true });
  }

  setSelectedFoodProfile(selectedFoodProfile) {
    const filters = this.parseFilters(selectedFoodProfile);
    this.setState({ selectedFoodProfile, filters });
  }

  async addFoodProfile() {
    const foodProfile = await addDoc(collection(this.props.db, 'food_profiles'), {
      uid: this.props.user.uid,
      name: "Default Profile"
    });
    this.setSelectedFoodProfile(foodProfile.data);
  }

  extractFilters(filters) {
    const filtersObject = { ratings: [], cuisines: [], prices: [], hours: [], distances: [] };
    filters?.forEach(filter => {
      if (filter.type === 'rating') {
        filtersObject.ratings.push(filter.value);
      } else if (filter.type === 'cuisine') {
        filtersObject.cuisines.push(filter.value);
      } else if (filter.type === 'price') {
        filtersObject.prices.push(filter.value);
      } else if (filter.type === 'hours') {
        filtersObject.hours.push(filter.value);
      } else if (filter.type === 'distance') {
        filtersObject.distances.push(filter.value);
      }
    });
    return filtersObject;
  }

  parseFilters(selectedFoodProfile) {
    const filters = [];
    if (selectedFoodProfile?.ratings) {
      selectedFoodProfile.ratings.forEach(rating => {
        filters.push({ type: 'rating', label: rating, value: rating });
      });
    }
    if (selectedFoodProfile?.cuisines) {
      selectedFoodProfile.cuisines.forEach(cuisine => {
        filters.push({ type: 'cuisine', label: cuisine, value: cuisine });
      });
    }
    if (selectedFoodProfile?.prices) {
      selectedFoodProfile.prices.forEach(price => {
        filters.push({ type: 'price', label: price, value: price });
      });
    }
    if (selectedFoodProfile?.hours) {
      selectedFoodProfile.hours.forEach(hours => {
        filters.push({ type: 'hours', label: hours, value: hours });
      });
    }
    if (selectedFoodProfile?.distances) {
      selectedFoodProfile.distances.forEach(distance => {
        filters.push({ type: 'distance', label: distance, value: distance });
      });
    }
    return filters;
  }

  render() {
    const { filters } = this.state;
    return (
      <ScrollView>
        <View style={styles.container}>
          <FoodProfile {...this.props} selectedFoodProfile={this.setSelectedFoodProfile} renamable />
          <Button
            title="Add New Food Profile"
            titleStyle={{ fontSize: 22, color: ThemeColors.text }}
            buttonStyle={{ backgroundColor: 'white' }}
            containerStyle={{ marginTop: 10, marginBottom: 5 }}
            raised
            onPress={this.addFoodProfile}
          />
          <FoodFilters {...this.props} addFilter={this.addFilter} />
          <CurrentFilters {...this.props} filters={filters} removeFilter={this.removeFilter} />
          <Button
            title="Save Food Profile"
            titleStyle={{ fontSize: 26, fontWeight: 'bold' }}
            buttonStyle={{ backgroundColor: ThemeColors.button }}
            containerStyle={{ marginBottom: 15 }}
            raised
            onPress={this.saveFoodProfile}
          />
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 10,
    height: '100%',
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-start',
  },
});

export default EditFoodProfile;
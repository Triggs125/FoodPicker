import { Component } from "react";
import { View } from "react-native";
import { Card, Text } from "react-native-elements";
import Filter from "./Filters/Filter";

class FoodFilters extends Component {
  constructor(props) {
    super(props);

    this.addFilter = this.addFilter.bind(this);
  }

  items = [
    // ratings
    { type: "rating", label: "Any Stars", value: "Any Stars", unique: true },
    { type: "rating", label: "0 Stars", value: "0 Stars" },
    { type: "rating", label: "1 Star", value: "1 Star" },
    { type: "rating", label: "2 Stars", value: "2 Stars" },
    { type: "rating", label: "3 Stars", value: "3 Stars" },
    { type: "rating", label: "4 Stars", value: "4 Stars" },

    // cuisines
    { type: "cuisine", label: "Any cuisine", value: "Any cuisine", unique: true},
    { type: "cuisine", label: "American", value: "American" },
    { type: "cuisine", label: "Barbecue", value: "Barbecue" },
    { type: "cuisine", label: "Chinese", value: "Chinese" },
    { type: "cuisine", label: "French", value: "French" },
    { type: "cuisine", label: "Hamburger", value: "Hamburger" },
    { type: "cuisine", label: "Indian", value: "Indian" },
    { type: "cuisine", label: "Italian", value: "Italian" },
    { type: "cuisine", label: "Japanese", value: "Japanese" },
    { type: "cuisine", label: "Mexican", value: "Mexican" },
    { type: "cuisine", label: "Pizza", value: "Pizza" },
    { type: "cuisine", label: "Seafood", value: "Seafood" },
    { type: "cuisine", label: "Steak", value: "Steak" },
    { type: "cuisine", label: "Sushi", value: "Sushi" },
    { type: "cuisine", label: "Thai", value: "Thai" },

    // prices
    { type: "price", label: "Any price", value: "Any price", unique: true },
    { type: "price", label: "$", value: "$" },
    { type: "price", label: "$$", value: "$$" },
    { type: "price", label: "$$$", value: "$$$" },
    { type: "price", label: "$$$$", value: "$$$$" },

    // hours
    { type: "hours", label: "Any time", value: "Any time", unique: true },
    { type: "hours", label: "Open now", value: "Open now" },
    { type: "hours", label: "Open 24 hours", value: "Open 24 hours" },
    { type: "hours", label: "Sunday", value: "Sunday" },
    { type: "hours", label: "Monday", value: "Monday" },
    { type: "hours", label: "Tuesday", value: "Tuesday" },
    { type: "hours", label: "Wednesday", value: "Wednesday" },
    { type: "hours", label: "Thursday", value: "Thursday" },
    { type: "hours", label: "Friday", value: "Friday" },
    { type: "hours", label: "Saturday", value: "Saturday" },
    
    // Distance
    { type: "distance", label: "0.5 miles", value: "0.5 miles" },
    { type: "distance", label: "1 mile", value: "1 mile" },
    { type: "distance", label: "5 miles", value: "5 miles" },
    { type: "distance", label: "10 miles", value: "10 miles" },
    { type: "distance", label: "20 miles", value: "20 miles" },
    { type: "distance", label: "50 miles", value: "50 miles" }
  ]

  addFilter(value) {
    const filter = this.items.find(filter => filter.value === value);
    this.props.addFilter(filter);
  }

  render() {
    return (
      <Card
        containerStyle={{ marginHorizontal: -5, backgroundColor: '#ddd', borderColor: 'black', borderRadius: 15 }}
      >
        <Text style={{ textAlign: 'center', fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>Add Filters</Text>
        <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' }}>
          <Filter name="Rating" items={this.items.filter(item => item.type === 'rating')} addFilter={this.addFilter} />
          <Filter name="Cuisine" items={this.items.filter(item => item.type === 'cuisine')} addFilter={this.addFilter} />
          <Filter name="Price" items={this.items.filter(item => item.type === 'price')} addFilter={this.addFilter} />
          <Filter name="Hours" items={this.items.filter(item => item.type === 'hours')} addFilter={this.addFilter} />
          <Filter name="Distance" items={this.items.filter(item => item.type === 'distance')} addFilter={this.addFilter} />
        </View>
      </Card>
    );
  }
}

export default FoodFilters;

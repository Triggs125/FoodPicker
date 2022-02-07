import { Component } from "react";
import { View } from "react-native";
import { Card, Icon, Text } from "react-native-elements";
import { Button } from "react-native-elements/dist/buttons/Button";

class CurrentFilters extends Component {
  render() {
    const { filters, removeFilter } = this.props;
    return (
      <Card containerStyle={{ marginHorizontal: -5, marginBottom: 15, borderRadius: 15, borderColor: 'black' }}>
        <Text style={{ textAlign: 'center', fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>Current Filters</Text>
        <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
          {
            filters?.map((filter, i) => (
              <View
                key={i}
                style={{
                  borderColor: 'black', borderWidth: 1, borderRadius: 5,
                  margin: 8,
                  justifyContent: 'space-between', display: 'flex', flexDirection: 'row' 
                }}
              >
                <Text style={{ textAlign: 'center', alignSelf: 'center', fontSize: 18, marginLeft: 8 }}>{filter.label}</Text>
                <Button
                  icon={<Icon name="times" type="font-awesome" />}
                  iconContainerStyle={{ alignSelf: 'center' }}
                  onPress={() => removeFilter(filter)}
                />
              </View>
            ))
          }
        </View>
      </Card>
    )
  }
}

export default CurrentFilters;
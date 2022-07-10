import { Component } from "react";
import PropType from 'prop-types';
import { View, FlatList } from "react-native";
import { Button } from 'react-native-elements';
import ThemeColors from "../../assets/ThemeColors";
import { FoodChoiceItem } from "./FoodChoiceItem";

const propTypes = {
  googleSearchText: PropType.string,
  addFoodChoice: PropType.func,
  removeFoodChoice: PropType.func,
  choicesPageIndex: PropType.number,
}

class FoodChoices extends Component {
  constructor(props) {
    super(props);

    this.state = {
      scroll: false
    }

    this.scrollToTop = this.scrollToTop.bind(this);
  }

  headerComponent() {
    return (
      <View style={{ marginTop: 0 }}>
        <Button
          title="Scroll to the Bottom"
          onPress={() => this.flatlistRef && this.flatlistRef.scrollToEnd()}
          titleStyle={{ fontSize: 20, color: ThemeColors.text }}
          type="clear"
          containerStyle={{
            alignSelf: 'center'
          }}
          iconRight
          icon={{
            name: 'angle-down',
            type: 'font-awesome',
            color: ThemeColors.text
          }}
        />
      </View>
    )
  }

  scrollToTop(animated = false) {
    this.flatlistRef && this.flatlistRef.scrollToIndex({ index: 0, viewOffset: 50, animated });
  }

  footerComponent() {
    const {
      lastChoicesPage, nextChoicesPage,
      foodChoices, choicesPageIndex
    } = this.props;
    let totalLength = 0;
    foodChoices.forEach(choices => totalLength += choices.length);
    return (
      <View
        style={{
          flexDirection: 'row', flex: 1, justifyContent: 'space-between',
          paddingHorizontal: 10, marginTop: -10
        }}
      >
        <Button
          title={"Last Page"}
          disabled={choicesPageIndex === 0}
          onPress={() => lastChoicesPage()}
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
            marginVertical: 10,
            marginLeft: 5,
          }}
        />
        <Button
          title="Top"
          onPress={() => this.scrollToTop(true)}
          titleStyle={{ fontSize: 20, color: ThemeColors.text }}
          type="clear"
          containerStyle={{
            alignSelf: 'center'
          }}
          iconRight
          icon={{
            name: 'angle-up',
            type: 'font-awesome',
            color: ThemeColors.text
          }}
        />
        <Button
          title={
            choicesPageIndex == 3 || foodChoices[choicesPageIndex]?.length % 20 != 0
              ? "First Page"
              : "Next Page"
          }
          onPress={() => nextChoicesPage()}
          disabled={choicesPageIndex == 0 && foodChoices[choicesPageIndex]?.length % 20 != 0}
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
            marginVertical: 10,
            marginRight: 5,
          }}
        />
      </View>
    );
  }

  render() {
    const {
      lobbyData, foodChoices,
      choicesPageIndex, selectedFoodChoices,
      maxNumberOfSelections, navigation,
      addFoodChoice, removeFoodChoice
    } = this.props;
    const item = ({ item }) => {
      return (
        <FoodChoiceItem
          lobbyData={lobbyData}
          place={item}
          selectedFoodChoices={selectedFoodChoices}
          maxNumberOfSelections={maxNumberOfSelections}
          navigation={navigation}
          addFoodChoice={addFoodChoice}
          removeFoodChoice={removeFoodChoice}
        />
      );
    };

    return (
      <>
        <FlatList
          ref={ref => this.flatlistRef = ref}
          data={foodChoices[choicesPageIndex]}
          extraData={choicesPageIndex}
          renderItem={item}
          initialNumToRender={4}
          keyExtractor={(item) => { return item.id.toString() }}
          style={{ marginHorizontal: -10 }}
          ListHeaderComponent={this.headerComponent()}
          ListFooterComponent={this.footerComponent()}
        />
      </>
    )
  }
}

FoodChoices.propTypes = propTypes;

export default FoodChoices;
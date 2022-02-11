import { Component } from "react";
import PropType from 'prop-types';
import { Dimensions, StyleSheet, View } from "react-native";
import { Card, Icon, Input, Text, Tile } from 'react-native-elements';
import { getNearbyRestaurants } from '../../services/service';

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
      foodChoices: [],
    }
  }

  componentDidMount() {
    const { googleSearchText } = this.props;
    getNearbyRestaurants(googleSearchText)
      .then(foodChoices => {
        this.setState({ foodChoices: [foodChoices[0]] });
      })
      .catch(err => {
        console.error("FoodChoices::getNearbyRestaurants", err);
      })
  }

  render() {
    const { foodChoices } = this.state;

    return (
      <View>
        {
          foodChoices?.map((foodChoice, i) => {
            console.log("Food choice:", foodChoice);
            return (
              <Tile
                key={i}
                imageSrc={{ uri: foodChoice.photos[0]?.getUrl({ maxWidth: 35, maxHeight: 35 }) }}
                title={foodChoice.name}
                titleStyle={{ textAlign: 'left' }}
                containerStyle={{ width: '50%' }}
              >
                
              </Tile>
            );
          })
        }
      </View>
    );
  }
}

FoodChoices.PropTypes = propTypes;

export default FoodChoices;
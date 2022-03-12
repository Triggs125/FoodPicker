import { Component } from "react";
import { Dimensions, Linking, View } from "react-native";
import Constants from 'expo-constants';
import { HeaderHeightContext } from '@react-navigation/elements';
import { Text, Icon, Tab, TabView, ListItem, Avatar } from "react-native-elements";
import { SliderBox } from 'react-native-image-slider-box';
import { getDistance } from 'geolib';
import LoadingSpinner from "../LoadingSpinner";
import ThemeColors from "../../assets/ThemeColors";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { Button } from "react-native-elements/dist/buttons/Button";
import { PLACE_DETAILS_API_KEY } from "../../config";
import { ScreenHeight, ScreenWidth } from "react-native-elements/dist/helpers";
import call from 'react-native-phone-call'

class PlaceDetails extends Component {
  constructor(props) {
    super(props);

    const offset = Constants.platform.android ? 35 : 20;
    const adBannerHeight = 60;
    const screenHeight = Dimensions.get('screen').height - offset;

    this.state = {
      loading: true,
      screenHeight: screenHeight,
      tabIndex: 0,
    }
  }

  componentDidMount() {
    this.componentFocusUnsub = this.props.navigation.addListener('focus', () => {
      this.componentDidAppear();
    });
    if (this.props.route?.params?.foodChoice) {
      this.componentDidAppear();
    }
  }

  componentWillUnmount() {
    this.componentFocusUnsub && this.componentFocusUnsub();
  }

  componentDidAppear() {
    const foodChoice = this.props.route?.params?.foodChoice;
    const url = "https://maps.googleapis.com/maps/api/place/details/json?place_id=" + foodChoice.id 
    + '&key=' + PLACE_DETAILS_API_KEY;

    this.setState({ loading: true });
    fetch(url)
      .then(res => {
        return res.json();
      })
      .then(res => {
        
        this.setState({ place: res.result });
      })
      .catch(error => {
        console.error("FoodChoices::fetchNearestPlacesFromGoogle", error);
      })
      .finally(() => {
        this.setState({ loading: false })
      });
  }

  stars(rating) {
    if (!rating && isNaN(rating)) return [];
    const _rating = Math.round(rating * 2);
    const fullStars = Math.floor(_rating / 2);
    const halfStar = _rating % 2 !== 0;
    const stars = [];

    // Gets the number of full stars to display
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Icon name="star" type="font-awesome" color='gold' size={20} />);
    }

    // Adds a half star if the rating decimal is .5 or above
    if (halfStar) {
      stars.push(<Icon name="star-half-full" type="font-awesome" color='gold' size={20} />);
    }

    for (let i = fullStars + halfStar; i < 5; i++) {
      stars.push(<Icon name="star-o" type="font-awesome" color='gold' size={20} />)
    }
    
    return stars;
  }

  totalRatings(num) {
    if (!num || isNaN(num)) return;
    return `(${Math.abs(num) > 999 ? Math.sign(num)*((Math.abs(num)/1000).toFixed(1)) + 'k' : Math.sign(num)*Math.abs(num)})`;
  }

  priceLevel(priceLevel) {
    let price = "";
    for (let i = 0; i < priceLevel; i++) {
      price += '$';
    }
    return price;
  }

  distanceAway(coords) {
    const { lobbyData } = this.props;
    const lobbyCoords = { latitude: lobbyData.location.latitude, longitude: lobbyData.location.longitude };
    return Math.round((getDistance(lobbyCoords, coords) / 1609.344) * 10) / 10;
  }

  placeTypes(types) {
    let typeNames = "";
    if (types.length === 0) return typeNames;
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      if (type.toLowerCase() === "restaurant") {
        typeNames += " " + type.replace('_', ' ') + ",";
        break;
      }
      typeNames += " " + type.replace('_', ' ') + ",";
    }
    return typeNames.substring(1, typeNames.length - 1);
  }

  hexToRgbA(hex, opacity = 1) {
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if(c.length == 3){
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return 'rgba(' + [(c>>16)&255, (c>>8)&255, c&255].join(',') + ',' + opacity + ')';
    }
    return hex;
  }

  clickPlaceLink(url) {
    Linking.canOpenURL(url)
    .then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.error("Don't know how to open URL:" + url);
      }
    });
  }

  callNumber(formatted_phone_number) {
    Linking.openURL(`tel:${formatted_phone_number}`);
  }

  render() {
    const { screenHeight, place, tabIndex } = this.state;
    const GooglePicBaseUrl = `https://maps.googleapis.com/maps/api/place/photo?key=${PLACE_DETAILS_API_KEY}&maxwidth=400&photo_reference=`;

    const images = place?.photos?.map(photo => GooglePicBaseUrl + photo.photo_reference);
    const coordinate = {
      latitude: place?.geometry.location.lat,
      longitude: place?.geometry.location.lng,
    };

    return (
      <HeaderHeightContext.Consumer>
        {headerHeight => (
          <ScrollView
            style={{
              height: screenHeight - headerHeight,
            }}
          >
            {
              place ? (
                <>
                  <SliderBox
                    images={images}
                    dotColor={ThemeColors.text}
                    imageLoadingColor={ThemeColors.text}
                    circleLoop
                  />
                  <Tab
                    value={tabIndex}
                    onChange={(i) => this.setState({ tabIndex: i })}
                    indicatorStyle={{
                      backgroundColor: 'lightgray',
                      height: 5,
                      borderRadius: 10,
                    }}
                    variant="primary"
                  >
                    <Tab.Item
                      title="Details"
                      titleStyle={{ fontSize: 18 }}
                      buttonStyle={{ backgroundColor: ThemeColors.text }}
                    />
                    <Tab.Item
                      title="Reviews"
                      titleStyle={{ fontSize: 18 }}
                      buttonStyle={{ backgroundColor: ThemeColors.text }}
                    />
                  </Tab>
                  <TabView
                    value={tabIndex}
                    onChange={(i) => this.setState({ tabIndex: i })}
                    animationType="spring"
                  >
                    <TabView.Item style={{ width: '100%' }}>
                      <View style={{ paddingHorizontal: 10 }}>
                        <Text h3 h3Style={{ textAlign: 'center', paddingBottom: 5, paddingTop: 10 }}>{place?.name}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 5 }}>
                          <Text
                            style={{
                              fontWeight: 'normal',
                              marginRight: 5,
                              alignSelf: 'center',
                              fontSize: 18
                            }}
                          >
                            {place?.rating}
                          </Text>
                          <Text style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
                            {
                              this.stars(place?.rating)
                            }
                          </Text>
                          <Text
                            style={{
                              fontWeight: 'normal',
                              alignSelf: 'center',
                              marginRight: 5,
                              fontSize: 18
                            }}
                          >
                            {this.totalRatings(place?.user_ratings_total)}
                          </Text>
                          <Icon
                            name="circle"
                            type="font-awesome"
                            size={5}
                            color='#333'
                            style={{
                              marginRight: 5,
                              paddingTop: 10,
                            }}
                          />
                          <Text
                            style={{
                              flexDirection: 'row',
                              marginRight: 5,
                              alignSelf: 'center',
                              fontSize: 18
                            }}
                          >
                            {
                              this.priceLevel(place?.price_level)
                            }
                          </Text>
                          <Icon
                            name="circle"
                            type="font-awesome"
                            size={5}
                            color='#333'
                            style={{
                              marginRight: 5,
                              paddingTop: 10,
                            }}
                          />
                          <Text style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center', fontSize: 18 }}>
                            {
                              `${this.distanceAway(coordinate)} mi`
                            }
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: place?.opening_hours.open_now ? 'green' : ThemeColors.text,
                            fontSize: 18,
                            alignSelf: 'center',
                            paddingVertical: 5,
                          }}
                        >
                          {
                            place?.opening_hours.open_now ? "Open" : "Closed"
                          }
                        </Text>
                        <Text
                          style={{
                            textAlign: 'center',
                            fontSize: 18,
                            textTransform: 'capitalize',
                            paddingVertical: 5,
                          }}
                        >
                          {this.placeTypes(place?.types)}
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 10 }}>
                          <Button
                            title={'Call'}
                            titleStyle={{ fontSize: 20, color: 'black'}}
                            containerStyle={{ marginTop: 5, marginBottom: 10 }}
                            icon={<Icon name="phone-alt" type="font-awesome-5" />}
                            iconPosition='top'
                            onPress={() => this.callNumber(place.formatted_phone_number)}
                          />
                          <Button
                            title={'Directions'}
                            titleStyle={{ fontSize: 20, color: 'black'}}
                            containerStyle={{ marginTop: 5, marginBottom: 10 }}
                            icon={<Icon name="map" type="font-awesome-5" />}
                            iconPosition='top'
                            onPress={() => this.clickPlaceLink(place?.url)}
                          />
                          <Button
                            title={'Website'}
                            titleStyle={{ fontSize: 20, color: 'black'}}
                            containerStyle={{ marginTop: 5, marginBottom: 10 }}
                            icon={<Icon name="globe-americas" type="font-awesome-5" />}
                            iconPosition='top'
                            onPress={() => this.clickPlaceLink(place?.website)}
                          />
                        </View>
                      </View>
                    </TabView.Item>
                    <TabView.Item>
                      <View style={{ paddingHorizontal: 10, paddingTop: 10 }}>
                        <Text
                          h4
                          h4Style={{
                            width: ScreenWidth,
                            textAlign: 'center'
                          }}
                        >
                          Average Review: {place?.rating} {this.totalRatings(place.user_ratings_total)}
                        </Text>
                        {
                          place?.reviews?.map(review => {
                            return (
                              <>
                                <ListItem>
                                  <Avatar source={{ uri: review.profile_photo_url }} />
                                  <ListItem.Title>{review.author_name}</ListItem.Title>
                                </ListItem>
                                <ListItem containerStyle={{ marginTop: -10, paddingTop: 5 }}>
                                  <View style={{ flexDirection: 'row' }}>
                                    <Text>{this.stars(review.rating)}</Text>
                                    <Text style={{ alignSelf: 'center' }}>   {review.relative_time_description}</Text>
                                  </View>
                                </ListItem>
                                <ListItem containerStyle={{ marginTop: -10, paddingTop: 5 }}>
                                  <ListItem.Title>
                                    {review.text}
                                  </ListItem.Title>
                                </ListItem>
                              </>
                            );
                          })
                        }
                      </View>
                    </TabView.Item>
                  </TabView>
                </>
              ) : (
                <View
                  style={{
                    height: screenHeight - headerHeight,
                    justifyContent: 'space-between'
                  }}
                >
                  <Text>{''}</Text>
                  <LoadingSpinner />
                  <Text>{''}</Text>
                </View>
              )
            }
          </ScrollView>
        )}
      </HeaderHeightContext.Consumer>
    );
  }
}

export default PlaceDetails;


{/* <View
  style={{
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 10,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: 'lightgray'
  }}
  >
  <Text h4 style={{ textAlign: 'center', marginBottom: 5 }}>{place?.name}</Text>
  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ marginRight: 5, alignSelf: 'center' }}>{place.rating}</Text>
    <Text style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
      {
        this.stars(place.rating).map(star => star)
      }
    </Text>
    <Text style={{ alignSelf: 'center', marginRight: 5 }}>{this.totalRatings(place.userRatingsTotal)}</Text>
    <Icon
      name="circle"
      type="font-awesome"
      size={5}
      color='#333'
      style={{ alignSelf: 'center', marginRight: 5 }}
    />
    <Text style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
      {
        this.priceLevel(place.price_level)
      }
    </Text>
    <Icon
      name="circle"
      type="font-awesome"
      size={5}
      color='#333'
      style={{ alignSelf: 'center', marginRight: 5 }}
    />
    <Text style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
      {
        `${this.distanceAway(coordinate)} mi`
      }
    </Text>
    <Icon
      name="circle"
      type="font-awesome"
      size={5}
      color='#333'
      style={{ alignSelf: 'center', marginRight: 5 }}
    />
    <Text style={{ color: place.opening_hours.open_now ? 'green' : ThemeColors.text }}>
      {
        place.opening_hours.open_now ? "Open" : "Closed"
      }
    </Text>
  </View>
  <Text 
    style={{
      textAlign: 'center',
      fontSize: 18, 
      textTransform: 'capitalize', 
      marginRight: 5 
    }}
  >
    {this.placeTypes(place.types)}
  </Text>
  <Text style={{ fontSize: 18, textAlign: 'center' }}>{place.vicinity}</Text>
  </View>
  <View>
  <Button
    title="Google Page"
    titleStyle={{ fontSize: 20, color: ThemeColors.text }}
    onPress={() => this.clickPlaceLink(place.url)}
  />
  </View> */}
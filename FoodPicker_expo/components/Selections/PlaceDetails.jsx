import { Component } from "react";
import { Dimensions, Linking, StatusBar, View } from "react-native";
import Constants from 'expo-constants';
import { HeaderHeightContext } from '@react-navigation/elements';
import { Text, Icon, ListItem, Avatar } from "react-native-elements";
import { SliderBox } from 'react-native-image-slider-box';
import { getDistance } from 'geolib';
import LoadingSpinner from "../LoadingSpinner";
import ThemeColors from "../../assets/ThemeColors";
import { ScrollView } from "react-native-gesture-handler";
import { Button } from "react-native-elements/dist/buttons/Button";
import { PLACE_DETAILS_API_KEY } from "../../config";
import { ScreenWidth } from "react-native-elements/dist/helpers";
import { TabBar, TabView, SceneMap } from 'react-native-tab-view';
import * as Analytics from 'expo-firebase-analytics';

class PlaceDetails extends Component {
  constructor(props) {
    super(props);

    const tabRoutes = [
      { key: 'details', title: 'Details' },
      { key: 'reviews', title: 'Reviews' },
      { key: 'hours', title: 'Hours' },
    ]

    this.state = {
      loading: true,
      tabIndex: 0,
      tabRoutes,
    };
  }

  componentDidMount() {
    if (this.props.route?.params?.foodChoice) {
      this.componentDidAppear();
    }
  }

  componentWillUnmount() {
    this.componentFocusUnsub && this.componentFocusUnsub();
  }

  async componentDidAppear() {
    if (!this.props.user.noAds && this.props.route?.params?.finalDecision) {
      await this.props.showInterstitial();
    }

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
    const rounded_rating = Math.round(rating);
    const fullStars = Math.floor(rounded_rating);
    const halfStar = rounded_rating % 2 !== 0;
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
    return `(${Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + 'k' : Math.sign(num) * Math.abs(num)})`;
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

  clickPlaceLink(url) {
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          console.error("Don't know how to open URL:" + url);
        }
      });
    Analytics.logEvent("event", {
      description: "PlaceDetails::clickPlaceLink"
    });
  }

  callNumber(phone_number) {
    const number = phone_number.replace(/\D/g, '');
    if (Constants.platform.android) {
      Linking.openURL(`tel:+${number}`);
    } else {
      Linking.openURL(`telprompt:+${number}`);
    }
    Analytics.logEvent("event", {
      description: "PlaceDetails::callNumber"
    });
  }

  getDateWithUTCOffset(inputTzOffset) {
    var now = new Date(); // get the current time

    var currentTzOffset = -now.getTimezoneOffset() / 60 // in hours, i.e. -4 in NY
    var deltaTzOffset = inputTzOffset - currentTzOffset; // timezone diff

    var nowTimestamp = now.getTime(); // get the number of milliseconds since unix epoch 
    var deltaTzOffsetMilli = deltaTzOffset * 1000 * 60 * 60; // convert hours to milliseconds (tzOffsetMilli*1000*60*60)
    var outputDate = new Date(nowTimestamp + deltaTzOffsetMilli) // your new Date object with the timezone offset applied.

    return outputDate;
}

  render() {
    const { place, tabIndex, tabRoutes } = this.state;
    const { utcOffset } = this.props.route?.params;

    const GooglePicBaseUrl = `https://maps.googleapis.com/maps/api/place/photo?key=${PLACE_DETAILS_API_KEY}&maxwidth=400&photo_reference=`;
    const images = place?.photos?.map(photo => GooglePicBaseUrl + photo.photo_reference);
    const coordinate = {
      latitude: place?.geometry.location.lat,
      longitude: place?.geometry.location.lng,
    };

    // console.log("Place:", place)

    // Transform the day of the week to work with Google's api
    let dayOfWeek = ((new Date()).getDay()) - 1;
    if (dayOfWeek < 0) dayOfWeek = 6;

    // Get the number of minutes right now in the day
    let minutesToday;
    if (utcOffset) {
      const now = new Date(); 
      const now_utc = Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
        now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(),
        now.getUTCMilliseconds()
      );
      const date = new Date((now_utc * 1) + (utcOffset * 60 * 1000));
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      minutesToday = Number(`${hours}` + `${minutes < 10 ? 0 : ""}${minutes}`);
    } else {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      minutesToday = Number(`${hours}` + `${minutes < 10 ? 0 : ""}${minutes}`);
    }

    // console.log("minutes today:", minutesToday)

    // Get all of the closing times in case there are multiple in one day
    const closingTimes = place?.opening_hours?.open_now
      ? place?.opening_hours?.periods
        .filter(period => period.close?.day === dayOfWeek)
        .map(period => period.close?.time)
      : [];
    
    // Go through all of the closing times to see if they are within one hour of the user's current time
    const closingSoon =
      closingTimes.filter(
        closingTime => {
          if (minutesToday >= closingTime) {
            return minutesToday - closingTime < 60
          }
          return closingTime - minutesToday < 60;
        }
      ).length > 0;

    const DetailsTab = () => (
      <View style={{
        width: ScreenWidth,
        flex: 1,
        justifyContent: 'space-between',
      }}>
        <ScrollView>
          <Text h3
            h3Style={{ textAlign: 'center', paddingBottom: 5, paddingTop: 10, paddingHorizontal: 5, fontWeight: 'bold' }}>
              {place?.name}
            </Text>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 20,
              textTransform: 'capitalize',
              paddingVertical: 10,
              paddingHorizontal: 5
            }}
          >
            {this.placeTypes(place?.types)}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 10 }}>
            <Text
              style={{
                fontWeight: 'normal',
                marginRight: 5,
                fontSize: 18
              }}
            >
              {place?.rating}
            </Text>
            {
              this.stars(place?.rating)
            }
            <Text
              style={{
                fontWeight: 'normal',
                marginHorizontal: 5,
                fontSize: 18
              }}
            >
              {this.totalRatings(place?.user_ratings_total)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 10 }}>
            {place?.priceLevel &&
              <>
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
              </>
            }
            <Text style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center', fontSize: 18 }}>
              {
                `${this.distanceAway(coordinate)} mi`
              }
            </Text>
          </View>
          <Text
            style={{
              color: place?.opening_hours.open_now ? closingSoon ? '#dd8100' : 'green' : ThemeColors.text,
              fontSize: 22,
              fontWeight: 'bold',
              alignSelf: 'center',
              paddingTop: 10,
              paddingBottom: 5,
            }}
          >
            {
              place?.opening_hours.open_now
                ? closingSoon
                  ? "Closing Soon"
                  : "Open Now"
                : "Closed Now"
            }
          </Text>
          <Text style={{
            fontSize: 20,
            textAlign: 'center',
            padding: 5,
          }}>
            {place?.opening_hours?.weekday_text[dayOfWeek]}
          </Text>
        </ScrollView>
      </View>
    );

    const ReviewsTab = () => (
      <ScrollView>
        <Text
          style={{
            fontSize: 24,
            textAlign: 'center',
            fontWeight: 'bold',
            marginVertical: 10,
          }}
        >
          Top {place?.reviews?.length || 0} Reviews
        </Text>
        <Text
          style={{
            width: ScreenWidth,
            textAlign: 'center',
            fontSize: 22,
            marginBottom: 10,
          }}
        >
          Average Review: {place?.rating} {this.totalRatings(place.user_ratings_total)}
        </Text>
        {
          place?.reviews?.map(review => {
            return (
              <View
                style={{
                  marginBottom: 10,
                  marginHorizontal: 10,
                  borderWidth: 0.5,
                  borderColor: 'lightgray',
                  shadowColor: '#444',
                  shadowOpacity: 0.5,
                  shadowRadius: 2,
                  shadowOffset: {height: 1}
                }}
              >
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
              </View>
            );
          })
        }
      </ScrollView>
    );

    const HoursTab = () => (
      <View style={{ paddingHorizontal: 10 }}>
        <Text
          style={{
            color: place?.opening_hours.open_now ? closingSoon ? '#dd8100' : 'green' : ThemeColors.text,
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
            marginVertical: 10,
          }}
        >
          {
            place?.opening_hours.open_now ? closingSoon ? "Closing Soon" : "Open Now" : "Closed Now"
          }
        </Text>
        {
          place?.opening_hours?.weekday_text?.map(weekday => {
            return (
              <Text style={{
                fontWeight: 'normal',
                fontSize: 20,
                textAlign: 'center',
                marginVertical: 4
              }}>
                {weekday}
              </Text>
            );
          })
        }
      </View>
    );

    const renderScene = SceneMap({
      details: DetailsTab,
      reviews: ReviewsTab,
      hours: HoursTab,
    });

    return (
      <View
        style={{
          flex: 1
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
              <TabView
                navigationState={{ index: tabIndex, routes: tabRoutes }}
                renderScene={renderScene}
                onIndexChange={(index) => {
                  this.setState({ tabIndex: index });
                  Analytics.logEvent("event", {
                    description: "PlaceDetails::TabView::Clicked::" + index
                  });
                }}
                renderTabBar={props => (
                  <TabBar
                    {...props}
                    indicatorStyle={{
                      backgroundColor: 'white',
                      borderRadius: 2,
                    }}
                    labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                    style={{ backgroundColor: ThemeColors.button }}
                  />
                )}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 5 }}>
                <Button
                  title={'Call'}
                  type='solid'
                  buttonStyle={{
                    backgroundColor: ThemeColors.button,
                    borderRadius: 10,
                    height: 70,
                  }}
                  titleStyle={{ fontSize: 20, color: 'white' }}
                  raised
                  containerStyle={{ width: 100, borderRadius: 10 }}
                  icon={<Icon onPress={() => this.callNumber(place.international_phone_number)} name="phone-alt" type="font-awesome-5" color='white' />}
                  iconPosition='top'
                  onPress={() => this.callNumber(place.international_phone_number)}
                />
                <Button
                  title={'Directions'}
                  type='solid'
                  buttonStyle={{
                    backgroundColor: ThemeColors.button,
                    borderRadius: 10,
                    height: 70,
                  }}
                  raised
                  titleStyle={{ fontSize: 20, color: 'white' }}
                  containerStyle={{ width: 130, borderRadius: 10 }}
                  icon={<Icon name="map" type="font-awesome-5" color='white' />}
                  iconPosition='top'
                  onPress={() => this.clickPlaceLink(place?.url)}
                />
                <Button
                  title={'Website'}
                  type='solid'
                  buttonStyle={{
                    backgroundColor: ThemeColors.button,
                    borderRadius: 10,
                    height: 70,
                  }}
                  raised
                  titleStyle={{ fontSize: 20, color: 'white' }}
                  containerStyle={{ width: 100, borderRadius: 10 }}
                  icon={<Icon name="globe-americas" type="font-awesome-5" color='white' />}
                  iconPosition='top'
                  onPress={() => this.clickPlaceLink(place?.website)}
                />
              </View>
            </>
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: 'space-between'
              }}
            >
              <Text>{''}</Text>
              <LoadingSpinner />
              <Text>{''}</Text>
            </View>
          )
        }
      </View>
    );
  }
}

export default PlaceDetails;

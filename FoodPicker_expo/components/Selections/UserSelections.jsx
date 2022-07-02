import { Component } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { View } from "react-native";
import LoadingSpinner from '../LoadingSpinner';
import { ScrollView } from "react-native-gesture-handler";
import { Text, Icon, Button } from 'react-native-elements';
import ThemeColors from "../../assets/ThemeColors";
import { ScreenWidth } from "react-native-elements/dist/helpers";
import * as Analytics from 'expo-firebase-analytics';
import FoodChoiceCard from "./FoodChoiceCard";


class UserSelections extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedFoodProfile: undefined,
      selectedFoodChoices: [],
      choicesPageIndex: 0,
      loading: true,
    }

    this.componentAppeared = this.componentAppeared.bind(this);
    this.removeFoodChoice = this.removeFoodChoice.bind(this);
    this.clearSelections = this.clearSelections.bind(this);
  }

  componentDidMount() {
    this.componentFocusUnsub = this.props.navigation.addListener('focus', () => {
      this.componentAppeared();
    });
    const { user } = this.props.route?.params;
    const { lobbyData } = this.props;
    if (lobbyData && user) {
      this.componentAppeared();
    }
  }

  componentWillUnmount() {
    this.componentFocusUnsub && this.componentFocusUnsub();
  }

  componentAppeared() {
    const { user } = this.props.route?.params;
    const { lobbyData, db } = this.props;
    this.setState({ loading: true });
    const foodSelectionsDoc = doc(db, 'food_selections', `${lobbyData.ref.id}_${user.uid}`);

    this.foodChoicesUnsub = onSnapshot(foodSelectionsDoc, selectedFoodChoices => {
      this.setState({
        selectedFoodChoices: {
          data: selectedFoodChoices.data(),
          ref: selectedFoodChoices.ref,
          id: selectedFoodChoices.id,
        },
        loading: false,
      });
    },
      err => {
        console.error("UserSelections::componentAppeared", err);
      });
  }

  componentWillUnmount() {
    this.foodChoicesUnsub && this.foodChoicesUnsub();
  }

  async removeFoodChoice(foodChoice) {
    Analytics.logEvent("event", {
      description: "UserSelections::removeFoodChoice"
    });

    const { selectedFoodChoices } = this.state;
    const { lobbyData } = this.props;
    const { user } = this.props.route?.params;

    let newFoodChoices = selectedFoodChoices?.data?.selections;
    newFoodChoices = newFoodChoices.filter(choice => choice.id !== foodChoice.id);
    await setDoc(selectedFoodChoices.ref, { selections: newFoodChoices }, { merge: true });

    if (newFoodChoices.length === 0) {
      // Remove user from lobby usersReady list
      let usersReady = lobbyData.usersReady;
      if (usersReady.includes(user.uid)) {
        usersReady = usersReady.filter(uid => uid !== user.uid);
        await setDoc(lobbyData.ref, { usersReady: usersReady }, { merge: true });
        this.props.navigation.navigate('LobbyView', { lobbyRef: lobbyData.ref });
      }
    }
  }

  clearSelections() {
    const { selectedFoodChoices } = this.state;
    const { lobbyData } = this.props;
    const { user } = this.props.route?.params;
    setDoc(selectedFoodChoices.ref, { selections: [] }, { merge: true })
      .then(() => {
        const usersReady = lobbyData.usersReady || [];
        const index = usersReady.indexOf(user.uid);
        if (index > -1) {
          usersReady.splice(index, 1);
          setDoc(lobbyData.ref, { usersReady }, { merge: true })
            .then(() => {
              this.props.navigation.navigate("LobbyView", { lobbyRef: lobbyData.ref });
              Analytics.logEvent("event", {
                description: "UserSelections::clearSelections"
              });
            })
            .catch(err => {
              Analytics.logEvent("exception", {
                description: "UserSelections::clearSelections::usersReadyRemoval"
              });
              console.error("UserSelections::clearSelections::usersReadyRemoval", err);
            })
        }
      })
      .catch(err => {
        Analytics.logEvent("exception", {
          description: "UserSelections::clearSelections"
        });
        console.error("UserSelection::clearSelections:setDoc", err);
      });
  }

  render() {
    const {
      selectedFoodChoices,
      loading,
    } = this.state;

    const { user } = this.props.route.params;
    const { lobbyData } = this.props;

    // const addressName = lobbyData.locationGeocodeAddress &&
    //   lobbyData.locationGeocodeAddress[0]?.city + ", " +
    //   lobbyData.locationGeocodeAddress[0]?.region;

    const userDisplayName = user.displayName ? user.displayName : user.firstName + " " + user.lastName

    const isUserChoices = user.uid === this.props.user.uid;
    const isHost = lobbyData?.host === this.props.user.uid;

    return (
      <View
        key={'user-selection-view'}
        style={{
          flex: 1,
          paddingHorizontal: 5,
          justifyContent: 'space-between',
        }}
      >
        {
          loading ? (
            <>
              <Text></Text>
              <LoadingSpinner />
            </>
          ) : (
            <ScrollView>
              <Text
                style={{
                  textAlign: 'center',
                  alignSelf: 'center',
                  marginTop: 5,
                  marginBottom: 5,
                  fontWeight: '600',
                  fontSize: 30,
                  fontWeight: 'normal',
                  width: ScreenWidth - 40,
                  color: isUserChoices ? ThemeColors.text : 'black'
                }}
                ellipsizeMode='tail'
                numberOfLines={1}
              >
                {userDisplayName}
              </Text>
              {/* <View style={{ paddingBottom: 3, paddingLeft: 12 }}>
                <Text style={{ fontSize: 10 }}>**Select Card to see the place's details</Text>
                {
                  (isUserChoices || isHost) &&
                  <Text style={{ fontSize: 10 }}>**Hold down selection to delete it</Text>
                }
              </View> */}
              {
                selectedFoodChoices?.data?.selections?.map((foodChoice, i) => {
                  return (
                    <FoodChoiceCard
                      i={i}
                      foodChoice={foodChoice}
                      navigation={this.props.navigation}
                      lobbyData={this.props.lobbyData}
                      deleteFunction={() => (isUserChoices || isHost) && this.removeFoodChoice(foodChoice)}
                    />
                  )
                })
              }
            </ScrollView>
          )
        }
        <View
          style={{ paddingTop: 5, paddingHorizontal: 5 }}
        >
          {
            (isUserChoices || isHost) && (
              <Button
                title="Clear Selections"
                raised
                titleStyle={{ color: ThemeColors.text, fontWeight: 'bold', fontSize: 26 }}
                buttonStyle={{ backgroundColor: 'white', borderWidth: 0.5, borderColor: 'lightgray' }}
                containerStyle={{ marginBottom: 10 }}
                icon={{
                  name: 'remove-circle',
                  type: 'material-icons',
                  color: ThemeColors.text
                }}
                onPress={this.clearSelections}
              />
            )
          }
          <Button
            title="Go to Lobby"
            raised
            titleStyle={{ color: 'white', fontWeight: 'bold', fontSize: 26 }}
            buttonStyle={{ backgroundColor: ThemeColors.text }}
            containerStyle={{ marginBottom: 10 }}
            onPress={() => this.props.navigation.navigate('LobbyView', { lobbyRef: lobbyData.ref })}
          />
        </View>
      </View>
    )
  }
}

export default UserSelections;
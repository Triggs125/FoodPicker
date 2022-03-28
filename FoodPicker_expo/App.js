import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { View, LogBox, SafeAreaView, StatusBar } from 'react-native';
import { Button, Image } from 'react-native-elements';
import { NavigationContainer, ThemeProvider } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SplashScreen from 'expo-splash-screen';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { firebaseConfig } from './config';
import ThemeColors from './assets/ThemeColors';
import { UserColors } from './ColorContext';
import { onAuthStateChanged } from "firebase/auth";
import Constants from 'expo-constants';
import * as FacebookAds from 'expo-ads-facebook';
import * as Analytics from 'expo-firebase-analytics';

import Home from './components/Home';
import CreateAccount from './components/Account/CreateAccount';
import LobbyPicker from './components/Lobby/LobbyPicker';
import LobbyView from './components/Lobby/LobbyView';
import MakeSelections from './components/Selections/MakeSelections';
import EditFoodProfile from './components/FoodProfile/EditFoodProfile';
import UserSelections from './components/Selections/UserSelections';
import PlaceDetails from './components/Selections/PlaceDetails';
import LobbyCreator from './components/Lobby/LobbyCreator';
import LoadingSpinner from './components/LoadingSpinner';
import AccountEdit from './components/Account/AccountEdit';
import ForgotPassword from './components/Account/ForgotPassword';

const Stack = createStackNavigator();

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [userColors, setUserColors] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState();
  const [lobbyData, setLobbyData] = useState();
  const [userLobbies, setUserLobbies] = useState();
  const [kickedFromLobby, setKickedFromLobby] = useState(false);
  const [interstitialAdShowing, setInterstitialAdShowing] = useState(false);

  const bannerId = getPlacementId(true);
  const interstitialId = getPlacementId(false);

  FacebookAds.AdSettings.requestPermissionsAsync()
    .then(persmissionResponse => {
      const canTrack = persmissionResponse.granted;
      FacebookAds.AdSettings.setAdvertiserTrackingEnabled(canTrack);
      setLoading(false);
    });

  function getPlacementId(isBanner) {
    let placementId;
    if (isBanner) {
      // Banner ad
      placementId = Constants.platform.android ? "1300932740403155_1308576742972088" : "1300932740403155_1308575796305516";
    } else {
      // Interstitial ad
      placementId = Constants.platform.android ? "1300932740403155_1308576809638748" : "1300932740403155_1308576426305453";
    }

    if (__DEV__) {
      return `IMG_16_9_APP_INSTALL#${placementId}`;
    }
    return placementId;
  }

  function getBannerAd() {
    if (!loading) {
      return (
        <FacebookAds.BannerAd
          placementId={bannerId}
          type='standard'
          onPress={() => {
            Analytics.logEvent("ad", {
              type: "banner",
              description: "clicked"
            });
            console.log('Banner Ad Clicked');
          }}
          onError={err => {
            Analytics.logEvent("exception", {
              description: "App:getBannerAd"
            });
            console.error('App::getBannerAd', err.nativeEvent);
          }}
        />
      );
    }
  }

  function showInterstitial() {
    if (!interstitialAdShowing) {
      setInterstitialAdShowing(true);
      return FacebookAds.InterstitialAdManager.showAd(interstitialId)
        .then(didClick => {
          Analytics.logEvent("ad", {
            type: "interstitial",
            description: `shown - ${didClick ? 'clicked on' : 'not clicked on'}`
          });
          console.log("Interstitial Ad Clicked?", didClick);
        })
        .catch(err => {
          Analytics.logEvent("exception", {
            description: "App:showInterstitial"
          });
          console.error("App::showInterstitial", err);
        })
        .finally(() => setInterstitialAdShowing(false));
    }
  }

  const navColors = {
    colors: {
      primary: ThemeColors.textTitle, // selected nav tab
      background: ThemeColors.background,
      card: ThemeColors.card,
      text: ThemeColors.text,
      border: ThemeColors.border,
      notification: ThemeColors.button,
    }
  }
  const themeProviderColors = {
    Button: {
      buttonStyle: {
        backgroundColor: ThemeColors.button
      },
      disabledStyle: {
        backgroundColor: ThemeColors.disabledButton
      },
      disabledTitleStyle: {
        color: '#fff',
      }
    },
    Input: {
      inputContainerStyle: {
        borderColor: ThemeColors.border
      },
      inputStyle: {
        color: ThemeColors.border
      }
    },
    Overlay: {
      overlayStyle: {
        backgroundColor: ThemeColors.background,
      }
    },
    Text: {
      style: {
        color: ThemeColors.button,
      }
    },
    ListItem: {
      containerStyle: {
        backgroundColor: ThemeColors.card,
        borderColor: ThemeColors.border,
      }
    }
  }

  SplashScreen.preventAutoHideAsync();
  setTimeout(SplashScreen.hideAsync, 2000);
  const navigationRef = React.useRef();
  const routeNameRef = React.useRef();
  
  // Ignore log notification by message
  LogBox.ignoreLogs([
    'AsyncStorage has been',
    'Setting a timer for a long period of time',
    'Using Math.random'
  ]);

  onAuthStateChanged(auth, (authUser) => {
    if (!authUser) {
      setUser(null);
      return;
    }
    getDocs(query(collection(db, 'users'), where('uid', '==', authUser.uid)))
      .then(docs => {
        const user = docs?.docs[0]?.data();
        if (!user) {
          setUser(authUser);
          return;
        }
        authUser.firstName = user?.firstName;
        authUser.lastName = user?.lastName;
        setUser(authUser);
      })
      .catch(err => {
        Analytics.logEvent("exception", {
          description: "App:onAuthStateChanged"
        });
        console.error("App:onAuthStateChanged", err);
        setUser(authUser)
      });
  });

  if (Constants.platform.web) {
    return (<Image source={'./assets/splash.png'} />)
  }

  return loading === true ? (
    <View>
      <LoadingSpinner />
    </View>
  ) : (
    <ThemeProvider theme={themeProviderColors}>
      <UserColors.Provider value={{ userColors, setUserColors }}>
        <SafeAreaView
          style={{
            flex: 1,
            paddingTop: StatusBar.currentHeight,
          }}
        >
          {getBannerAd()}
          <NavigationContainer
            ref={navigationRef}
            theme={navColors}
            onReady={() => {
              routeNameRef.current = navigationRef.current.getCurrentRoute().name;
            }}
            onStateChange={async () => {
              const previousRouteName = routeNameRef.current;
              const currentRouteName = navigationRef.current.getCurrentRoute().name;

              if (previousRouteName !== currentRouteName) {
                await Analytics.logEvent("screen_view", {
                  screen_name: currentRouteName
                });
              }
              routeNameRef.current = currentRouteName;
            }}
          >
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={(props) => {
                return {
                  headerStyle: { height: 50 },
                  headerTitleStyle: { fontSize: 20 },
                  headerRight: () => (
                    <Button
                      raised
                      icon={{
                        name: 'home',
                        type: 'material-community-icons',
                        color: 'white'
                      }}
                      style={{ fontSize: 24 }}
                      buttonStyle={{
                        backgroundColor: ThemeColors.button,
                        borderRadius: 25,
                        paddingHorizontal: 4,
                        borderWidth: 1,
                        borderColor: 'lightgray'
                      }}
                      containerStyle={{ marginRight: 8, borderRadius: 25 }}
                      onPress={() => props.navigation.navigate('Home')}
                    />
                  ),
                  headerTitleAlign: 'center',
                }
              }}
            >
              <Stack.Screen
                name="Home"
                options={{ headerTitle: 'Home', headerRight: () => {<></>} }}
              >
                {props => (
                  <Home
                    {...props}
                    user={user}
                    auth={auth}
                    db={db}
                    setLobbyData={setLobbyData}
                    showInterstitial={showInterstitial}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="CreateAccount"
                options={{ headerTitle: 'Create an Account', headerRight: () => {<></>} }}
              > 
                {props => <CreateAccount {...props} user={user} auth={auth} db={db} />}
              </Stack.Screen>
              <Stack.Screen
                name="ForgotPassword"
                options={{ headerTitle: 'Reset Password', headerRight: () => {<></>} }}
              >
                {props => <ForgotPassword {...props} user={user} auth={auth} db={db} />}
              </Stack.Screen>
              {
                // Cannot see these screens until the user is logged in
                user && (
                  <>
                    <Stack.Screen
                      name="AccountEdit"
                      options={{ headerTitle: 'Edit Account' }}
                    > 
                      {props => <AccountEdit {...props} setUser={setUser} user={user} auth={auth} db={db} />}
                    </Stack.Screen>
                    <Stack.Screen
                      name="LobbyPicker"
                      options={{ headerTitle: "Join or Create a Lobby" }}
                    >
                      {props => <LobbyPicker {...props} userLobbies={userLobbies} user={user} auth={auth} db={db} kickedFromLobby={kickedFromLobby} setKickedFromLobby={setKickedFromLobby} />}
                    </Stack.Screen>
                    <Stack.Screen
                      name="LobbyCreator"
                      options={{ headerTitle: "Create a Lobby" }}
                    >
                      {props => <LobbyCreator {...props} user={user} auth={auth} db={db} />}
                    </Stack.Screen>
                    <Stack.Screen
                      name="LobbyView"
                      options={{ headerTitle: "Lobby" }}
                    >
                      {props => (
                        <LobbyView
                          {...props}
                          user={user}
                          auth={auth}
                          db={db}
                          setLobbyData={setLobbyData}
                          setKickedFromLobby={setKickedFromLobby}
                        />
                      )}
                    </Stack.Screen>
                    <Stack.Screen
                      name="MakeSelections"
                      options={{
                        headerTitle: "Make Selections",
                        headerTitleAlign: 'center'
                      }}
                    >
                      {props => (
                        <MakeSelections
                          {...props}
                          user={user}
                          auth={auth}
                          db={db}
                          lobbyData={lobbyData}
                          showInterstitial={showInterstitial}
                        />
                      )}
                    </Stack.Screen>
                    <Stack.Screen
                      name="UserSelections"
                      options={{
                        headerTitle: "Selections",
                        headerTitleAlign: 'center'
                      }}
                    >
                      {props => <UserSelections {...props} user={user} auth={auth} db={db} lobbyData={lobbyData} />}
                    </Stack.Screen>
                    <Stack.Screen
                      name="EditFoodProfile"
                      options={{ headerTitle: "Edit Food Profile" }}
                    >
                      {props => <EditFoodProfile {...props} user={user} auth={auth} db={db} />}
                    </Stack.Screen>
                    <Stack.Screen
                      name="PlaceDetails"
                      options={{ headerTitle: "Place Details", cardStyle: { backgroundColor: 'white' } }}
                    >
                      {props => (
                        <PlaceDetails
                          {...props}
                          user={user}
                          auth={auth}
                          db={db}
                          lobbyData={lobbyData}
                          showInterstitial={showInterstitial}
                        />
                      )}
                    </Stack.Screen>
                  </>
                )
              }
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaView>
      </UserColors.Provider>
    </ThemeProvider>
  )
}
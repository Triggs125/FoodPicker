import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { NavigationContainer, ThemeProvider } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SplashScreen from 'expo-splash-screen';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import ThemeColors from './assets/ThemeColors';
import { UserColors } from './ColorContext';

import Account from './components/Account/Account';
import CreateAccount from './components/Account/CreateAccount';
import SignIn from './components/Account/SignIn';
import Lobby from './components/Lobby/Lobby';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const Stack = createStackNavigator();

export default function App() {
  const [userColors, setUserColors] = useState({}); 
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
  SplashScreen.hideAsync();
  const navigationRef = React.useRef();
  // LogBox.ignoreLogs(['Non-serializable values were found in the navigation state.',
  //   'Error: Native splash screen is already hidden.']); // Ignore log notification by message

  return (
    <ThemeProvider theme={themeProviderColors}>
      <UserColors.Provider value={{ userColors, setUserColors }} >
        <NavigationContainer
          ref={navigationRef}
          theme={navColors}
        >
          <Stack.Navigator initialRouteName="CreateAccount">
            <Stack.Screen
              name="Lobby"
              component={Lobby}
              options={{ headerTitle: 'Lobby' }}
            />
            <Stack.Screen
              name="Account"
              component={Account}
              options={{ headerTitle: 'Good evening' }}
            />
            <Stack.Screen
              name="CreateAccount"
              component={CreateAccount}
              options={{ headerTitle: 'Create an Account' }}
            />
            <Stack.Screen
              name="SignIn"
              component={SignIn}
              options={{ headerTitle: 'Sign In' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </UserColors.Provider>
    </ThemeProvider>
  )
}

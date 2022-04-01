import { NavigationContainer, ThemeProvider } from "@react-navigation/native";
import { createStackNavigator } from '@react-navigation/stack';
import React, { useState } from "react";
import * as Analytics from 'expo-firebase-analytics';
import ThemeColors from "../../assets/ThemeColors";
import { UserColors } from '../../ColorContext';

import Home from "./Home";

const Stack = createStackNavigator();

export default function Website() {
  const [userColors, setUserColors] = useState({});

  const navigationRef = React.useRef();
  const routeNameRef = React.useRef();
  
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

  return (
    <ThemeProvider theme={themeProviderColors}>
      <UserColors.Provider value={{ userColors, setUserColors }}>
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
            screenOptions={() => {
              return {
                headerTitleAlign: 'center',
                headerTitleStyle: { fontSize: 28 }
              }
            }}
          >
            <Stack.Screen
              name="Home"
              options={{
                headerTitle: "Food Picker"
              }}
              component={Home}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </UserColors.Provider>
    </ThemeProvider>
  )
}

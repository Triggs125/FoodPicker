import { Component } from "react";
import { SafeAreaView, StyleSheet, View, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { Input, Button, Text } from 'react-native-elements';
import LoadingSpinner from '../LoadingSpinner';

class Account extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      username: "",
      error: false,
    }
  }

  render() {
    const { loading, username, error } = this.state;
    return (
      <SafeAreaView>
        <LoadingSpinner spinning={loading} />
        <View style={styles.container}>
          <Button
            title="Sign in with FoodPicker"
            raised={{}}
            icon={{
              name: 'home',
              type: 'font-awesome',
              color: 'white',
              marginRight: 8
            }}
            titleStyle={{ fontWeight: '500', fontSize: 22 }}
            buttonStyle={{
              backgroundColor: '#E54040',
              borderColor: 'transparent',
              borderWidth: 0,
              height: 60,
            }}
            containerStyle={{
              width: 330,
              alignSelf: 'center',
              marginBottom: 20,
              marginTop: 10,
              overflow: 'visible'
            }}
            onPress={() => { this.props.navigation.navigate('SignIn') }}
          />
          <Button
            title="Sign in with Google"
            raised
            icon={{
              name: 'google',
              type: 'font-awesome',
              color: 'white',
              marginRight: 8
            }}
            titleStyle={{ fontWeight: '500', fontSize: 22 }}
            buttonStyle={{
              backgroundColor: '#4285F4',
              borderColor: 'transparent',
              borderWidth: 0,
              height: 60
            }}
            containerStyle={{
              width: 330,
              alignSelf: 'center',
              overflow: 'visible'
            }}
            onPress={() => { this.props.navigation.navigate('CreateAccount') }}
          />
          <Text
            style={{
              textAlign: 'center',
              fontSize: 20,
              marginTop: 50,
              marginBottom: 50,
              color: 'grey',
            }}
          >
            OR
          </Text>
          <Button
            title="Create an Account"
            raised
            icon={{
              name: 'user',
              type: 'font-awesome',
              color: 'black',
              marginRight: 8
            }}
            titleStyle={{ fontWeight: '500', fontSize: 22, color: 'black' }}
            borderRadius={15}
            buttonStyle={{
              backgroundColor: '#fff',
              height: 60,
              borderRadius: 15
            }}
            containerStyle={{
              borderRadius: 15,
              overflow: 'visible'
            }}
            containerStyle={{
              width: 330,
              alignSelf: 'center',
            }}
            onPress={() => { this.props.navigation.navigate('CreateAccount') }}
          />
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: Constants.statusBarHeight,
    display: 'flex',
    justifyContent: 'flex-start',
    paddingLeft: 20,
    paddingRight: 20,
    height: '100%',
  },
});

export default Account;
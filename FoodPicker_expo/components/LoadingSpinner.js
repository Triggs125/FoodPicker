import * as React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import ThemeColors from '../assets/ThemeColors';

const LoadingSpinner = () => {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={ThemeColors.text} />
    </View>
  );
};

const styles = StyleSheet.create({
  loading: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 10000,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoadingSpinner;
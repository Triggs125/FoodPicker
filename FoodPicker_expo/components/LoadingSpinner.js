import * as React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import ThemeColors from '../assets/ThemeColors';

const LoadingSpinner = ({ size = "large", style }) => {
  return (
    <View style={{...styles.loading, ...style}}>
      <ActivityIndicator size={size} color={ThemeColors.text} />
    </View>
  );
};

const styles = StyleSheet.create({
  loading: {
    backgroundColor: 'rgba(0, 0, 0, 0)',
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
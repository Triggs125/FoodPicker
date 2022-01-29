import * as React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const LoadingSpinner = ({ spinning }) => {
  return spinning ? (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#512888" />
    </View>
  ) : null;
};

const styles = StyleSheet.create({
  loading: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoadingSpinner;
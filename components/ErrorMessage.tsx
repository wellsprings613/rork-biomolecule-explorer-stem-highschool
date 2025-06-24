import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/constants/colors';
import { AlertCircle, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface ErrorMessageProps {
  message: string;
  onDismiss: () => void;
}

export default function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  const handleDismiss = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    onDismiss();
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AlertCircle size={20} color={colors.white} />
      </View>
      <Text style={styles.message}>{message}</Text>
      <Pressable 
        style={({ pressed }) => [
          styles.dismissButton,
          pressed && styles.dismissButtonPressed
        ]} 
        onPress={handleDismiss}
      >
        <X size={16} color={colors.gray[600]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: 12,
    margin: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[800],
    lineHeight: 20,
  },
  dismissButton: {
    padding: 8,
    borderRadius: 16,
  },
  dismissButtonPressed: {
    backgroundColor: colors.gray[200],
  },
});
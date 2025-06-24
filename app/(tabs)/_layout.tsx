import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Info, Settings } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Platform, StyleSheet, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[500],
        tabBarStyle: {
          borderTopColor: colors.gray[200],
          ...Platform.select({
            ios: {
              paddingBottom: 10, // Add extra padding for iOS devices
              height: 80, // Increase height for iOS
            }
          })
        },
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTitleStyle: {
          color: colors.gray[900],
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        tabBarIconStyle: {
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="viewer"
        options={{
          title: 'Protein Viewer',
          tabBarIcon: ({ color }) => <Info size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
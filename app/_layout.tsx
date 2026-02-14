import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, useSegments, useRootNavigationState } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (isLoading) return;
    if (!navigationState?.key) return;

    const inAuthScreen = segments[0] === "login";

    if (user && inAuthScreen) {
      router.replace("/(tabs)");
    } else if (!user && !inAuthScreen) {
      router.replace("/login");
    }
  }, [user, isLoading, segments, navigationState?.key]);

  if (isLoading) {
    return (
      <View style={loadStyles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="history" options={{ headerShown: false }} />
      <Stack.Screen name="submit-details" options={{ headerShown: false }} />
      <Stack.Screen name="video-request" options={{ headerShown: false }} />
      <Stack.Screen name="protocol-request" options={{ headerShown: false }} />
      <Stack.Screen name="customs-request" options={{ headerShown: false }} />
      <Stack.Screen name="pakistan-guide" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
    </Stack>
  );
}

const loadStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.background,
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView>
          <KeyboardProvider>
            <AuthProvider>
              <AuthGate />
            </AuthProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

import { useAuth } from "@/context/auth-context";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleRegister = useCallback(async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      router.replace("/(drawer)/today" as any);
    } catch (err: any) {
      Alert.alert(
        "Registration Failed",
        err?.message || "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }, [name, email, password, register, router]);

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.delay(60).springify()}
            style={styles.brandBlock}
          >
            <Image
              source={require("../assets/images/icon-nobg.png")}
              style={styles.brandIcon}
              resizeMode="contain"
            />
            <Text style={styles.brand}>Fit Bites</Text>
            <Text style={styles.subtitle}>Create your account.</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(120).springify()}
            style={styles.form}
          >
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#BBBBBB"
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            </View>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#BBBBBB"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Password (min 8 characters)"
                placeholderTextColor="#BBBBBB"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                (pressed || loading) && styles.buttonPressed,
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={styles.linkContainer}
              disabled={loading}
            >
              <Text style={styles.linkText}>
                Already have an account?{" "}
                <Text style={styles.linkBold}>Sign In</Text>
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  inner: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 32,
  },
  brandBlock: {
    alignItems: "center",
    marginBottom: 40,
  },
  brandIcon: {
    width: SCREEN_WIDTH * 0.4,
    height: SCREEN_WIDTH * 0.4,
    marginBottom: 8,
  },
  brand: {
    fontFamily: "Questrial",
    fontSize: 36,
    fontWeight: "200",
    color: "#111111",
    letterSpacing: 2,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Questrial",
    fontSize: 14,
    color: "#BBBBBB",
    marginTop: 6,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  form: {
    gap: 14,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FAFAFA",
  },
  input: {
    fontFamily: "Questrial",
    paddingVertical: 14,
    fontSize: 16,
    color: "#111111",
  },
  button: {
    backgroundColor: "#111111",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
    minHeight: 52,
    justifyContent: "center",
  },
  buttonPressed: { opacity: 0.75 },
  buttonText: {
    fontFamily: "Questrial",
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  linkContainer: {
    alignItems: "center",
    paddingVertical: 6,
  },
  linkText: {
    fontFamily: "Questrial",
    fontSize: 14,
    color: "#AAAAAA",
  },
  linkBold: {
    fontFamily: "Questrial",
    color: "#111111",
    fontWeight: "600",
  },
});

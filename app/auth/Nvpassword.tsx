import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';

const NvpasswordScreen: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const windowWidth = Dimensions.get('window').width;
  const isSmallScreen = windowWidth < 768;

  const handleSendEmail = () => {
    console.log(`Recovery email sent to: ${email}`);
    router.push('../auth/verificacion');
  };

  const handleGoBack = () => {
    router.push('../(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.mainContainer, isSmallScreen && styles.smallScreenContainer]}>
          {/* Left Container (Form) */}
          <View style={[styles.leftContainer, isSmallScreen && styles.smallLeftContainer]}>
            <TouchableOpacity onPress={handleGoBack} style={styles.backButtonContainer}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>

            <Image
              source={require('../../assets/images/Logo1.png')}
              style={[styles.logo, isSmallScreen && styles.smallLogo]}
              resizeMode="contain"
            />

            <Text style={[styles.title, isSmallScreen && styles.smallTitle]}>¿OLVIDASTE TU CONTRASEÑA?</Text>
            <Text style={[styles.description, isSmallScreen && styles.smallDescription]}>
              No te preocupes. Ingresa el correo electrónico asociado a tu cuenta y te
              enviaremos un enlace para que puedas restablecer tu contraseña de forma segura.
            </Text>

            <TextInput
              style={[styles.input, isSmallScreen && styles.smallInput]}
              placeholder="EMAIL"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity style={[styles.button, isSmallScreen && styles.smallButton]} onPress={handleSendEmail}>
              <Text style={styles.buttonText}>Enviar Gmail</Text>
            </TouchableOpacity>
          </View>

          {/* Right Container (Image) - Hidden on small screens */}
          {!isSmallScreen && (
            <View style={styles.rightContainer}>
              <Image
                source={require('../../assets/images/FOTO 3.jpg')}
                style={styles.modelImage}
                resizeMode="cover"
              />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default NvpasswordScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    minHeight: Dimensions.get('window').height,
  },
  smallScreenContainer: {
    flexDirection: 'column',
  },
  leftContainer: { 
    flex: 1,
    paddingHorizontal: 40,
    paddingVertical: 30,
    justifyContent: 'center',
    maxWidth: 600,
    alignSelf: 'center',
  },
  smallLeftContainer: {
    width: '100%',
    maxWidth: '100%',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  rightContainer: { 
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backButtonContainer: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButton: { 
    fontSize: 28,
    color: '#000',
  },
  logo: { 
    width: 300,
    height: 250,
    marginBottom: -40,
    marginTop: -50,
    alignSelf: 'center',
  },
  smallLogo: {
    width: 200,
    height: 150,
    marginBottom: -20,
    marginTop: 0,
  },
  title: { 
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  smallTitle: {
    fontSize: 18,
    marginBottom: 15,
  },
  description: { 
    marginBottom: 30,
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  smallDescription: {
    fontSize: 14,
    marginBottom: 25,
    lineHeight: 20,
  },
  input: {
    height: 50,
    width: '100%',
    maxWidth: 350,
    borderColor: '#000',
    borderWidth: 1,
    paddingHorizontal: 15,
    borderRadius: 25,
    alignSelf: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  smallInput: {
    height: 45,
    borderRadius: 22,
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 25,
    marginBottom: 15,
    width: '100%',
    maxWidth: 350,
    alignSelf: 'center',
  },
  smallButton: {
    paddingVertical: 12,
    borderRadius: 22,
  },
  buttonText: { 
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modelImage: {
    width: '100%',
    height: '100%',
  },
});
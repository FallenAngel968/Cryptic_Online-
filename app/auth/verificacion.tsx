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

const VerifyCodeScreen: React.FC = () => {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '']);
  const windowWidth = Dimensions.get('window').width;
  const isSmallScreen = windowWidth < 768;

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-focus to next input
    if (value && index < 3) {
      // You'll need to add refs to your TextInputs to implement this
    }
  };

  const handleResend = () => {
    console.log('Resend code...');
  };

  const handleSubmit = () => {
    console.log(`Verification code: ${code.join('')}`);
    router.push('../auth/NewPassword');
  };

  const handleGoBack = () => {
    router.push('../auth/Nvpassword');
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

            <Text style={[styles.title, isSmallScreen && styles.smallTitle]}>VERIFICACION DE EMAIL</Text>
            <Text style={[styles.description, isSmallScreen && styles.smallDescription]}>
              Hemos enviado un código de verificación a tu dirección de correo electrónico.
              Por favor, revisa tu bandeja de entrada (y también la carpeta de spam) e ingresa el código para continuar.
            </Text>

            <View style={[styles.codeContainer, isSmallScreen && styles.smallCodeContainer]}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  style={[styles.codeInput, isSmallScreen && styles.smallCodeInput]}
                  keyboardType="numeric"
                  maxLength={1}
                  value={digit}
                  onChangeText={(value) => handleChange(index, value)}
                />
              ))}
            </View>

            <TouchableOpacity onPress={handleResend}>
              <Text style={[styles.resendText, isSmallScreen && styles.smallResendText]}>
                ¿NO RECIBISTE EL CORREO? REENVIAR CODIGO
              </Text>
             
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, isSmallScreen && styles.smallButton]} 
              onPress={handleSubmit}
            >
              <Text style={styles.buttonText}>ENVIAR</Text>
            </TouchableOpacity>
          </View>

          {/* Right Container (Image) - Hidden on small screens */}
          {!isSmallScreen && (
            <View style={styles.rightContainer}>
              <Image
                source={require('../../assets/images/modelo1.jpg')}
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

export default VerifyCodeScreen;

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
  codeContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  smallCodeContainer: {
    paddingHorizontal: 20,
    justifyContent: 'space-around',
  },
  codeInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#000',
    textAlign: 'center',
    fontSize: 18,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  smallCodeInput: {
    width: 40,
    height: 45,
    fontSize: 16,
  },
  resendText: { 
    color: '#000',
    marginBottom: 20,
    fontSize: 14,
    textAlign: 'center',
    alignSelf: 'center',
  },
  smallResendText: {
    fontSize: 12,
    marginBottom: 15,
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
    maxWidth: '100%',
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
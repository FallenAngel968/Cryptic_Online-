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
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

const NewPasswordScreen: React.FC = () => {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;

  const handleResetPassword = () => {
    if (newPassword.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    console.log('Nueva contraseña:', newPassword);
    router.push('../auth/login');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View
          style={[
            styles.mainContainer,
            isSmallScreen ? styles.columnLayout : styles.rowLayout,
          ]}
        >
          {/* LADO IZQUIERDO */}
          <View
            style={[
              styles.leftContainer,
              { width: isSmallScreen ? '100%' : '50%' },
            ]}
          >
            <TouchableOpacity onPress={handleGoBack} style={styles.backButtonContainer}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>

            {isSmallScreen && (
              <Image
                source={require('../../assets/images/Logo1.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            )}

            <Text style={styles.title}>AGREGA UNA DIRECCIÓN</Text>
            <Text style={styles.description}>
              Ingresa una nueva contraseña segura. Asegúrate de que sea fácil de recordar pero difícil de adivinar. Tu nueva contraseña debe tener al menos 8 caracteres.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="NUEVA CONTRASEÑA"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="CONFIRMA CONTRASEÑA"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
              <Text style={styles.buttonText}>RESTABLECER</Text>
            </TouchableOpacity>
          </View>

          {/* LADO DERECHO */}
          {!isSmallScreen && (
            <View style={styles.rightContainer}>
              <Image
                source={require('../../assets/images/shirt1.png')}
                style={styles.modelImage}
                resizeMode="contain"
              />
              <Image
                source={require('../../assets/images/Logo1.png')}
                style={styles.logoRight}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default NewPasswordScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1 },
  mainContainer: { flex: 1 },
  rowLayout: { flexDirection: 'row' },
  columnLayout: { flexDirection: 'column' },
  leftContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
    maxWidth: 600,
    alignSelf: 'center',
  },
  rightContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  backButtonContainer: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButton: {
    fontSize: 28,
  },
  logo: {
    width: '80%',
    height: 200,
    marginBottom: 20,
    alignSelf: 'center',
  },
  logoRight: {
    width: '60%',
    height: 150,
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    marginBottom: 30,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    height: 50,
    width: '100%',
    maxWidth: 400,
    borderColor: '#000',
    borderWidth: 1,
    paddingHorizontal: 15,
    borderRadius: 25,
    alignSelf: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 25,
    marginBottom: 15,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modelImage: {
    width: '80%',
    height: '80%',
    maxHeight: 600,
  },
});

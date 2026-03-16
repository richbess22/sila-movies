// App.js - Simplified for Termux
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Linking,
  Alert
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const Stack = createStackNavigator();

// Colors
const colors = {
  primary: '#0066FF',
  background: '#0A0F1E',
  card: '#1A1F2E',
  text: '#FFFFFF',
  textSecondary: '#8899AA',
  border: '#2A2F3E'
};

// API URL - CHANGE THIS TO YOUR COMPUTER'S IP
const API_URL = 'http://192.168.1.100:5000/api';

// SAMPLE DATA (Use this if backend is not ready)
const SAMPLE_MOVIES = [
  {
    _id: '1',
    title: 'Fast & Furious 10',
    poster: 'https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/4XM8DUTQb3lhLemJC51Jx4a2EuA.jpg',
    year: 2024,
    rating: 7.8,
    description: 'The final chapter of the Fast & Furious saga.',
    genre: ['Action', 'Thriller'],
    duration: '2h 21min',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    downloadUrl: 'https://drive.google.com/file/d/1IyyDGATtjaE6z5yncmBNf0_V2UoicVZO/view'
  },
  {
    _id: '2',
    title: 'Oppenheimer',
    poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    year: 2023,
    rating: 8.5,
    description: 'The story of American scientist J. Robert Oppenheimer.',
    genre: ['Biography', 'Drama'],
    duration: '3h',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    downloadUrl: 'https://drive.google.com/file/d/1IyyDGATtjaE6z5yncmBNf0_V2UoicVZO/view'
  }
];

// Splash Screen
function SplashScreen({ navigation }) {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace('Home');
    }, 2000);
  }, []);
  
  return (
    <LinearGradient colors={[colors.background, '#000']} style={styles.container}>
      <Text style={styles.logo}>SILA MOVIES</Text>
      <Text style={styles.slogan}>Stream Movies & Live TV</Text>
    </LinearGradient>
  );
}

// Home Screen
function HomeScreen({ navigation }) {
  const [movies, setMovies] = useState(SAMPLE_MOVIES);
  
  const MovieCard = ({ movie }) => (
    <TouchableOpacity 
      style={styles.movieCard}
      onPress={() => navigation.navigate('MovieDetail', { movie })}
    >
      <Image source={{ uri: movie.poster }} style={styles.moviePoster} />
      <Text style={styles.movieTitle} numberOfLines={1}>{movie.title}</Text>
      <Text style={styles.movieYear}>{movie.year} • ⭐ {movie.rating}</Text>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.logoSmall}>SILA MOVIES</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <ScrollView>
        <Text style={styles.sectionTitle}>🔥 Trending Movies</Text>
        <FlatList
          horizontal
          data={movies}
          renderItem={({ item }) => <MovieCard movie={item} />}
          keyExtractor={item => item._id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectionContent}
        />
        
        <Text style={styles.sectionTitle}>🆕 New Movies</Text>
        <FlatList
          horizontal
          data={movies}
          renderItem={({ item }) => <MovieCard movie={item} />}
          keyExtractor={item => item._id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectionContent}
        />
      </ScrollView>
      
      {/* AI Chat Button */}
      <TouchableOpacity 
        style={styles.chatButton}
        onPress={() => navigation.navigate('AIChat')}
      >
        <Ionicons name="chatbubble-ellipses" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

// Movie Detail Screen
function MovieDetailScreen({ route, navigation }) {
  const { movie } = route.params;
  
  const handlePlay = () => {
    navigation.navigate('VideoPlayer', { url: movie.videoUrl, title: movie.title });
  };
  
  const handleDownload = () => {
    if (movie.downloadUrl) {
      Linking.openURL(movie.downloadUrl);
    } else {
      Alert.alert('Info', 'Download link not available');
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: movie.backdrop }} style={styles.backdrop} />
      <LinearGradient colors={['transparent', colors.background]} style={styles.backdropGradient} />
      
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      
      <View style={styles.movieDetailContent}>
        <Text style={styles.detailTitle}>{movie.title}</Text>
        
        <View style={styles.detailMeta}>
          <Text style={styles.detailYear}>{movie.year}</Text>
          <Text style={styles.detailRating}>⭐ {movie.rating}/10</Text>
          <Text style={styles.detailDuration}>{movie.duration}</Text>
        </View>
        
        <View style={styles.genreContainer}>
          {movie.genre.map((g, i) => (
            <View key={i} style={styles.genreTag}>
              <Text style={styles.genreText}>{g}</Text>
            </View>
          ))}
        </View>
        
        <Text style={styles.detailDescription}>{movie.description}</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
            <Ionicons name="play" size={24} color="white" />
            <Text style={styles.actionText}>PLAY</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
            <Ionicons name="download" size={24} color="white" />
            <Text style={styles.actionText}>DOWNLOAD</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.sectionTitle}>🔥 Latest Trending</Text>
        <FlatList
          horizontal
          data={SAMPLE_MOVIES.filter(m => m._id !== movie._id)}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.movieCard}
              onPress={() => navigation.push('MovieDetail', { movie: item })}
            >
              <Image source={{ uri: item.poster }} style={styles.moviePoster} />
              <Text style={styles.movieTitle}>{item.title}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item._id}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </ScrollView>
  );
}

// Video Player
function VideoPlayerScreen({ route, navigation }) {
  const { url, title } = route.params;
  const video = React.useRef(null);
  
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <TouchableOpacity style={styles.videoBackButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      
      <Video
        ref={video}
        style={styles.video}
        source={{ uri: url }}
        useNativeControls
        resizeMode="contain"
        shouldPlay
      />
    </View>
  );
}

// AI Chat Screen
function AIChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    // Simulate AI response (replace with actual API later)
    setTimeout(() => {
      const aiMessage = { 
        role: 'ai', 
        content: 'Hello! I am SILA AI assistant. How can I help you today?' 
      };
      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);
    }, 1000);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.chatTitle}>AI Assistant</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <FlatList
        style={styles.chatList}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={[
            styles.messageBubble, 
            item.role === 'user' ? styles.userMessage : styles.aiMessage
          ]}>
            <Text style={styles.messageText}>{item.content}</Text>
          </View>
        )}
      />
      
      <View style={styles.chatInput}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask me anything..."
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity onPress={sendMessage} disabled={loading}>
          <Ionicons name="send" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Search Screen
function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(SAMPLE_MOVIES);
  
  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search movies..."
          placeholderTextColor={colors.textSecondary}
        />
      </View>
      
      <FlatList
        data={results}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.searchResult}
            onPress={() => navigation.navigate('MovieDetail', { movie: item })}
          >
            <Image source={{ uri: item.poster }} style={styles.searchPoster} />
            <Text style={styles.searchTitle}>{item.title}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item._id}
      />
    </View>
  );
}

// Main App
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
          <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
          <Stack.Screen name="AIChat" component={AIChatScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  logoSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  slogan: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionContent: {
    paddingHorizontal: 16,
  },
  movieCard: {
    width: 120,
    marginRight: 10,
  },
  moviePoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginBottom: 5,
  },
  movieTitle: {
    fontSize: 14,
    color: colors.text,
  },
  movieYear: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chatButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  backdrop: {
    width: width,
    height: 250,
  },
  backdropGradient: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    height: 100,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  movieDetailContent: {
    padding: 16,
    marginTop: -50,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  detailMeta: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailYear: {
    color: colors.textSecondary,
    marginRight: 15,
  },
  detailRating: {
    color: '#FFD700',
    marginRight: 15,
  },
  detailDuration: {
    color: colors.textSecondary,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  genreTag: {
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  genreText: {
    color: colors.text,
  },
  detailDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: colors.text,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  video: {
    flex: 1,
  },
  videoBackButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: colors.card,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  chatList: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  userMessage: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
  },
  aiMessage: {
    backgroundColor: colors.card,
    alignSelf: 'flex-start',
  },
  messageText: {
    color: colors.text,
  },
  chatInput: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    color: colors.text,
    padding: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: colors.card,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.background,
    color: colors.text,
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
  },
  searchResult: {
    flex: 1,
    margin: 8,
  },
  searchPoster: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  searchTitle: {
    color: colors.text,
    marginTop: 5,
    textAlign: 'center',
  },
});
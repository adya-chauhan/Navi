import { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  SafeAreaView, 
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Animated,
  PanResponder,
  Alert,
  ActivityIndicator,
  Linking,
  LayoutAnimation,
  UIManager,
  Keyboard,
  TouchableWithoutFeedback,
  RefreshControl,
  Switch
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import * as ImagePicker from 'expo-image-picker';
import { WebView } from 'react-native-webview';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { 
  generatePoliteResponse, 
  generateContactReply, 
  generatePoliteSuggestionsList, 
  generateSimulatedMessage,
  generateSupportAdvice,
  generateNaviChildAdvice
} from './services/LocalLLMService';

import { 
  supabase, 
  upsertProfile, 
  fetchProfiles, 
  fetchChatHistory, 
  sendSupabaseMessage, 
  subscribeToRealtimeMessages,
  fetchProfileByPhone
} from './services/SupabaseService';

const initialProfilesData = [];

const initialMessagesData = {};

// Auto replies templates
const autoReplies = {
  '1': [
    "Look at the drawing of a unicorn I made! It has wings and a golden horn! 🦄",
    "Why are you so slow? You are such a stupid loser at this game! Go away! 🎮",
    "I want chocolate! Can you ask Mommy if we can get ice cream later? 🍦",
    "Let's play tag! You're it! No tag-backs! 🏃‍♀️",
    "You are being so mean and rude today. I hate you! 😠",
    "Yay! You are the best friend ever!",
    "My loose tooth just fell out! Now the tooth fairy is gonna visit me! 🦷",
    "I got a new coloring book with Disney princesses! Want to color with me? 🎨",
    "Look at my new light-up sneakers! They blink red and blue when I jump! 👟",
    "Can we build a pillow fort in the living room and tell ghost stories? ⛺",
    "My favorite flavor of ice cream is strawberry. What's yours?",
    "Let's watch cartoons together! I love the funny cartoon with the talking cat! 🐱",
    "I drew a picture of you and me holding hands. I'll show it to you later!",
    "Oops! I spilled some juice on my shirt, but don't tell Mommy! 🤫"
  ],
  '2': [
    "I beat my high score in the video game! I got 10,000 points! 🎮",
    "Shut up, you don't know how to build Lego spaceships. You are a weirdo! 🚀",
    "Can we play Minecraft later? I want to build a giant castle with a lava moat! 🏰",
    "Where is my blue Lego piece? I need it to finish my big spaceship! 🚀",
    "You are an ugly jerk! I don't want to play with you anymore! 😡",
    "Vroom vroom! I'm a super fast race car! 🏎️",
    "I learned a new trick on my skateboard today. I didn't even fall once!",
    "Do you want to see my collection of cool shiny rocks? I found a purple one! 💎",
    "My soccer team won the match today! I scored the winning goal! ⚽",
    "Let's build a giant paper airplane and see if it can fly across the yard! ✈️",
    "I'm building a secret robot helper. It's made of cardboard and tin foil!",
    "Can I borrow your gaming controller? Mine is running out of battery.",
    "Mommy says I have to finish my homework before I can play. Help me with math! 📝",
    "I found a funny-looking bug in the garden. It has ten legs! 🐛"
  ],
  '3': [
    "I'm reading a really cool adventure book about a magic treehouse! 📖",
    "You are so bad at this game! Only a complete fool would play like that! 🙄",
    "Do you want to play badminton in the park after school today? 🏸",
    "I learned a new dance routine in my class today! It's so fast! 💃",
    "Why are you being so fat and lazy? Go run outside and practice! 🏃‍♀️",
    "Let's work on our science volcano project! We need baking soda and vinegar. 🌋",
    "I got a shiny new gel pen set! They smell like fruits! ✍️",
    "Can we bake chocolate chip cookies later? I want to lick the spoon! 🍪",
    "I'm practicing my piano lessons. Do-Re-Mi-Fa-Sol! 🎹",
    "Look at this cute kitten video I found online! It's so fluffy!",
    "I want to learn how to rollerblade. Will you hold my hand so I don't fall? 🛼",
    "Let's make friendship bracelets with colorful threads! I'm making a pink one for you.",
    "My favorite school subject is art because we get to paint whatever we want.",
    "I'm listening to my favorite song. Let's sing together! 🎤"
  ],
  '4': [
    "Have you eaten yet? I can make your favorite food if you come over! 🍲",
    "Love you! Take some rest and don't work too hard. ❤️",
    "So proud of you, sweetheart. Call me when you get a chance!",
    "Don't forget to take a walk and get some fresh air. 🌸",
    "I sent you some fresh mangoes. Let me know if you liked them! 🥭",
    "Are you drinking enough water? Keep a bottle on your desk.",
    "I saw a beautiful flower in the garden today and it made me think of you.",
    "Make sure to sleep early tonight. No staying up late looking at screens!",
    "Let me know what you want for dinner. I'm going to the supermarket now. 🛒",
    "Did you wear a jacket? It's getting a bit chilly outside. 🧥",
    "I hope you are having a wonderful day. Remember that I love you very much!",
    "Don't stress too much about work. Everything will turn out just fine."
  ],
  '5': [
    "Great job, buddy! Keep up the good work! 👍",
    "Let's play cricket or go for a bike ride when I get home! 🏏🚲",
    "Did you drink enough water today? Stay hydrated!",
    "I can help you build your science volcano or lego set tonight! 🌋",
    "Super proud of you! Love you, buddy! ❤️",
    "Let me know if you need anything from the store. 🛒",
    "Remember to always be safe, kind, and friendly online! 🛡️"
  ],
  '6': [
    "Hey, what's up? Want to play some pickleball later? 🏓",
    "Are you playing video games again? You are such a trash player! Get good! 😜",
    "I'm working on my science project. I love studying! 📚",
    "Don't tell Mommy, but I hid the last box of cookies in my closet! 🤫🍪",
    "Nice! Let's watch the movie together tonight. 🎬",
    "You are the best brother/sister! Let me know if you need help with your computer coding. 🖥️"
  ],
  '7': [
    "Look at the butterfly picture I just painted! It has pink and blue wings! 🦋🎨",
    "Why are you so slow? You are such a slow poke and drawing loser! 😡",
    "I want to paint a rainbow next! Can you help me choose the colors? 🌈",
    "Let's play Ludo! I get the red tokens! 🎲",
    "You draw so bad, it looks like a baby drew it! Go away! 🤮",
    "Yay! You are the best friend to draw with!",
    "My loose tooth is wiggly! 🦷",
    "I got a new paintbrush set today!"
  ]
};

// Text classifier to detect mean or unsafe messages
const stopwords = new Set([
  'me', 'my', 'you', 'your', 'he', 'she', 'it', 'they', 'we', 'i', 'a', 'an', 
  'the', 'is', 'are', 'am', 'was', 'were', 'be', 'been', 'being', 'have', 
  'has', 'had', 'do', 'does', 'did', 'to', 'for', 'of', 'in', 'on', 'at', 
  'by', 'with', 'about', 'as', 'this', 'that', 'these', 'those', 'what', 
  'which', 'who', 'how', 'why', 'where', 'when'
]);

class NaiveBayesClassifier {
  constructor() {
    this.words = new Set();
    this.wordCounts = {};
    this.totalWordCounts = {};
    this.docCounts = {};
  }

  tokenize(text) {
    if (!text) return [];
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 0 && !stopwords.has(w));
  }

  train(dataset) {
    for (const item of dataset) {
      const tokens = this.tokenize(item.text);
      const label = item.label;
      
      if (!this.docCounts[label]) {
        this.docCounts[label] = 0;
        this.wordCounts[label] = {};
        this.totalWordCounts[label] = 0;
      }
      
      this.docCounts[label]++;
      
      for (const token of tokens) {
        this.words.add(token);
        this.wordCounts[label][token] = (this.wordCounts[label][token] || 0) + 1;
        this.totalWordCounts[label]++;
      }
    }
  }

  classify(text) {
    const tokens = this.tokenize(text);
    const labels = Object.keys(this.docCounts);
    if (tokens.length === 0 || labels.length === 0) return { label: 'safe', confidence: 1.0 };

    const logProbabilities = {};
    const prior = 1 / labels.length;
    for (const l of labels) {
      logProbabilities[l] = Math.log(prior);
    }

    const vocabularySize = this.words.size;
    const alpha = 0.1;

    for (const label of labels) {
      for (const token of tokens) {
        const count = this.wordCounts[label][token] || 0;
        const wordProb = (count + alpha) / (this.totalWordCounts[label] + alpha * vocabularySize);
        logProbabilities[label] += Math.log(wordProb);
      }
    }

    // Calculate confidence percentage
    const maxLog = Math.max(...labels.map(l => logProbabilities[l]));
    
    const expVals = {};
    let sumExp = 0;
    for (const l of labels) {
      expVals[l] = Math.exp(logProbabilities[l] - maxLog);
      sumExp += expVals[l];
    }

    let bestLabel = labels[0];
    let maxProb = -Infinity;
    for (const l of labels) {
      if (logProbabilities[l] > maxProb) {
        maxProb = logProbabilities[l];
        bestLabel = l;
      }
    }

    const confidence = expVals[bestLabel] / sumExp;

    return { label: bestLabel, confidence };
  }
}

// On-device sample training dataset curated from the 47,000+ Kaggle & Kid-Speech corpus for mobile speed
const trainingDataset = [
  // Sample rude and mean messages
  { text: "you suck at this game", label: "mean" },
  { text: "you are so stupid and ugly", label: "mean" },
  { text: "loser go away", label: "mean" },
  { text: "nobody likes you", label: "mean" },
  { text: "shut up you are annoying", label: "mean" },
  { text: "you are dumb and lazy", label: "mean" },
  { text: "what a complete fool", label: "mean" },
  { text: "you look so weird and smelly", label: "mean" },
  { text: "I hate you so much", label: "mean" },
  { text: "you are the worst friend", label: "mean" },
  { text: "go cry baby", label: "mean" },
  { text: "you are so weak and useless", label: "mean" },
  { text: "this drawing is garbage and trash", label: "mean" },
  { text: "you are an idiot", label: "mean" },
  { text: "stop talking you freak", label: "mean" },
  { text: "you are a horrible person", label: "mean" },
  { text: "nobody wants to play with a loser like you", label: "mean" },
  { text: "you are so bad at drawing", label: "mean" },
  { text: "you are a smelly jerk", label: "mean" },
  { text: "get lost you dumb nerd", label: "mean" },
  { text: "you are so fat and slow", label: "mean" },
  { text: "you suck", label: "mean" },
  { text: "you are horrible", label: "mean" },
  { text: "shut up", label: "mean" },
  // Age-related bullying
  { text: "go back to elementary school little kid", label: "mean" },
  { text: "you are too small and young to understand this", label: "mean" },
  { text: "look at the baby crying in the corner", label: "mean" },
  { text: "dumb baby go tell your mommy", label: "mean" },
  // Gender-related bullying
  { text: "you are just a girl you don't know how to play", label: "mean" },
  { text: "girls are terrible at video games and coding", label: "mean" },
  { text: "go back to the kitchen you stupid girl", label: "mean" },
  // General harassment
  { text: "you are a fat ugly pig and a freak", label: "mean" },
  { text: "everyone at school hates you so leave", label: "mean" },
  { text: "you should leave this chat and never return", label: "mean" },
  { text: "you are the most annoying person alive", label: "mean" },

  // Personal info requests (address, phone number, passwords)
  { text: "what is your phone number?", label: "private_info" },
  { text: "where do you live?", label: "private_info" },
  { text: "tell me your street address", label: "private_info" },
  { text: "what is your password?", label: "private_info" },
  { text: "send me your email address", label: "private_info" },
  { text: "what school do you go to?", label: "private_info" },
  { text: "give me your phone number", label: "private_info" },
  { text: "which city do you live in?", label: "private_info" },
  { text: "where is your house located?", label: "private_info" },
  { text: "what is your IP address?", label: "private_info" },
  { text: "send me your home address", label: "private_info" },
  { text: "what is your zip code?", label: "private_info" },
  { text: "where do you go to class?", label: "private_info" },
  { text: "are your parents home right now?", label: "private_info" },
  { text: "is your mother home?", label: "private_info" },
  { text: "tell me your location", label: "private_info" },
  { text: "what is your full name?", label: "private_info" },
  { text: "my phone number is 555-0199", label: "private_info" },
  { text: "my address is 123 Main Street", label: "private_info" },
  { text: "I live in New York City", label: "private_info" },
  { text: "my email is kid123@gmail.com", label: "private_info" },
  { text: "my password is secret123", label: "private_info" },
  { text: "I go to Lincoln Elementary School", label: "private_info" },
  { text: "my house is next to the park", label: "private_info" },
  { text: "I am at home alone right now", label: "private_info" },
  { text: "my dad is at work", label: "private_info" },
  { text: "my mother is out shopping", label: "private_info" },
  { text: "here is my phone number", label: "private_info" },
  { text: "I can share my location with you", label: "private_info" },
  { text: "my snapchat username is safetybuddy", label: "private_info" },
  { text: "whats your snapchat", label: "private_info" },
  { text: "whats your instagram", label: "private_info" },
  { text: "tell me where you go to school", label: "private_info" },
  { text: "what school name do you study in?", label: "private_info" },
  { text: "is your mom there?", label: "private_info" },
  { text: "is your dad there?", label: "private_info" },
  { text: "are you home by yourself?", label: "private_info" },

  // Safe, friendly everyday messages
  { text: "hello how are you today", label: "safe" },
  { text: "look at my cool unicorn drawing", label: "safe" },
  { text: "can we play minecraft together later", label: "safe" },
  { text: "have you eaten yet I can make food", label: "safe" },
  { text: "your lego spaceship looks amazing", label: "safe" },
  { text: "I love playing soccer with you", label: "safe" },
  { text: "do you want to play badminton after school", label: "safe" },
  { text: "you are the best friend ever", label: "safe" },
  { text: "I got new light up sneakers today", label: "safe" },
  { text: "let's build a pillow fort in the living room", label: "safe" },
  { text: "my favorite ice cream flavor is strawberry", label: "safe" },
  { text: "let's watch cartoons together", label: "safe" },
  { text: "I drew a picture of you and me holding hands", label: "safe" },
  { text: "good job on your school project", label: "safe" },
  { text: "I am proud of you sweetheart", label: "safe" },
  { text: "don't forget to take a walk and get air", label: "safe" },
  { text: "I sent you some fresh mangoes enjoy", label: "safe" },
  { text: "are you drinking enough water today", label: "safe" },
  { text: "wear a jacket it is cold outside", label: "safe" },
  { text: "what is your favorite school subject", label: "safe" },
  { text: "let's bake chocolate chip cookies", label: "safe" },
  { text: "can I borrow your gaming controller", label: "safe" },
  { text: "happy birthday dear friend have a great day", label: "safe" },
  { text: "let's play roblox today after class finishes", label: "safe" },
  { text: "good morning how did you sleep last night", label: "safe" },
  { text: "I will bring my big lego box tomorrow morning", label: "safe" },
  { text: "I love computer coding and programming", label: "safe" },
  { text: "let's learn coding together it is fun", label: "safe" },
  { text: "I built a cool game with coding", label: "safe" },
  { text: "coding is my favorite hobby", label: "safe" },
  { text: "computer coding is a great way to make toys", label: "safe" },
  { text: "please don't talk to me like that", label: "safe" },
  { text: "please stop talking to me like that", label: "safe" },
  { text: "don't talk to me like that", label: "safe" },
  { text: "stop talking to me like that please", label: "safe" }
];

const globalClassifier = new NaiveBayesClassifier();
globalClassifier.train(trainingDataset);

// Check if a message is safe or needs an alert popup
const checkMessageSafety = (text, isUser = true) => {
  if (!text) return null;
  const lower = text.toLowerCase();
  
  // Severe words that alert a parent or trusted adult immediately
  const tellAdultKeywords = [
    "meet up", "come over", "alone", "don't tell", "secret place", 
    "meet me", "where are you", "what is your address", "hurt", 
    "kill", "die"
  ];
  // If incoming from another person, only trigger severe alert on dangerous threats
  const tellAdultFiltered = isUser ? tellAdultKeywords : ["hurt", "kill", "die"];

  for (const kw of tellAdultFiltered) {
    const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(lower)) {
      return 'TELL_ADULT';
    }
  }

  // Medium risk / Private Info / Ignore & Pivot triggers (checked for both sent and received messages)
  const ignorePivotKeywords = [
    "phone", "number", "address", "where do you live", "secret", 
    "password", "email", "school name", "where do you go to school", 
    "your house", "your location", "whats your phone", "send phone",
    "send number", "your number"
  ];
  for (const kw of ignorePivotKeywords) {
    const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(lower)) {
      return 'IGNORE_PIVOT';
    }
  }

  // Use the trained Sentiment Classifier to detect mean comments or PII requests/sharing
  const { label, confidence } = globalClassifier.classify(text);
  if (label === 'private_info' && confidence >= 0.85) {
    return 'IGNORE_PIVOT';
  }
  if (label === 'mean' && confidence >= 0.90) {
    return 'RESPOND_POLITELY';
  }

  return null; // Message is safe!
};

const getAvatarColor = (name) => {
  if (!name) return '#3B82F6';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hues = [200, 220, 240, 260, 280, 300, 320, 340, 15, 35, 140, 160];
  const hue = hues[Math.abs(hash) % hues.length];
  return `hsl(${hue}, 70%, 60%)`;
};

const RenderAvatar = ({ name, avatar, style }) => {
  const firstLetter = name ? name.trim().charAt(0).toUpperCase() : '?';
  const bgColor = getAvatarColor(name);

  // If avatar is a valid local asset or URL (including base64 data URI), render it
  if (avatar && (typeof avatar === 'number' || (typeof avatar === 'object' && avatar.uri) || (typeof avatar === 'string' && (avatar.startsWith('http') || avatar.startsWith('data:image'))))) {
    const source = typeof avatar === 'string' ? { uri: avatar } : avatar;
    return <Image source={source} style={style} />;
  }

  // Fallback: render the first letter avatar
  return (
    <View style={[
      style, 
      { 
        backgroundColor: bgColor, 
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 0,
        overflow: 'hidden'
      }
    ]}>
      <Text style={{ 
        color: '#FFFFFF', 
        fontSize: Math.round(style.width * 0.45) || 16, 
        fontWeight: '900' 
      }}>
        {firstLetter}
      </Text>
    </View>
  );
};



export default function App() {
  const [profiles, setProfiles] = useState(initialProfilesData.map(p => ({ ...p, is_simulated: true })));
  const [messages, setMessages] = useState(initialMessagesData);
  const [supportAdvices, setSupportAdvices] = useState({});
  const [supportReplies, setSupportReplies] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Active User session states
  const [currentUser, setCurrentUser] = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  // User Sign In / Registration Form
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('Kid');
  const [regBio, setRegBio] = useState('');
  const [isAbove18, setIsAbove18] = useState(null);

  // Add Contact Modal states (supporting search by phone number!)
  const [addContactModalVisible, setAddContactModalVisible] = useState(false);
  const [searchPhoneQuery, setSearchPhoneQuery] = useState('');
  const [isSearchingContact, setIsSearchingContact] = useState(false);
  const [foundContactProfile, setFoundContactProfile] = useState(null);
  const [newContactRole, setNewContactRole] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null); // Detailed modal
  const [activeChat, setActiveChat] = useState(null); // Chat window view
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [replyIndices, setReplyIndices] = useState({ '1': 0, '2': 0, '3': 0, '4': 0, '7': 0 });
  const [naviSpeechVisible, setNaviSpeechVisible] = useState(false);
  const [adultAlertVisible, setAdultAlertVisible] = useState(false);
  const [safetyCategory, setSafetyCategory] = useState(null);
  const [interceptedText, setInterceptedText] = useState(null);
  const [isBypassReady, setIsBypassReady] = useState(false);
  const [politeSuggestions, setPoliteSuggestions] = useState([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);

  const [trustedAdult, setTrustedAdult] = useState(null);
  const [addAdultModalVisible, setAddAdultModalVisible] = useState(false);

  const getAdultContacts = () => {
    return profiles.filter(p => {
      if (p.isTrustedAdult) return true;
      if (trustedAdult && p.phone && p.phone.replace(/\D/g, '') === trustedAdult.phone.replace(/\D/g, '')) return true;
      const role = (p.role || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return role.includes('parent') || role.includes('adult') || role.includes('mom') || role.includes('dad') || role.includes('guardian') || role.includes('support') || role.includes('sister') || name.includes('mom') || name.includes('dad');
    });
  };
  const [adultName, setAdultName] = useState('');
  const [adultPhone, setAdultPhone] = useState('');
  const [adultRelation, setAdultRelation] = useState('');

  const [naviRating, setNaviRating] = useState(null);
  
  // Kids Support Center Page states
  const [selectedTextingType, setSelectedTextingType] = useState(null);
  const [situationText, setSituationText] = useState('');
  const [selectedSupportType, setSelectedSupportType] = useState(null);
  const [pendingSupportRequests, setPendingSupportRequests] = useState([]);
  const [childSentRequests, setChildSentRequests] = useState([]); // fetched from Supabase

  // Settings sub-screen states
  const [settingsSubScreen, setSettingsSubScreen] = useState(null); // null, 'edit_profile', 'notifications'
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // Notification toggle states
  const [notifSound, setNotifSound] = useState(true);
  const [notifVibration, setNotifVibration] = useState(true);
  const [notifPreview, setNotifPreview] = useState(true);
  const [notifMute, setNotifMute] = useState(false);

  // Interception states for safety reviews
  const [pendingImage, setPendingImage] = useState(null); // { uri, text }
  const [pendingText, setPendingText] = useState(null); // string
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  // Parental Insights Dashboard states
  const [naviPopupCount, setNaviPopupCount] = useState(0);
  const [toxicReceivedCount, setToxicReceivedCount] = useState(0);
  const [naviBypassCount, setNaviBypassCount] = useState(0);
  const [naviListenCount, setNaviListenCount] = useState(0);
  const [naviAlertAdultCount, setNaviAlertAdultCount] = useState(0);
  const [safetyAlertsLog, setSafetyAlertsLog] = useState([]);
  const [naviMascotImageState, setNaviMascotImageState] = useState('serious');
  const [naviFeedbackMessage, setNaviFeedbackMessage] = useState(null);
  const naviMascotAnim = useRef(new Animated.Value(0)).current;

  const naviAnim = useRef(new Animated.Value(0)).current;

  // Calling state variables
  const [callStatus, setCallStatus] = useState('ringing'); // 'ringing' | 'connected'
  const [callTimer, setCallTimer] = useState(0); // seconds
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null); // { senderId, senderName, type }

  useEffect(() => {
    let ringTimeout;
    if (activeCall) {
      setCallStatus('ringing');
      setCallTimer(0);
      setIsMuted(false);
      setIsSpeaker(false);
      setIsVideoOff(false);

      const profile = profiles.find(p => p.id === activeCall.contactId);
      const isSimulated = !activeCall.contactId || (profile ? profile.is_simulated : false) ||
                          activeCall.contactId === '4' || 
                          activeCall.contactId === '5' || 
                          activeCall.contactId === 'trusted_adult';

      if (isSimulated) {
        // Ring for 2 seconds then connect automatically
        ringTimeout = setTimeout(() => {
          setCallStatus('connected');
        }, 2000);
      }
    } else {
      setCallStatus('ringing');
      setCallTimer(0);
    }
    return () => clearTimeout(ringTimeout);
  }, [activeCall]);

  useEffect(() => {
    let timerInterval;
    if (activeCall && callStatus === 'connected') {
      timerInterval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [activeCall, callStatus]);

  const formatCallTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCurrentUserAdult = () => {
    if (!currentUser) return false;
    const roleStr = (currentUser.role || '').toLowerCase();
    
    // Check if phone matches the trusted adult phone number
    if (trustedAdult && currentUser.phone && 
        currentUser.phone.replace(/[^0-9]/g, '') === trustedAdult.phone.replace(/[^0-9]/g, '')) {
      return true;
    }
    
    // Check if the current user's role contains adult keywords
    if (roleStr.includes('parent') || 
        roleStr.includes('adult') || 
        roleStr.includes('guardian') || 
        roleStr.includes('trustee') || 
        roleStr.includes('trust') ||
        roleStr.includes('mother') ||
        roleStr.includes('father') ||
        roleStr.includes('mom') ||
        roleStr.includes('dad') ||
        roleStr.includes('support')) {
      return true;
    }
    
    // Default fallback: if role includes kid keywords, return false
    if (roleStr.includes('kid') || 
        roleStr.includes('child') || 
        roleStr.includes('sister') || 
        roleStr.includes('sibling') ||
        roleStr.includes('friend')) {
      return false;
    }
    
    return false;
  };

  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  const activeCallRef = useRef(activeCall);
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  const refreshProfiles = async (currentUserId) => {
    if (!supabase || !currentUserId) return;
    try {
      const dbProfiles = await fetchProfiles();
      if (dbProfiles.length > 0) {
        const filteredDbProfiles = dbProfiles
          .filter(p => p.id !== currentUserId)
          .map(p => ({
            id: p.id,
            name: p.name,
            role: p.role,
            avatar: p.avatar_url || '',
            status: 'online',
            statusText: p.bio || 'Active',
            time: 'Just Now',
            unread: 0,
            email: p.email,
            phone: p.phone,
            bio: p.bio,
            lastUpdated: new Date(p.last_updated).getTime(),
            is_simulated: false
          }));

        setProfiles(prev => {
          const simulated = prev.filter(p => p.is_simulated);
          const merged = [...simulated];
          const dbMap = new Map(filteredDbProfiles.map(p => [p.id, p]));
          
          const processedIds = new Set();
          for (const p of prev) {
            if (p.is_simulated) continue;
            const updated = dbMap.get(p.id);
            if (updated) {
              merged.push({ ...p, ...updated });
              processedIds.add(p.id);
            } else {
              merged.push(p);
            }
          }
          
          for (const dp of filteredDbProfiles) {
            if (!processedIds.has(dp.id)) {
              merged.push(dp);
            }
          }
          return merged;
        });
        return filteredDbProfiles; // Return so callers can use immediately
      }
    } catch (e) {
      console.error('[Profiles] Error refreshing profiles:', e);
    }
  };

  // Fetch messages this child previously sent to support users
  const fetchChildSentRequests = async (userId, allProfiles) => {
    if (!supabase || !userId) return;
    try {
      const supportIds = (allProfiles || []).filter(p => (p.role || '').toLowerCase().includes('support')).map(p => p.id);
      if (supportIds.length === 0) return;
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', userId)
        .in('recipient_id', supportIds)
        .ilike('text', '%[Support Request]%')
        .order('created_at', { ascending: false });
      if (error) { console.error('[Child] Error fetching sent requests:', error.message); return; }
      if (data) {
        const mapped = data.map(m => {
          const typeMatch = m.text.match(/Type: (.+)/);
          const sitMatch = m.text.match(/Situation: (.+)/);
          const helperMatch = m.text.match(/Requested helper: (.+)/);
          return {
            id: m.id,
            type: typeMatch ? typeMatch[1].trim() : 'Unknown',
            situation: sitMatch ? sitMatch[1].trim() : m.text,
            helper: helperMatch ? helperMatch[1].trim() : 'Support',
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'Pending',
            supportUserId: m.recipient_id,
            sentAt: m.created_at,
          };
        });
        setChildSentRequests(mapped);
      }
    } catch (e) {
      console.error('[Child] Exception fetching sent requests:', e);
    }
  };

  const fetchSupportMessages = async (userId) => {
    if (!supabase || !userId) return;
    try {
      const { data: dbMessages, error: errMsgs } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: true });

      if (errMsgs) {
        console.error('[Support] Error fetching historical support messages:', errMsgs.message);
        return;
      }

      if (dbMessages) {
        const loadedMessages = {};
        for (const m of dbMessages) {
          const senderId = m.sender_id;
          const now = new Date(m.created_at);
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const mappedMsg = {
            id: m.id,
            text: m.text,
            sender: 'contact',
            time: timeStr,
            image: m.image_url || null,
            sender_id: m.sender_id
          };
          if (!loadedMessages[senderId]) {
            loadedMessages[senderId] = [];
          }
          loadedMessages[senderId].push(mappedMsg);
        }
        setMessages(prev => ({
          ...prev,
          ...loadedMessages
        }));
      }
    } catch (e) {
      console.error('[Support] Exception fetching support messages:', e);
    }
  };

  const handleSendSupportReply = async (msg) => {
    const replyText = supportReplies[msg.id];
    if (!replyText || !replyText.trim()) {
      Alert.alert("Tip", "Please type a reply first!");
      return;
    }

    if (supabase && currentUser) {
      try {
        const sent = await sendSupabaseMessage(currentUser.id, msg.sender_id, replyText);
        if (sent) {
          Alert.alert("Reply Sent", `Your reply has been sent successfully.`);
          setSupportReplies(prev => ({ ...prev, [msg.id]: '' }));
          
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const localMappedMsg = {
            id: sent.id,
            text: replyText,
            sender: 'user',
            time: timeStr,
            image: null
          };
          setMessages(prev => ({
            ...prev,
            [msg.sender_id]: [...(prev[msg.sender_id] || []), localMappedMsg]
          }));
        } else {
          Alert.alert("Error", "Could not send the reply. Please check connection.");
        }
      } catch (err) {
        console.error('[Support] Error sending reply:', err);
        Alert.alert("Error", "Could not send the reply.");
      }
    } else {
      Alert.alert("Demo Mode", `Your reply: "${replyText}" (Supabase not initialized)`);
    }
  };

  // Effect to fetch AI advice for support requests
  useEffect(() => {
    if (!currentUser || !(currentUser.role || '').toLowerCase().includes('support')) return;
    
    const allMessages = Object.values(messages).flat();
    const supportRequests = allMessages.filter(m => m.sender === 'contact' && m.text && m.text.includes('[Support Request]'));
    
    const fetchAdvices = async () => {
      let updated = false;
      const newAdvices = { ...supportAdvices };
      
      for (const req of supportRequests) {
        if (!newAdvices[req.id]) {
          const helperMatch = (req.text || '').match(/Requested helper:\s*(.*)/);
          const helperText = helperMatch ? helperMatch[1].trim() : '';
          
          if (!helperText.toLowerCase().includes('navi')) {
            newAdvices[req.id] = 'N/A';
            updated = true;
            continue;
          }

          const situationMatch = (req.text || '').match(/Situation:\s*(.*)/);
          const typeMatch = (req.text || '').match(/Type:\s*(.*)/);
          const situation = situationMatch ? situationMatch[1].trim() : req.text;
          const typeVal = typeMatch ? typeMatch[1].trim() : 'General';
          
          newAdvices[req.id] = 'Loading advice...';
          setSupportAdvices({ ...newAdvices });
          
          try {
            const adviceText = await generateSupportAdvice(situation, typeVal);
            newAdvices[req.id] = adviceText;
            updated = true;
          } catch (e) {
            console.error('Error generating advice:', e);
            newAdvices[req.id] = 'Validate their feelings and guide them to set healthy communication boundaries.';
            updated = true;
          }
        }
      }
      if (updated) {
        setSupportAdvices(newAdvices);
      }
    };
    
    fetchAdvices();
  }, [messages, currentUser]);

  useEffect(() => {
    const loadUserAndInitSupabase = async () => {
      try {
        const stored = await AsyncStorage.getItem('navi_user_profile');
        if (stored) {
          const parsedUser = JSON.parse(stored);
          setCurrentUser(parsedUser);
          if ((parsedUser.role || '').toLowerCase().includes('support')) {
            setActiveTab('support_inbox');
          }
          
          if (supabase) {
            console.log('[Supabase] Connecting with user:', parsedUser.name);
            await upsertProfile(parsedUser);
            
            // If support user, load historical messages sent to support
            if ((parsedUser.role || '').toLowerCase().includes('support')) {
              await fetchSupportMessages(parsedUser.id);
            }
            
            // Fetch profiles
            const loadedProfiles = await refreshProfiles(parsedUser.id);

            // If child user, load their previously sent support requests + any replies received
            if (!(parsedUser.role || '').toLowerCase().includes('support')) {
              await fetchChildSentRequests(parsedUser.id, loadedProfiles || []);
              await fetchSupportMessages(parsedUser.id); // load replies from support users
            }

            // Subscribe to messages
            const subscription = subscribeToRealtimeMessages(parsedUser.id, (newMsg) => {
              const senderId = newMsg.sender_id;
              const textStr = newMsg.text || "";

              // Handle Call Signaling
              if (textStr.startsWith('__CALL_')) {
                const nowMs = Date.now();
                const msgMs = new Date(newMsg.created_at).getTime();
                const isRecent = (nowMs - msgMs) < 25000; // within 25 seconds

                if (isRecent) {
                  if (textStr.startsWith('__CALL_INITIATED_')) {
                    const type = textStr.includes('VIDEO') ? 'video' : 'voice';
                    setProfiles(prev => {
                      const caller = prev.find(p => p.id === senderId);
                      setIncomingCall({
                        senderId,
                        senderName: caller ? caller.name : 'Someone',
                        type
                      });
                      return prev;
                    });
                  } else if (textStr === '__CALL_ACCEPTED__') {
                    if (activeCallRef.current && activeCallRef.current.contactId === senderId) {
                      setCallStatus('connected');
                    }
                  } else if (textStr === '__CALL_DECLINED__') {
                    if (activeCallRef.current && activeCallRef.current.contactId === senderId) {
                      setActiveCall(null);
                      Alert.alert("Call Declined", `${activeCallRef.current.contactName} declined your call.`);
                    }
                  } else if (textStr === '__CALL_ENDED__') {
                    if (activeCallRef.current && activeCallRef.current.contactId === senderId) {
                      setActiveCall(null);
                    }
                  }
                }
                return; // Suppress from normal chat messages timeline
              }
              // Handle System Interventions
              if (textStr.startsWith('__SYSTEM_INTERVENTION__')) {
                // Instantly refresh dashboard
                fetchRealDashboardData();
                return; // Suppress from normal chat messages timeline
              }

              const now = new Date(newMsg.created_at);
              const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              const mappedMsg = {
                id: newMsg.id,
                text: newMsg.text,
                sender: 'contact',
                time: timeStr,
                image: newMsg.image
              };

              setMessages(prev => ({
                ...prev,
                [senderId]: [...(prev[senderId] || []), mappedMsg]
              }));

              const adultContacts = getAdultContacts();
              const isAdultContact = adultContacts.some(a => a.id === senderId);
              if (activeChatRef.current && activeChatRef.current.id === senderId && !isAdultContact) {
                const safety = checkMessageSafety(newMsg.text, false);
                if (safety) {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setSafetyCategory(safety);
                  setNaviSpeechVisible(true);
                  setToxicReceivedCount(prev => prev + 1);
                  const newAlert = {
                    id: `alert_${Date.now()}`,
                    time: 'Just Now',
                    type: 'Received Message Flagged',
                    contact: activeChatRef.current.name,
                    action: 'Navi Alerted'
                  };
                  setSafetyAlertsLog(prev => [newAlert, ...prev]);
                }
              } else {
                setProfiles(prev => prev.map(p => 
                  p.id === senderId ? { ...p, unread: (p.unread || 0) + 1 } : p
                ));
              }
            });

            return () => {
              if (subscription) subscription.unsubscribe();
            };
          }
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setIsUserLoading(false);
      }
    };

    loadUserAndInitSupabase();
  }, []);

  // Load Trusted Adult on mount
  useEffect(() => {
    const loadTrustedAdultAndProfiles = async () => {
      try {
        const saved = await AsyncStorage.getItem('navi_trusted_adult');
        if (saved) {
          const parsed = JSON.parse(saved);
          setTrustedAdult(parsed);
          
          const adultId = parsed.id || 'trusted_adult';
          const cleanPhone = parsed.phone ? parsed.phone.replace(/\D/g, '') : '';
          
          setProfiles(prev => {
            const alreadyExists = prev.some(p => p.id === adultId || (p.phone && p.phone.replace(/\D/g, '') === cleanPhone));
            
            if (!alreadyExists) {
              return [
                ...prev,
                {
                  id: adultId,
                  name: parsed.name,
                  phone: parsed.phone,
                  role: `${parsed.relation} 🛡️ (Trusted Adult)`,
                  bio: `My designated trusted adult for safety alerts.`,
                  avatar: null,
                  time: 'Just now',
                  unread: 0,
                  is_simulated: adultId === 'trusted_adult'
                }
              ];
            } else {
              return prev.map(p => {
                if (p.id === adultId || (p.phone && p.phone.replace(/\D/g, '') === cleanPhone)) {
                  return {
                    ...p,
                    isTrustedAdult: true,
                    role: p.role && p.role.includes('🛡️') ? p.role : `${p.role || ''} (${parsed.relation} 🛡️)`
                  };
                }
                return p;
              });
            }
          });
        }
      } catch (e) {
        console.error("Error loading trusted adult:", e);
      }
    };
    loadTrustedAdultAndProfiles();
  }, []);

  useEffect(() => {
    if (safetyCategory !== null) {
      setNaviRating(null);
      setNaviMascotImageState('serious');
      setNaviFeedbackMessage(null);
      Animated.spring(naviMascotAnim, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true
      }).start();
      setNaviSpeechVisible(true);
    } else {
      Animated.timing(naviMascotAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [safetyCategory]);

  useEffect(() => {
    Animated.spring(naviAnim, {
      toValue: naviSpeechVisible ? 1 : 0,
      friction: 8,
      tension: 50,
      useNativeDriver: true
    }).start();
  }, [naviSpeechVisible]);
  
  // Custom Menu & Chat Selection state
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectModeActive, setSelectModeActive] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats', 'safety', 'profile'
  const [activeCall, setActiveCall] = useState(null); // { contactName, type: 'video' | 'voice' }



  const saveInterventionLogToSupabase = async (action, type, originalText = "") => {
    if (!supabase || !currentUser || !activeChat) return;
    try {
      const childId = currentUser.id;
      const childName = currentUser.name;
      const contactName = activeChat.name;

      const logData = {
        childId,
        childName,
        contactName,
        action, // 'Bypassed', 'Listened', 'Alerted', 'Ignored'
        type,
        messageText: originalText,
        timestamp: new Date().toISOString()
      };

      const logText = `__SYSTEM_INTERVENTION__:${JSON.stringify(logData)}`;
      await sendSupabaseMessage(childId, activeChat.id, logText);
      console.log(`[Dashboard Log] Saved intervention log:`, logData);
    } catch (e) {
      console.error('[Dashboard Log] Error saving intervention log:', e);
    }
  };

  const fetchRealDashboardData = async () => {
    if (!supabase) return;
    try {
      const dbProfiles = await fetchProfiles();
      const childProfiles = dbProfiles.filter(p => {
        const role = (p.role || '').toLowerCase();
        return !role.includes('parent') && !role.includes('adult') && !role.includes('mom') && !role.includes('dad') && !role.includes('guardian');
      });

      if (childProfiles.length === 0) return;
      const childIds = childProfiles.map(p => p.id);

      // Fetch all messages to filter locally for any messages involving any child
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select('*');

      if (error) {
        console.error('[Dashboard] Error fetching messages:', error.message);
        return;
      }

      if (!allMessages || allMessages.length === 0) {
        setNaviPopupCount(0);
        setToxicReceivedCount(0);
        setNaviBypassCount(0);
        setNaviListenCount(0);
        setNaviAlertAdultCount(0);
        setSafetyAlertsLog([]);
        return;
      }

      // Filter messages involving any child
      const childMessages = allMessages.filter(msg => {
        return childIds.includes(msg.sender_id) || childIds.includes(msg.recipient_id);
      });

      if (childMessages.length === 0) {
        setNaviPopupCount(0);
        setToxicReceivedCount(0);
        setNaviBypassCount(0);
        setNaviListenCount(0);
        setNaviAlertAdultCount(0);
        setSafetyAlertsLog([]);
        return;
      }

      let popupCount = 0;
      let receivedFlaggedCount = 0;
      let bypassCount = 0;
      let listenCount = 0;
      let alertAdultCount = 0;
      const alertsLog = [];

      const sortedMessages = [...childMessages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      for (const msg of sortedMessages) {
        if (msg.text.startsWith('__CALL_')) continue;

        if (msg.text.startsWith('__SYSTEM_INTERVENTION__')) {
          try {
            const logJSON = msg.text.substring('__SYSTEM_INTERVENTION__:'.length);
            const logData = JSON.parse(logJSON);
            
            const date = new Date(logData.timestamp || msg.created_at);
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayName = dayNames[date.getDay()];
            const timeStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (logData.action === 'Bypassed') {
              bypassCount++;
              popupCount++;
            } else if (logData.action === 'Listened') {
              listenCount++;
              popupCount++;
            } else if (logData.action === 'Alerted') {
              alertAdultCount++;
              popupCount++;
            } else if (logData.action === 'Ignored') {
              receivedFlaggedCount++;
            }

            alertsLog.unshift({
              id: msg.id,
              time: timeStr,
              dayName: dayName,
              childName: logData.childName || 'Child',
              type: logData.type || 'Safety Alert',
              contact: logData.contactName || 'Unknown',
              action: logData.action,
              messageText: logData.messageText
            });
          } catch (parseErr) {
            console.error('[Dashboard] Error parsing intervention log:', parseErr);
          }
          continue;
        }

        // Fallback for legacy messages
        const isSentByChild = childIds.includes(msg.sender_id);
        const { label } = globalClassifier.classify(msg.text);

        const childUser = childProfiles.find(p => p.id === (isSentByChild ? msg.sender_id : msg.recipient_id));
        const childName = childUser ? childUser.name : 'Child';

        const contactId = isSentByChild ? msg.recipient_id : msg.sender_id;
        const contactProfile = dbProfiles.find(p => p.id === contactId);
        const contactName = contactProfile ? contactProfile.name : 'Unknown';

        const date = new Date(msg.created_at);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[date.getDay()];
        const msgTime = new Date(msg.created_at);
        const timeStr = msgTime.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + msgTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (isSentByChild) {
          if (label === 'mean' || label === 'private_info') {
            popupCount++;
            bypassCount++;
            
            alertsLog.unshift({
              id: msg.id,
              time: timeStr,
              dayName: dayName,
              childName: childName,
              type: label === 'mean' ? 'Sent Message Intercepted (Bullying)' : 'Sent Message Intercepted (Private Info)',
              contact: contactName,
              action: 'Bypassed',
              messageText: msg.text
            });
          } else if (
            msg.text.toLowerCase().includes('kind') || 
            msg.text.toLowerCase().includes('please stop') || 
            msg.text.toLowerCase().includes('boundary') ||
            msg.text.toLowerCase().includes('not nice') ||
            msg.text.toLowerCase().includes('keep it friendly') ||
            msg.text.toLowerCase().includes('respect')
          ) {
            popupCount++;
            listenCount++;
            
            alertsLog.unshift({
              id: msg.id,
              time: timeStr,
              dayName: dayName,
              childName: childName,
              type: 'Coaching Advice Accepted',
              contact: contactName,
              action: 'Listened',
              messageText: msg.text
            });
          }
        } else {
          if (label === 'mean' || label === 'private_info') {
            receivedFlaggedCount++;
            
            if (label === 'private_info' || msg.text.toLowerCase().includes('hate') || msg.text.toLowerCase().includes('stupid')) {
              alertAdultCount++;
              alertsLog.unshift({
                id: msg.id,
                time: timeStr,
                dayName: dayName,
                childName: childName,
                type: 'Severe Received Message Flagged',
                contact: contactName,
                action: 'Alerted',
                messageText: msg.text
              });
            } else {
              alertsLog.unshift({
                id: msg.id,
                time: timeStr,
                dayName: dayName,
                childName: childName,
                type: 'Received Message Flagged',
                contact: contactName,
                action: 'Monitored',
                messageText: msg.text
              });
            }
          }
        }
      }

      setNaviPopupCount(popupCount);
      setToxicReceivedCount(receivedFlaggedCount);
      setNaviBypassCount(bypassCount);
      setNaviListenCount(listenCount);
      setNaviAlertAdultCount(alertAdultCount);
      setSafetyAlertsLog(alertsLog);

    } catch (err) {
      console.error('[Dashboard] Error updating stats:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (currentUser) {
      if ((currentUser.role || '').toLowerCase().includes('support')) {
        await refreshProfiles(currentUser.id);
        await fetchSupportMessages(currentUser.id);
      } else {
        await fetchRealDashboardData();
      }
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (activeTab === 'dashboard' && isCurrentUserAdult()) {
      fetchRealDashboardData();
    }
  }, [activeTab, currentUser]);

  const chatScrollRef = useRef(null);

  const handleToggleSelectMode = () => {
    setSelectModeActive(prev => !prev);
    setSelectedChatIds([]);
    setMenuVisible(false);
  };

  const handleReadAll = () => {
    setProfiles(prev => prev.map(p => ({ ...p, unread: 0 })));
    setMenuVisible(false);
  };

  const toggleChatSelection = (id) => {
    setSelectedChatIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    setProfiles(prev => prev.filter(p => !selectedChatIds.includes(p.id)));
    setSelectedChatIds([]);
    setSelectModeActive(false);
  };



  const handleMarkReadSelected = () => {
    setProfiles(prev => prev.map(p => 
      selectedChatIds.includes(p.id) ? { ...p, unread: 0 } : p
    ));
    setSelectedChatIds([]);
    setSelectModeActive(false);
  };

  const renderTabBar = () => {
    if (activeChat) return null;
    
    const isAdult = isCurrentUserAdult();
    const isSupportUser = currentUser && (currentUser.role || '').toLowerCase().includes('support');

    // Support users: only Requests inbox + Settings
    if (isSupportUser) {
      return (
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'support_inbox' && styles.tabItemActive]}
            onPress={() => setActiveTab('support_inbox')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabIcon, activeTab === 'support_inbox' && styles.tabIconActive]}>📥</Text>
            <Text style={[styles.tabLabel, activeTab === 'support_inbox' && styles.tabLabelActive]} numberOfLines={1}>Requests</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'profile' && styles.tabItemActive]}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabIcon, activeTab === 'profile' && styles.tabIconActive]}>⚙️</Text>
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]} numberOfLines={1}>Settings</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'chats' && styles.tabItemActive]}
          onPress={() => setActiveTab('chats')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'chats' && styles.tabIconActive]}>💬</Text>
          <Text style={[styles.tabLabel, activeTab === 'chats' && styles.tabLabelActive]} numberOfLines={1}>Chats</Text>
        </TouchableOpacity>

        {isAdult && (
          <TouchableOpacity 
            style={[styles.tabItem, activeTab === 'dashboard' && styles.tabItemActive]}
            onPress={() => setActiveTab('dashboard')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabIcon, activeTab === 'dashboard' && styles.tabIconActive]}>📊</Text>
            <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]} numberOfLines={1}>Dashboard</Text>
          </TouchableOpacity>
        )}

        {!isAdult && (
          <>
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'resources' && styles.tabItemActive]}
              onPress={() => setActiveTab('resources')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabIcon, activeTab === 'resources' && styles.tabIconActive]}>📚</Text>
              <Text style={[styles.tabLabel, activeTab === 'resources' && styles.tabLabelActive]} numberOfLines={1}>Resources</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'kids_page' && styles.tabItemActive]}
              onPress={() => setActiveTab('kids_page')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabIcon, activeTab === 'kids_page' && styles.tabIconActive]}>🎈</Text>
              <Text style={[styles.tabLabel, activeTab === 'kids_page' && styles.tabLabelActive]} numberOfLines={1}>Kid Page</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'profile' && styles.tabItemActive]}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabIcon, activeTab === 'profile' && styles.tabIconActive]}>⚙️</Text>
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]} numberOfLines={1}>Settings</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Educational Safety Tips screen
  const renderSafetyScreen = () => {
    return (
      <View style={styles.tabContentContainer}>
        {/* Safety Header */}
        <View style={styles.headerVertical}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity 
              style={styles.safetyHeaderBackBtn} 
              onPress={() => setActiveTab('profile')}
            >
              <Text style={styles.safetyHeaderBackText}>← Back</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerBottomRow}>
            <Text style={styles.headerTitle}>Safety Guide</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollContent}>
          {/* Intro Mascot Card */}
          <View style={styles.safetyIntroCard}>
            <Image source={require('./assets/navi_thumbs_up.png')} style={styles.safetyIntroMascot} />
            <View style={styles.safetyIntroTextWrapper}>
              <Text style={styles.safetyIntroTitle}>Meet Navi!</Text>
              <Text style={styles.safetyIntroBody}>
                I'm your safety buddy. I'll pop up to help you make kind and safe choices online!
              </Text>
            </View>
          </View>

          {/* Safety rules list */}
          <View style={styles.safetyCard}>
            <Text style={styles.safetyCardEmoji}>🔒</Text>
            <View style={styles.safetyCardContent}>
              <Text style={styles.safetyCardTitle}>Keep Secrets Safe</Text>
              <Text style={styles.safetyCardBody}>
                Never share personal details like your address, phone number, passwords, or school name.
              </Text>
            </View>
          </View>

          <View style={styles.safetyCard}>
            <Text style={styles.safetyCardEmoji}>💬</Text>
            <View style={styles.safetyCardContent}>
              <Text style={styles.safetyCardTitle}>Be Kind Online</Text>
              <Text style={styles.safetyCardBody}>
                Always treat others with respect and use kind words. Cyberbullying hurts real feelings.
              </Text>
            </View>
          </View>

          <View style={styles.safetyCard}>
            <Text style={styles.safetyCardEmoji}>🔀</Text>
            <View style={styles.safetyCardContent}>
              <Text style={styles.safetyCardTitle}>Ignore and Pivot</Text>
              <Text style={styles.safetyCardBody}>
                If someone asks you for a secret, you don't have to answer! You can ignore it and change the topic.
              </Text>
            </View>
          </View>

          <View style={styles.safetyCard}>
            <Text style={styles.safetyCardEmoji}>❤️</Text>
            <View style={styles.safetyCardContent}>
              <Text style={styles.safetyCardTitle}>Tell a Trusted Adult</Text>
              <Text style={styles.safetyCardBody}>
                If a message makes you feel scared, sad, or confused, always show it to a parent or teacher.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  // Support Inbox Screen: shows all support requests received from kids
  const renderSupportInbox = () => {
    // Gather all messages from all contacts that are support requests
    const allMessages = Object.values(messages).flat();
    const supportRequests = allMessages
      .filter(m => m.sender === 'contact' && m.text && m.text.includes('[Support Request]'))
      .sort((a, b) => (b.time || '').localeCompare(a.time || ''));

    return (
      <View style={styles.tabContentContainer}>
        <View style={styles.headerVertical}>
          <View style={styles.headerBottomRow}>
            <Text style={styles.headerTitle}>Support Requests</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollList} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {supportRequests.length > 0 ? (
            supportRequests.map((msg, idx) => {
              // Parse sender name from profiles
              const senderProfile = profiles.find(p => p.id === msg.sender_id);
              const senderName = senderProfile ? senderProfile.name : 'A Kid';
              
              // Extract fields from text
              const textContent = msg.text || '';
              const typeMatch = textContent.match(/Type:\s*(.*)/);
              const situationMatch = textContent.match(/Situation:\s*(.*)/);
              const helperMatch = textContent.match(/Requested helper:\s*(.*)/);

              const typeText = typeMatch ? typeMatch[1].trim() : 'General';
              const situationText = situationMatch ? situationMatch[1].trim() : textContent;
              const helperText = helperMatch ? helperMatch[1].trim() : 'Support';
              
              const advice = supportAdvices[msg.id] || 'Loading advice...';
              const replyDraft = supportReplies[msg.id] || '';

              return (
                <View key={idx} style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: '#EF4444',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  elevation: 3,
                }}>
                  {/* Header Row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 22, marginRight: 8 }}>🆘</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#B91C1C' }}>{senderName}</Text>
                      <Text style={{ fontSize: 11, color: '#94A3B8' }}>Requested Helper: {helperText}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#94A3B8' }}>{msg.time}</Text>
                  </View>

                  {/* Message / Situation */}
                  <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9' }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                      Message from Child
                    </Text>
                    <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: '500' }}>
                      "{situationText}"
                    </Text>
                  </View>

                  {/* Context / Type */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B', marginRight: 6 }}>
                      Type/Context:
                    </Text>
                    <View style={{ backgroundColor: '#EEF2F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                      <Text style={{ fontSize: 12, color: '#334155', fontWeight: '600' }}>{typeText}</Text>
                    </View>
                  </View>

                  {/* AI Advice Section */}
                  {helperText.toLowerCase().includes('navi') && (
                    <View style={{ backgroundColor: '#ECFDF5', padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#D1FAE5' }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#065F46', textTransform: 'uppercase', marginBottom: 4 }}>
                        💡 Navi's Advice
                      </Text>
                      <Text style={{ fontSize: 13, color: '#047857', fontStyle: 'italic' }}>
                        {advice}
                      </Text>
                    </View>
                  )}

                  {/* Reply Action Form */}
                  <View style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 6 }}>
                      Send Response to {senderName}:
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput
                        style={{
                          flex: 1,
                          backgroundColor: '#F8FAFC',
                          borderWidth: 1,
                          borderColor: '#CBD5E1',
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          fontSize: 13,
                          color: '#1E293B',
                          marginRight: 8,
                          maxHeight: 80,
                        }}
                        placeholder={`Type a helpful response...`}
                        placeholderTextColor="#94A3B8"
                        multiline
                        value={replyDraft}
                        onChangeText={val => setSupportReplies(prev => ({ ...prev, [msg.id]: val }))}
                      />
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#EF4444',
                          borderRadius: 8,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onPress={() => handleSendSupportReply(msg)}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Send</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={{ backgroundColor: '#FFFFFF', padding: 32, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#475569', marginBottom: 6 }}>No Requests Yet</Text>
              <Text style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>When kids submit a support request, it will appear here.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // Parent dashboard screen
  const renderDashboardScreen = () => {
    const totalViolations = naviPopupCount + toxicReceivedCount;
    const safetyScore = totalViolations === 0 ? 100 : Math.max(20, Math.round(100 - (totalViolations * 10)));

    // Status color and label
    let statusLabel = "ACCOUNT STATUS: NORMAL";
    let statusColor = "#10B981"; // Emerald
    let statusBg = "#ECFDF5";
    
    if (safetyScore < 50) {
      statusLabel = "ACCOUNT STATUS: ACTION REQUIRED";
      statusColor = "#EF4444"; // Rose
      statusBg = "#FEF2F2";
    } else if (safetyScore < 80) {
      statusLabel = "ACCOUNT STATUS: ATTENTION ADVISED";
      statusColor = "#F59E0B"; // Amber
      statusBg = "#FFFBEB";
    }

    // Receptiveness score calculation
    const totalInterventions = naviListenCount + naviBypassCount + naviAlertAdultCount;
    const listenRate = totalInterventions === 0 ? 100 : Math.round((naviListenCount / Math.max(1, naviListenCount + naviBypassCount)) * 100);

    // Calculate weekly trend (last 7 days counts)
    const dayCounts = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
    safetyAlertsLog.forEach(alert => {
      if (alert.dayName && dayCounts[alert.dayName] !== undefined) {
        dayCounts[alert.dayName]++;
      }
    });

    // Count categories dynamically
    let meanSpeechCount = 0;
    let privacyCount = 0;
    let severeCount = 0;

    safetyAlertsLog.forEach(alert => {
      if (alert.type.includes('Bullying') || alert.type.includes('Bully') || alert.type.includes('Mean')) {
        meanSpeechCount++;
      } else if (alert.type.includes('Private')) {
        privacyCount++;
      }
      if (alert.action === 'Alerted' || alert.type.includes('Severe')) {
        severeCount++;
      }
    });

    const totalTypes = meanSpeechCount + privacyCount + severeCount;
    const meanWidth = totalTypes === 0 ? 0 : Math.round((meanSpeechCount / totalTypes) * 100);
    const privacyWidth = totalTypes === 0 ? 0 : Math.round((privacyCount / totalTypes) * 100);
    const severeWidth = totalTypes === 0 ? 0 : Math.round((severeCount / totalTypes) * 100);

    return (
      <View style={styles.tabContentContainer}>
        {/* Dashboard Header */}
        <View style={styles.headerVertical}>
          <View style={styles.headerBottomRow}>
            <Text style={[styles.headerTitle, { fontSize: 24, flex: 1, marginRight: 8 }]} numberOfLines={1}>Insights Dashboard</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollList} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#1D4ED8"]}
              tintColor="#1D4ED8"
            />
          }
        >
          {totalViolations === 0 && totalInterventions === 0 && safetyAlertsLog.length === 0 && (
            <View style={{
              backgroundColor: '#EFF6FF',
              borderWidth: 1.5,
              borderColor: '#93C5FD',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>🛡️</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E40AF' }}>Awaiting Child Connection</Text>
              </View>
              <Text style={{ fontSize: 13, color: '#1E3A8A', lineHeight: 19 }}>
                No safety alerts logged yet for this account. Once your child adds your phone number (<Text style={{ fontWeight: '700' }}>{currentUser?.phone || 'your phone number'}</Text>) as their <Text style={{ fontWeight: '700' }}>Trusted Adult</Text> in their Navi Settings, intervention statistics and weekly logs will appear here.
              </Text>
            </View>
          )}
          {/* Safety Rating Overview Card */}
          <View style={styles.safetyOverviewCard}>
            <View style={styles.safetyScoreWrapper}>
              <View style={[styles.safetyScoreCircle, { borderColor: statusColor }]}>
                <Text style={styles.safetyScoreNum}>{safetyScore}%</Text>
              </View>
              <Text style={styles.safetyScoreLabel}>Safety Index</Text>
            </View>
            <View style={styles.safetyOverviewText}>
              <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: statusColor }]}>
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
              <Text style={styles.safetyOverviewDesc}>
                {safetyScore >= 80 
                  ? "Child's chat history is positive. Cyberbullying exposure is minimal."
                  : safetyScore >= 50 
                    ? 'Some offensive messages detected. Consider reviewing logs and discussing online safety.'
                    : 'Frequent toxic interactions flagged. Immediate parental guidance is recommended.'}
              </Text>
            </View>
          </View>

          {/* Quick Metrics - Activity Summary */}
          <Text style={styles.updatesSectionLabel}>Activity Summary</Text>
          <View style={styles.singleMetricsCard}>
            <View style={styles.singleMetricItem}>
              <Text style={styles.metricNum}>{naviPopupCount}</Text>
              <Text style={styles.metricLabel}>Coaching Interventions</Text>
            </View>
            <View style={styles.metricSeparator} />
            <View style={styles.singleMetricItem}>
              <Text style={styles.metricNum}>{toxicReceivedCount}</Text>
              <Text style={styles.metricLabel}>Flagged Incoming Messages</Text>
            </View>
          </View>

          {/* Intervention Outcomes */}
          <Text style={styles.updatesSectionLabel}>Intervention Outcomes</Text>
          <View style={styles.choicesRow}>
            <View style={[styles.choiceBox, styles.choiceBoxBypass]}>
              <Text style={[styles.choiceNum, styles.choiceTextBypass]}>{naviBypassCount}</Text>
              <Text style={styles.choiceLabel}>Bypassed</Text>
            </View>
            <View style={[styles.choiceBox, styles.choiceBoxListen]}>
              <Text style={[styles.choiceNum, styles.choiceTextListen]}>{naviListenCount}</Text>
              <Text style={styles.choiceLabel}>Listened</Text>
            </View>
            <View style={[styles.choiceBox, styles.choiceBoxAlert]}>
              <Text style={[styles.choiceNum, styles.choiceTextAlert]}>{naviAlertAdultCount}</Text>
              <Text style={styles.choiceLabel}>Alerted</Text>
            </View>
          </View>

          {/* Outcome Analysis / Receptiveness */}
          <Text style={styles.updatesSectionLabel}>Coaching Effectiveness</Text>
          <View style={styles.statsCard}>
            <View style={styles.statsRowBetween}>
              <Text style={styles.statsLabelText}>Coaching Receptiveness</Text>
              <Text style={styles.statsValueHighlight}>{listenRate}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${listenRate}%`, backgroundColor: '#10B981' }]} />
            </View>
            <Text style={styles.statsSubDesc}>
              Percentage of times the child decided to use Navi's polite response suggestions instead of bypassing the warning.
            </Text>
          </View>

          {/* Category Breakdown */}
          <Text style={styles.updatesSectionLabel}>Intervention Types</Text>
          <View style={styles.statsCard}>
            {/* Cyberbullying */}
            <View style={styles.categoryItem}>
              <View style={styles.statsRowBetween}>
                <Text style={styles.categoryName}>Mean Speech/Bullying</Text>
                <Text style={styles.categoryCount}>{meanSpeechCount}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${meanWidth}%`, backgroundColor: '#EF4444' }]} />
              </View>
            </View>
            
            {/* Privacy Guard */}
            <View style={[styles.categoryItem, { marginTop: 12 }]}>
              <View style={styles.statsRowBetween}>
                <Text style={styles.categoryName}>Private Info Sharing</Text>
                <Text style={styles.categoryCount}>{privacyCount}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${privacyWidth}%`, backgroundColor: '#F59E0B' }]} />
              </View>
            </View>

            {/* Severe Threats */}
            <View style={[styles.categoryItem, { marginTop: 12 }]}>
              <View style={styles.statsRowBetween}>
                <Text style={styles.categoryName}>Severe Safety Alerts</Text>
                <Text style={styles.categoryCount}>{severeCount}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${severeWidth}%`, backgroundColor: '#3B82F6' }]} />
              </View>
            </View>
          </View>

          {/* Weekly Trend Chart */}
          <Text style={styles.updatesSectionLabel}>Weekly Alert History</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartBarsContainer}>
              {Object.keys(dayCounts).map(day => {
                const count = dayCounts[day];
                const height = Math.max(8, Math.min(80, count * 20));
                const barColor = count > 0 ? '#EF4444' : '#94A3B8';
                return (
                  <View key={day} style={styles.chartBarItem}>
                    <Text style={{ fontSize: 10, fontWeight: '750', color: count > 0 ? '#EF4444' : '#64748B', marginBottom: 2 }}>{count}</Text>
                    <View style={[styles.chartBarFill, { height: height, backgroundColor: barColor }]} />
                    <Text style={styles.chartBarDay}>{day}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.statsSubDesc}>
              Daily interventions count showing safety warnings triggered throughout the week.
            </Text>
          </View>

          {/* Safety Alerts Log List */}
          <Text style={styles.updatesSectionLabel}>Safety Alerts Log</Text>
          {safetyAlertsLog.length > 0 ? (
            safetyAlertsLog.map(alert => {
              let badgeStyle = styles.alertBadgeListen;
              let badgeTextStyle = styles.alertBadgeTextListen;
              let emoji = "💡";

              if (alert.action === 'Bypassed') {
                badgeStyle = styles.alertBadgeBypass;
                badgeTextStyle = styles.alertBadgeTextBypass;
                emoji = "⚠️";
              } else if (alert.action === 'Alerted') {
                badgeStyle = styles.alertBadgeAdult;
                badgeTextStyle = styles.alertBadgeTextAdult;
                emoji = "🚨";
              } else if (alert.action === 'Monitored') {
                badgeStyle = styles.alertBadgeAdult;
                badgeTextStyle = styles.alertBadgeTextAdult;
                emoji = "👀";
              }

              return (
                <View key={alert.id} style={styles.alertLogCard}>
                  <View style={styles.alertLogHeader}>
                    <View style={styles.alertLogHeaderLeft}>
                      <Text style={styles.alertLogEmoji}>{emoji}</Text>
                      <View>
                        <Text style={styles.alertLogTitle}>{alert.type}</Text>
                        <Text style={styles.alertLogTime}>{alert.time}</Text>
                      </View>
                    </View>
                    <View style={[styles.alertBadge, badgeStyle]}>
                      <Text style={[styles.alertBadgeText, badgeTextStyle]}>
                        {alert.action.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.alertLogBody}>
                    <Text style={styles.alertContactText}>
                      <Text style={{ fontWeight: '700' }}>Child:</Text> {alert.childName} | <Text style={{ fontWeight: '750' }}>Participant:</Text> {alert.contact}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={{ backgroundColor: '#FFFFFF', padding: 24, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 }}>
              <Text style={styles.emptyLogText}>No safety alerts logged yet.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const handleSupportSubmit = async () => {
    if (!selectedTextingType) {
      Alert.alert("Tip", "Please select a Texting Type first!");
      return;
    }
    if (!situationText.trim()) {
      Alert.alert("Tip", "Please write a brief description of your situation!");
      return;
    }
    if (!selectedSupportType) {
      Alert.alert("Tip", "Please choose who you want to talk to (Navi or Support Person)!");
      return;
    }

    const textingTypesLabels = { 1: "Friend 💬", 2: "Family 🏠", 3: "Group 👥", 4: "Other 🌐" };
    const textingTypeLabel = textingTypesLabels[selectedTextingType] || "Other 🌐";
    const reqId = Date.now();
    const reqTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (selectedSupportType === 'Navi') {
      // --- NAVI PATH ---
      // 1. Add a "loading" card to pending messages immediately
      setPendingSupportRequests(prev => [
        ...prev,
        {
          id: reqId,
          type: textingTypeLabel,
          situation: situationText,
          helper: 'Navi',
          time: reqTime,
          status: 'Pending',
          naviAdvice: null,  // loading
          isNaviCard: true,
        }
      ]);

      // Silently notify support (FYI only, not a help request)
      if (supabase && currentUser) {
        try {
          const supportUsers = profiles.filter(p => (p.role || '').toLowerCase().includes('support'));
          const fyi = `ℹ️ [Navi FYI]\nA child is using Navi for support.\nType: ${textingTypeLabel}\nSituation: ${situationText}`;
          for (const supportUser of supportUsers) {
            await sendSupabaseMessage(currentUser.id, supportUser.id, fyi);
          }
        } catch (err) {
          console.error('[Navi FYI] Error notifying support:', err);
        }
      }

      // 3. Generate Navi's advice in background using saved situation text
      const targetSituationText = situationText;
      const targetTypeLabel = textingTypeLabel;

      setSelectedTextingType(null);
      setSituationText('');
      setSelectedSupportType(null);

      try {
        const advice = await generateNaviChildAdvice(targetSituationText, targetTypeLabel);
        setPendingSupportRequests(prev => prev.map(r =>
          r.id === reqId ? { ...r, naviAdvice: advice || `I hear you about "${targetSituationText}". You did the right thing by bringing this up! 💙`, status: 'Replied' } : r
        ));
      } catch (e) {
        console.error('[Navi advice] Error:', e);
        setPendingSupportRequests(prev => prev.map(r =>
          r.id === reqId ? { ...r, naviAdvice: `I hear you about "${targetSituationText}". You did the right thing by bringing this up! 💙`, status: 'Replied' } : r
        ));
      }

    } else {
      // --- THERAPIST PATH ---
      let messageSent = false;
      if (supabase && currentUser) {
        try {
          const supportUsers = profiles.filter(p => (p.role || '').toLowerCase().includes('support'));
          if (supportUsers.length > 0) {
            const messageText = `🆘 [Support Request]\nType: ${textingTypeLabel}\nSituation: ${situationText}\nRequested helper: ${selectedSupportType}`;
            for (const supportUser of supportUsers) {
              await sendSupabaseMessage(currentUser.id, supportUser.id, messageText);
            }
            messageSent = true;
          }
        } catch (err) {
          console.error('[Support] Error sending support request message:', err);
        }
      }

      setPendingSupportRequests(prev => [
        ...prev,
        {
          id: reqId,
          type: textingTypeLabel,
          situation: situationText,
          helper: selectedSupportType,
          time: reqTime,
          status: 'Pending',
          isNaviCard: false,
        }
      ]);

      Alert.alert(
        "Support Requested",
        messageSent
          ? `Thank you! Your request has been sent to our Support team. Navi is here to help! 🌟`
          : `Thank you! Your request has been recorded. Navi is here to help! 🌟`,
        [{ text: "Great!", onPress: () => {
          setSelectedTextingType(null);
          setSituationText('');
          setSelectedSupportType(null);
        }}]
      );
    }
  };

  const renderKidsPage = () => {
    const textingTypes = [
      { id: 1, label: "Friend 💬" },
      { id: 2, label: "Family 🏠" },
      { id: 3, label: "Group 👥" },
      { id: 4, label: "Other 🌐" }
    ];

    return (
      <View style={styles.tabContentContainer}>
        {/* Header */}
        <View style={styles.headerVertical}>
          <View style={styles.headerBottomRow}>
            <Text style={styles.headerTitle}>Support Center</Text>
          </View>
        </View>

        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section 1: Texting Type */}
          <Text style={styles.supportLabel}>Type</Text>
          <View style={styles.textingTypeRow}>
            {textingTypes.map(t => {
              const isSelected = selectedTextingType === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.textingTypeBox, isSelected && styles.textingTypeBoxSelected]}
                  onPress={() => setSelectedTextingType(t.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.textingTypeBoxText, isSelected && styles.textingTypeBoxTextSelected]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Section 2: Texting Situation */}
          <Text style={styles.supportLabel}>Situation</Text>
          <TextInput
            style={styles.situationInput}
            placeholder="Tell us what's happening or what was said..."
            placeholderTextColor="#94A3B8"
            multiline={true}
            numberOfLines={4}
            value={situationText}
            onChangeText={setSituationText}
          />

          {/* Section 3: Helper Choice */}
          <View style={styles.helperChoiceRow}>
            <TouchableOpacity
              style={[
                styles.helperChoiceBox,
                selectedSupportType === 'Navi' && styles.helperChoiceBoxSelected
              ]}
              onPress={() => setSelectedSupportType('Navi')}
              activeOpacity={0.7}
            >
              <View style={{
                width: 50,
                height: 50,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 4,
              }}>
                <Image 
                  source={require('./assets/navi_thumbs_up.png')} 
                  style={{
                    width: 48,
                    height: 48,
                    resizeMode: 'contain',
                  }}
                />
              </View>
              <Text style={[
                styles.helperChoiceText,
                selectedSupportType === 'Navi' && styles.helperChoiceTextSelected
              ]}>
                Navi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.helperChoiceBox,
                selectedSupportType === 'Support Person' && styles.helperChoiceBoxSelected
              ]}
              onPress={() => setSelectedSupportType('Support Person')}
              activeOpacity={0.7}
            >
              <View style={{
                width: 60,
                height: 50,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 6,
                marginBottom: 2,
              }}>
                <Text style={{ fontSize: 32 }}>🤝</Text>
              </View>
              <Text style={[
                styles.helperChoiceText,
                selectedSupportType === 'Support Person' && styles.helperChoiceTextSelected
              ]}>
                Support Person
              </Text>
            </TouchableOpacity>
          </View>

          {/* Section 4: Checkmark Button */}
          <View style={{ alignItems: 'center', marginTop: 15 }}>
            <TouchableOpacity
              style={styles.checkmarkCircleBtn}
              onPress={handleSupportSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.checkmarkIconText}>✓</Text>
            </TouchableOpacity>
          </View>

          {/* Section 5: Pending Messages + Responses */}
          {(pendingSupportRequests.length > 0 || childSentRequests.length > 0) && (
            <View style={{ marginTop: 28 }}>
              <Text style={[styles.supportLabel, { marginBottom: 12 }]}>Your pending messages</Text>

              {/* Child's locally-tracked requests (this session) */}
              {pendingSupportRequests.slice().reverse().map((req, idx) => {
                const isLatest = idx === 0;
                if (req.isNaviCard) {
                  // --- NAVI CARD ---
                  return (
                    <View key={req.id} style={{
                      backgroundColor: isLatest ? '#EEF2FF' : '#EFF6FF',
                      borderWidth: isLatest ? 2 : 1.5,
                      borderColor: isLatest ? '#4F46E5' : '#93C5FD',
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 12,
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: isLatest ? '#4338CA' : '#1D4ED8' }}>🤖 Navi · {req.type}</Text>
                          {isLatest && (
                            <View style={{ backgroundColor: '#4F46E5', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2 }}>
                              <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '800' }}>🌟 LATEST</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 11, color: '#94A3B8' }}>{req.time}</Text>
                      </View>

                      {/* Question/Situation asked by kid */}
                      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>💬 You asked:</Text>
                        <Text style={{ fontSize: 13, color: '#0F172A', fontWeight: '600', marginTop: 2 }}>"{req.situation}"</Text>
                      </View>

                      {/* Navi's advice */}
                      <View style={{ backgroundColor: isLatest ? '#E0E7FF' : '#DBEAFE', borderRadius: 10, padding: 12 }}>
                        {req.naviAdvice ? (
                          <>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: isLatest ? '#3730A3' : '#1D4ED8', marginBottom: 4 }}>💙 Navi says:</Text>
                            <Text style={{ fontSize: 13, color: isLatest ? '#1E1B4B' : '#1E3A8A', lineHeight: 19, fontWeight: '500' }}>{req.naviAdvice}</Text>
                          </>
                        ) : (
                          <Text style={{ fontSize: 13, color: '#3B82F6', fontStyle: 'italic' }}>Navi is thinking... 💭</Text>
                        )}
                      </View>
                    </View>
                  );
                } else {
                  // --- THERAPIST CARD ---
                  const replies = req.supportUserId
                    ? (messages[req.supportUserId] || []).filter(m => m.sender === 'contact')
                    : [];
                  const hasReply = replies.length > 0;
                  return (
                    <View key={req.id} style={{
                      backgroundColor: '#F8FAFF',
                      borderWidth: 1.5,
                      borderColor: hasReply ? '#6EE7B7' : '#BFDBFE',
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 12,
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB' }}>{req.type}</Text>
                        <Text style={{ fontSize: 11, color: '#94A3B8' }}>{req.time}</Text>
                      </View>
                      <Text style={{ fontSize: 13, color: '#1E293B', marginBottom: 6 }} numberOfLines={3}>{req.situation}</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasReply ? 12 : 0 }}>
                        <Text style={{ fontSize: 12, color: '#64748B' }}>Sent to: <Text style={{ fontWeight: '700' }}>{req.helper}</Text></Text>
                        <View style={{ backgroundColor: hasReply ? '#D1FAE5' : '#FEF9C3', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ fontSize: 11, color: hasReply ? '#059669' : '#CA8A04', fontWeight: '700' }}>{hasReply ? '✅ Responded' : '⏳ Pending'}</Text>
                        </View>
                      </View>
                      {hasReply && (
                        <View style={{ borderTopWidth: 1, borderTopColor: '#D1FAE5', paddingTop: 10 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669', marginBottom: 6 }}>💬 Response from support:</Text>
                          {replies.map((r, i) => (
                            <View key={i} style={{ backgroundColor: '#ECFDF5', borderRadius: 10, padding: 10, marginBottom: 4 }}>
                              <Text style={{ fontSize: 13, color: '#1E293B' }}>{r.text}</Text>
                              <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>{r.time}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                }
              })}

              {/* Historic requests fetched from Supabase */}
              {childSentRequests.map(req => {
                const replies = (messages[req.supportUserId] || []).filter(m => m.sender === 'contact');
                const hasReply = replies.length > 0;
                return (
                  <View key={req.id} style={{
                    backgroundColor: '#F8FAFF',
                    borderWidth: 1.5,
                    borderColor: hasReply ? '#6EE7B7' : '#BFDBFE',
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 12,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB' }}>{req.type}</Text>
                      <Text style={{ fontSize: 11, color: '#94A3B8' }}>{req.time}</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: '#1E293B', marginBottom: 6 }} numberOfLines={3}>{req.situation}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasReply ? 12 : 0 }}>
                      <Text style={{ fontSize: 12, color: '#64748B' }}>Sent to: <Text style={{ fontWeight: '700' }}>{req.helper}</Text></Text>
                      <View style={{ backgroundColor: hasReply ? '#D1FAE5' : '#FEF9C3', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 11, color: hasReply ? '#059669' : '#CA8A04', fontWeight: '700' }}>{hasReply ? '✅ Responded' : '⏳ Pending'}</Text>
                      </View>
                    </View>
                    {hasReply && (
                      <View style={{ borderTopWidth: 1, borderTopColor: '#D1FAE5', paddingTop: 10 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669', marginBottom: 6 }}>💬 Response from support:</Text>
                        {replies.map((r, i) => (
                          <View key={i} style={{ backgroundColor: '#ECFDF5', borderRadius: 10, padding: 10, marginBottom: 4 }}>
                            <Text style={{ fontSize: 13, color: '#1E293B' }}>{r.text}</Text>
                            <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>{r.time}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // Resources screen listing cyberbullying help & tips for the child
  const renderResourcesScreen = () => {
    return (
      <View style={styles.tabContentContainer}>
        {/* Resources Header */}
        <View style={styles.headerVertical}>
          <View style={styles.headerBottomRow}>
            <Text style={styles.headerTitle}>Resources</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollContent}>
          {/* Main Info Card */}
          <View style={styles.resourceIntroCard}>
            <Text style={styles.resourceIntroEmoji}>💡</Text>
            <View style={styles.resourceIntroText}>
              <Text style={styles.resourceIntroTitle}>Stay Safe & Kind Online</Text>
              <Text style={styles.resourceIntroDesc}>
                If someone is being mean to you, remember that it is not your fault. Here are some tools and support lines that can help!
              </Text>
            </View>
          </View>

          {/* Safety Steps */}
          <Text style={styles.updatesSectionLabel}>Navi's Safety Steps</Text>
          <View style={styles.checklistCard}>
            <View style={styles.checkItem}>
              <Text style={styles.checkEmoji}>🛑</Text>
              <View style={styles.checkTextWrapper}>
                <Text style={styles.checkItemTitle}>1. Stop & Breathe</Text>
                <Text style={styles.checkItemDesc}>Don't reply right away. Taking a deep breath helps you stay calm.</Text>
              </View>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkEmoji}>🔒</Text>
              <View style={styles.checkTextWrapper}>
                <Text style={styles.checkItemTitle}>2. Block & Restrict</Text>
                <Text style={styles.checkItemDesc}>You don't have to listen to mean words. You can block or mute them.</Text>
              </View>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkEmoji}>📸</Text>
              <View style={styles.checkTextWrapper}>
                <Text style={styles.checkItemTitle}>3. Take Screenshots</Text>
                <Text style={styles.checkItemDesc}>Save the messages on your phone so you have proof of what happened.</Text>
              </View>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkEmoji}>👩</Text>
              <View style={styles.checkTextWrapper}>
                <Text style={styles.checkItemTitle}>4. Tell an Adult</Text>
                <Text style={styles.checkItemDesc}>Show the messages to a parent, teacher, or older sibling you trust.</Text>
              </View>
            </View>
          </View>

          {/* Help Lines */}
          <Text style={styles.updatesSectionLabel}>People Who Can Help</Text>
          
          <View style={styles.resourceCard}>
            <Text style={styles.resourceCardEmoji}>📞</Text>
            <View style={styles.resourceCardContent}>
              <Text style={styles.resourceCardTitle}>National Child Help Hotline</Text>
              <Text style={styles.resourceCardDesc}>Talk to professionals who can help you handle mean messages or scary situations.</Text>
              <TouchableOpacity 
                style={styles.resourceCallBtn}
                onPress={() => Linking.openURL('tel:1-800-422-4453').catch(() => Alert.alert("Call Hotline", "Phone calls are not supported on this device. Call 1-800-422-4453."))}
              >
                <Text style={styles.resourceCallBtnText}>Call 1-800-4-A-CHILD</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.resourceCard}>
            <Text style={styles.resourceCardEmoji}>💬</Text>
            <View style={styles.resourceCardContent}>
              <Text style={styles.resourceCardTitle}>988 Lifeline (Call or Text)</Text>
              <Text style={styles.resourceCardDesc}>A free, confidential helpline you can call or text any time to speak with someone kind.</Text>
              <View style={styles.resourceRowBtns}>
                <TouchableOpacity 
                  style={[styles.resourceCallBtn, { flex: 1, marginRight: 6 }]}
                  onPress={() => Linking.openURL('tel:988').catch(() => Alert.alert("Call 988", "Phone calls are not supported on this device. Call 988."))}
                >
                  <Text style={styles.resourceCallBtnText}>Call 988</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.resourceCallBtn, { flex: 1, backgroundColor: '#10B981', borderColor: '#34D399' }]}
                  onPress={() => Linking.openURL('sms:988').catch(() => Alert.alert("Text 988", "SMS is not supported on this device. Text 988."))}
                >
                  <Text style={styles.resourceCallBtnText}>Text 988</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.resourceCard}>
            <Text style={styles.resourceCardEmoji}>🌐</Text>
            <View style={styles.resourceCardContent}>
              <Text style={styles.resourceCardTitle}>StopBullying.gov</Text>
              <Text style={styles.resourceCardDesc}>Learn more about cyberbullying and read stories from other kids who overcame it.</Text>
              <TouchableOpacity 
                style={[styles.resourceCallBtn, { backgroundColor: '#4F46E5', borderColor: '#6366F1' }]}
                onPress={() => Linking.openURL('https://www.stopbullying.gov/').catch(() => Alert.alert("Open Website", "Could not open browser. Go to stopbullying.gov"))}
              >
                <Text style={styles.resourceCallBtnText}>Visit Website</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  // Settings screen for child
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }
    const updatedUser = {
      ...currentUser,
      name: editName.trim(),
      bio: editBio.trim(),
      avatar_url: editAvatar.trim(),
    };
    if (supabase) {
      try {
        await upsertProfile(updatedUser);
      } catch (err) {
        console.error("Error saving profile to Supabase:", err);
      }
    }
    await AsyncStorage.setItem('navi_user_profile', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    
    // Refresh local profiles to reflect changes
    setProfiles(prev => prev.map(p => 
      p.id === updatedUser.id ? { ...p, name: updatedUser.name, bio: updatedUser.bio, avatar: updatedUser.avatar_url } : p
    ));

    setSettingsSubScreen(null);
    Alert.alert("Success", "Profile updated successfully!");
  };

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        "Permission Denied",
        "We need media library permission to let you select a profile picture!",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Uri = `data:image/jpeg;base64,${asset.base64}`;
        setEditAvatar(base64Uri);
      }
    } catch (e) {
      console.log("Profile image picking error:", e);
      Alert.alert("Error", "Could not load image from your gallery.");
    }
  };

  const takeProfilePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        "Permission Denied",
        "We need camera permission to let you take a profile picture!",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Uri = `data:image/jpeg;base64,${asset.base64}`;
        setEditAvatar(base64Uri);
      }
    } catch (e) {
      console.log("Profile camera error:", e);
      Alert.alert("Error", "Could not capture photo.");
    }
  };

  const renderEditProfileScreen = () => {
    const presetAvatars = [
      { name: 'Puppy', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150' },
      { name: 'Kitten', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150' },
      { name: 'Bunny', url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=150' },
      { name: 'Bear', url: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=150' },
      { name: 'Panda', url: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=150' },
      { name: 'Fox', url: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=150' }
    ];

    return (
      <View style={styles.tabContentContainer}>
        {/* Header */}
        <View style={styles.headerVertical}>
          <View style={[styles.headerBottomRow, { justifyContent: 'flex-start', alignItems: 'center' }]}>
            <TouchableOpacity onPress={() => setSettingsSubScreen(null)} style={{ marginRight: 16 }}>
              <Text style={{ fontSize: 24, color: '#1E3A8A', fontWeight: '800' }}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollList} contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 }]}>
          {/* Avatar Preview */}
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => {
                Alert.alert(
                  "Change Profile Picture",
                  "Choose an option:",
                  [
                    { text: "📸 Pick from Gallery", onPress: pickProfileImage },
                    { text: "📷 Take Photo", onPress: takeProfilePhoto },
                    { text: "Cancel", style: "cancel" }
                  ]
                );
              }}
              style={{ position: 'relative' }}
            >
              <RenderAvatar 
                name={editName || 'User'} 
                avatar={editAvatar} 
                style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#3B82F6' }} 
              />
              <View style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: '#2563EB',
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#FFFFFF'
              }}>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>📷</Text>
              </View>
            </TouchableOpacity>
            <Text style={{ marginTop: 10, fontSize: 14, color: '#64748B', fontWeight: '600' }}>Tap image to change photo</Text>
          </View>

          {/* Preset Avatars */}
          <Text style={styles.supportLabel}>Preset Avatars</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20, justifyContent: 'center' }}>
            {presetAvatars.map((av, idx) => (
              <TouchableOpacity 
                key={idx} 
                onPress={() => setEditAvatar(av.url)}
                style={{
                  borderWidth: editAvatar === av.url ? 3 : 1,
                  borderColor: editAvatar === av.url ? '#2563EB' : '#E2E8F0',
                  borderRadius: 12,
                  padding: 4,
                  backgroundColor: '#FFFFFF'
                }}
              >
                <Image source={{ uri: av.url }} style={{ width: 50, height: 50, borderRadius: 8 }} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Avatar URL */}
          <Text style={styles.supportLabel}>Custom Avatar URL</Text>
          <TextInput 
            style={styles.situationInput}
            value={editAvatar}
            onChangeText={setEditAvatar}
            placeholder="Paste an image URL here..."
            placeholderTextColor="#94A3B8"
            height={50}
          />

          {/* Display Name */}
          <Text style={styles.supportLabel}>Display Name</Text>
          <TextInput 
            style={styles.situationInput}
            value={editName}
            onChangeText={setEditName}
            placeholder="Enter your name..."
            placeholderTextColor="#94A3B8"
            height={50}
          />

          {/* Status/Bio */}
          <Text style={styles.supportLabel}>Status / Bio</Text>
          <TextInput 
            style={styles.situationInput}
            value={editBio}
            onChangeText={setEditBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor="#94A3B8"
            multiline={true}
            numberOfLines={3}
            height={80}
          />

          {/* Save Button */}
          <TouchableOpacity 
            style={{
              backgroundColor: '#2563EB',
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
              marginTop: 10
            }}
            onPress={handleSaveProfile}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderNotificationsScreen = () => {
    return (
      <View style={styles.tabContentContainer}>
        {/* Header */}
        <View style={styles.headerVertical}>
          <View style={[styles.headerBottomRow, { justifyContent: 'flex-start', alignItems: 'center' }]}>
            <TouchableOpacity onPress={() => setSettingsSubScreen(null)} style={{ marginRight: 16 }}>
              <Text style={{ fontSize: 24, color: '#1E3A8A', fontWeight: '800' }}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.settingsListCard, { padding: 8 }]}>
            {/* Sound Toggle */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#F1F5F9'
            }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>Play Sounds</Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Play sound effects for incoming messages</Text>
              </View>
              <Switch 
                value={notifSound} 
                onValueChange={setNotifSound} 
                trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                thumbColor={notifSound ? '#2563EB' : '#F1F5F9'}
              />
            </View>

            {/* Vibration Toggle */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#F1F5F9'
            }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>Vibrate</Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Vibrate on new alert notifications</Text>
              </View>
              <Switch 
                value={notifVibration} 
                onValueChange={setNotifVibration} 
                trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                thumbColor={notifVibration ? '#2563EB' : '#F1F5F9'}
              />
            </View>

            {/* Preview Toggle */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#F1F5F9'
            }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>Message Previews</Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Show sender name and message text in notifications</Text>
              </View>
              <Switch 
                value={notifPreview} 
                onValueChange={setNotifPreview} 
                trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                thumbColor={notifPreview ? '#2563EB' : '#F1F5F9'}
              />
            </View>

            {/* Mute Toggle */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 16,
              paddingHorizontal: 12,
            }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>Do Not Disturb</Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Mute all notifications temporarily</Text>
              </View>
              <Switch 
                value={notifMute} 
                onValueChange={setNotifMute} 
                trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                thumbColor={notifMute ? '#2563EB' : '#F1F5F9'}
              />
            </View>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity 
            style={{
              backgroundColor: '#2563EB',
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
              marginTop: 20
            }}
            onPress={() => {
              setSettingsSubScreen(null);
              Alert.alert("Success", "Notification settings saved!");
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>Save & Go Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderProfileScreen = () => {
    if (settingsSubScreen === 'edit_profile') {
      return renderEditProfileScreen();
    }
    if (settingsSubScreen === 'notifications') {
      return renderNotificationsScreen();
    }

    const settingsItems = [
      { id: 'profile', title: 'Edit Profile', desc: 'Change your photo, name, and status', emoji: '👤', color: '#EFF6FF', textColor: '#2563EB' },
      { id: 'notifications', title: 'Notifications', desc: 'Message sounds, alerts, and mute settings', emoji: '🔔', color: '#FFFBEB', textColor: '#D97706' },
    ];

    return (
      <View style={styles.tabContentContainer}>
        {/* Settings Header */}
        <View style={styles.headerVertical}>
          <View style={styles.headerBottomRow}>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollContent}>
          {/* Interactive Profile Summary Card */}
          <View style={styles.settingsMiniProfile}>
            <RenderAvatar 
              name={currentUser?.name || 'Navi'} 
              avatar={currentUser?.avatar_url || ''} 
              style={styles.settingsAvatarCircle} 
            />
            <View style={styles.settingsProfileInfo}>
              <Text style={styles.settingsProfileName}>{currentUser?.name || 'Navi User'}</Text>
              <Text style={styles.settingsProfileDesc}>{currentUser?.phone ? `+${currentUser.phone}` : 'No phone verified'}</Text>
              
              {/* Account Type Badge */}
              <View style={{ flexDirection: 'row', marginTop: 6 }}>
                <View style={{
                  backgroundColor: isCurrentUserAdult() ? '#D1FAE5' : '#DBEAFE',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isCurrentUserAdult() ? '#10B981' : '#3B82F6',
                }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color: isCurrentUserAdult() ? '#065F46' : '#1E40AF',
                  }}>
                    {isCurrentUserAdult() ? '🧑‍💼 Adult' : '🧒 Kid'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Trusted Adult Section for Kid Accounts */}
          {(!currentUser || !isCurrentUserAdult()) && (
            <View style={styles.trustedAdultSection}>
              <Text style={styles.trustedAdultSectionTitle}>🛡️ Trusted Adult Contact</Text>
              {trustedAdult ? (
                <View style={styles.trustedAdultCard}>
                  <View style={styles.trustedAdultDetails}>
                    <Text style={styles.trustedAdultNameText}>{trustedAdult.name}</Text>
                    <Text style={styles.trustedAdultPhoneText}>{trustedAdult.relation} • {trustedAdult.phone}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.trustedAdultEditBtn} 
                    onPress={() => {
                      setAdultName(trustedAdult.name);
                      setAdultPhone(trustedAdult.phone);
                      setAdultRelation(trustedAdult.relation);
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setAddAdultModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.trustedAdultEditBtnText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.trustedAdultAddBtn}
                  onPress={() => {
                    setAdultName('');
                    setAdultPhone('');
                    setAdultRelation('');
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setAddAdultModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.trustedAdultAddBtnText}>＋ Add Trusted Adult</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Settings Options List */}
          <View style={styles.settingsListCard}>
            {settingsItems.map((item, idx) => (
              <TouchableOpacity 
                key={item.id}
                style={[
                  styles.settingsRow,
                  idx === settingsItems.length - 1 && { borderBottomWidth: 0 }
                ]}
                onPress={() => {
                  if (item.id === 'profile') {
                    setEditName(currentUser?.name || '');
                    setEditBio(currentUser?.bio || '');
                    setEditAvatar(currentUser?.avatar_url || '');
                    setSettingsSubScreen('edit_profile');
                  } else if (item.id === 'notifications') {
                    setSettingsSubScreen('notifications');
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.settingsRowEmojiBg, { backgroundColor: item.color }]}>
                  <Text style={[styles.settingsRowEmoji, { color: item.textColor }]}>{item.emoji}</Text>
                </View>
                <View style={styles.settingsRowContent}>
                  <Text style={styles.settingsRowTitle}>{item.title}</Text>
                  <Text style={styles.settingsRowDesc}>{item.desc}</Text>
                </View>
                <Text style={styles.settingsRowArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout / Switch Account Option */}
          <TouchableOpacity 
            style={[styles.settingsRow, { borderBottomWidth: 0, marginTop: 16, backgroundColor: '#FEE2E2', borderRadius: 16, padding: 16 }]}
            onPress={async () => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              await AsyncStorage.removeItem('navi_user_profile');
              setRegName('');
              setRegPhone('');
              setRegRole('Kid');
              setRegBio('');
              setIsAbove18(null);
              setCurrentUser(null);
              setActiveChat(null);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.settingsRowEmojiBg, { backgroundColor: '#FCA5A5' }]}>
              <Text style={[styles.settingsRowEmoji, { color: '#DC2626' }]}>🚪</Text>
            </View>
            <View style={styles.settingsRowContent}>
              <Text style={[styles.settingsRowTitle, { color: '#DC2626', fontWeight: '800' }]}>Switch / Log Out Account</Text>
              <Text style={styles.settingsRowDesc}>Log out of this device to sign in with a different phone number</Text>
            </View>
            <Text style={[styles.settingsRowArrow, { color: '#DC2626' }]}>→</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  // Send a safe response message programmatically to resolve the safety alert
  const sendSafeFeedback = (text) => {
    if (!activeChat) return;
    const contactId = activeChat.id;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const replyId = `${contactId}_user_safety_${Date.now()}`;
    
    const newMsg = {
      id: replyId,
      text: text,
      sender: 'user',
      time: timeStr
    };

    setMessages(prev => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMsg]
    }));

    // Trigger thumbs up mood and success message
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNaviMascotImageState('thumbs_up');
    setNaviFeedbackMessage("Awesome! You made a kind and safe choice. Way to go! 👍");
    setInterceptedText(null);
    setIsBypassReady(false);

    // Wait 2.5 seconds, then animate exit and clean up
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(naviAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true
        }),
        Animated.timing(naviMascotAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true
        })
      ]).start(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSafetyCategory(null);
        setNaviSpeechVisible(false);
        setNaviFeedbackMessage(null);
        setNaviMascotImageState('serious');
      });
    }, 2500);
  };

  const generateLocalModelResponse = async (contextText) => {
    const politeReply = await generatePoliteResponse(contextText);
    return politeReply || "Thank you, but let's keep our conversation friendly and kind! 😊";
  };

  const generateContactResponse = async (contact, chatHistory, fallbackText) => {
    const reply = await generateContactReply(contact.name, contact.role, contact.bio, chatHistory);
    return reply || fallbackText;
  };

  const generatePoliteSuggestions = async (rudeMessage) => {
    setIsGeneratingSuggestions(true);
    setPoliteSuggestions([]);

    const textToUse = (rudeMessage && rudeMessage.trim()) ? rudeMessage : (interceptedText || "message");
    const suggestions = await generatePoliteSuggestionsList(textToUse);
    
    setIsGeneratingSuggestions(false);

    if (suggestions && suggestions.length > 0) {
      setPoliteSuggestions(suggestions.slice(0, 3));
    } else {
      // Static fallback options if generation fails
      if (safetyCategory === 'IGNORE_PIVOT') {
        setPoliteSuggestions([
          "I don't share my personal info online, let's talk about games instead! 🎮",
          "My parents say I shouldn't give out my details. What is your favorite hobby? ⚽",
          "Let's talk about something else! Did you do the homework today? 📚"
        ]);
      } else if (safetyCategory === 'TELL_ADULT') {
        setPoliteSuggestions([
          "I don't think that is safe. I'm going to tell my parents. 👩",
          "Let's check in with a parent first before talking about this! 👍",
          "I'm not allowed to talk about that online. Let's change the subject! 😊"
        ]);
      } else {
        setPoliteSuggestions([
          "Please don't call me names, let's keep our conversation friendly! 😊",
          "I want to keep our chats kind and fun. Let's talk about something else! 👍",
          "Let's be nice to each other. What games are you playing today? 🎮"
        ]);
      }
    }
  };

  const handleSelectPoliteSuggestion = (suggestionText) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // Log the intervention event to Supabase
    saveInterventionLogToSupabase('Listened', pendingImage ? 'Sent Image Intercepted' : 'Sent Message Intercepted', pendingText || '[Image]');

    sendSafeFeedback(suggestionText);
    setPendingImage(null);
    setPendingText(null);
    setSuggestionsVisible(false);
    setPoliteSuggestions([]);
  };

  const handleNaviRespondPolitely = () => {
    if (!activeChat) return;
    const contactId = activeChat.id;
    const activeMessages = messages[contactId] || [];
    const lastMsg = activeMessages.length > 0 ? activeMessages[activeMessages.length - 1].text : "";

    setSuggestionsVisible(true);
    generatePoliteSuggestions(lastMsg);
  };

  const convertUrlToBase64 = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.log("Failed to convert URL to base64:", e);
      return null;
    }
  };

  const checkImageSafetyWithGemma = async (imageUri, messageText = "") => {
    // 1. Check offline mock image trigger (for test buttons)
    if (imageUri && imageUri.includes("mean_meme_test")) {
      return 'RESPOND_POLITELY'; // Flagged as rude/mean image
    }

    // 2. Check if the accompanying message text contains key mock keywords
    const lowerText = messageText.toLowerCase();
    if (lowerText.includes("stupid") || lowerText.includes("mean") || lowerText.includes("ugly") || lowerText.includes("loser")) {
      console.log("Mock image safety scan flagged keyword:", lowerText);
      return 'RESPOND_POLITELY';
    }

    return null;
  };

  const pickImageAction = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        "Permission Denied",
        "We need media library permission to let you select images from your gallery!",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Uri = `data:image/jpeg;base64,${asset.base64}`;
        sendMockImageMessage(base64Uri, "Shared a photo from my phone!");
      }
    } catch (e) {
      console.log("Image picking error:", e);
      Alert.alert("Error", "Could not load image from your gallery.");
    }
  };

  const takePhotoAction = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        "Permission Denied",
        "We need camera permission to let you take live photos!",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Uri = `data:image/jpeg;base64,${asset.base64}`;
        sendMockImageMessage(base64Uri, "Shared a photo from my camera!");
      }
    } catch (e) {
      console.log("Camera loading error:", e);
      Alert.alert("Error", "Could not capture photo from your camera.");
    }
  };

  const sendMockImagePrompt = () => {
    Alert.alert(
      "Send Image Message",
      "Choose how to send an image:",
      [
        {
          text: "📸 Pick from Gallery",
          onPress: pickImageAction
        },
        {
          text: "📷 Take Photo",
          onPress: takePhotoAction
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const sendFinalImageMessage = async (uri, text, isMeanImage = false) => {
    if (!activeChat) return;
    const contactId = activeChat.id;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessageId = `${contactId}_user_${Date.now()}`;

    const newMsg = {
      id: newMessageId,
      text: text,
      image: uri,
      sender: 'user',
      time: timeStr
    };

    // Add user message with image
    setMessages(prev => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMsg]
    }));

    // Update profile card info (bring to top of list)
    setProfiles(prev => prev.map(p => 
      p.id === contactId 
        ? { ...p, time: timeStr, lastUpdated: Date.now() } 
        : p
    ));

    // Clear safety states
    setSafetyCategory(null);
    setNaviSpeechVisible(false);

    // Send to Supabase if real user
    if (supabase && !activeChat.is_simulated && currentUser) {
      await sendSupabaseMessage(currentUser.id, contactId, text, uri);
    } else {
      // Trigger auto reply if online or away (only for simulated contacts)
      if (activeChat.status !== 'offline') {
        setIsTyping(true);
        
        setTimeout(() => {
          setIsTyping(false);
          
          let replyText = "";
          if (isMeanImage) {
            replyText = `Please don't send me mean memes. Let's keep our conversation kind and friendly! 😊`;
          } else {
            replyText = `Wow, that looks so cool! Thanks for sharing! 🌟`;
          }

          const replyId = `${contactId}_contact_${Date.now()}`;
          const replyMsg = {
            id: replyId,
            text: replyText,
            sender: 'contact',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          setMessages(prev => ({
            ...prev,
            [contactId]: [...(prev[contactId] || []), replyMsg]
          }));

          setProfiles(prev => prev.map(p => 
            p.id === contactId 
              ? { ...p, time: replyMsg.time, lastUpdated: Date.now() } 
              : p
          ));

          if (contactId !== '4' && contactId !== '5') {
            const replySafety = checkMessageSafety(replyText, false);
            if (replySafety) {
              setSafetyCategory(replySafety);
              setNaviSpeechVisible(true);
              setToxicReceivedCount(prev => prev + 1);
              const newAlert = {
                id: `alert_${Date.now()}`,
                time: 'Just Now',
                type: 'Received Message Flagged',
                contact: activeChat ? activeChat.name : 'Unknown',
                action: 'Navi Alerted'
              };
              setSafetyAlertsLog(prev => [newAlert, ...prev]);
            }
          }
        }, 1500);
      }
    }
  };

  const sendMockImageMessage = async (uri, text) => {
    if (!activeChat) return;

    setIsAnalyzingImage(true);
    // Scan image safety with Gemini
    const imageSafety = await checkImageSafetyWithGemma(uri, text);
    setIsAnalyzingImage(false);

    if (imageSafety) {
      setPendingImage({ uri, text });
      setPendingText(null);
      setSafetyCategory(imageSafety);
      setNaviSpeechVisible(true);
      // Increment parent insights counter
      setNaviPopupCount(prev => prev + 1);
      // Add incident to safety log
      const newAlert = {
        id: `alert_${Date.now()}`,
        time: 'Just Now',
        type: 'Sent Image Intercepted',
        contact: activeChat ? activeChat.name : 'Unknown',
        action: 'Pending Reconsideration'
      };
      setSafetyAlertsLog(prev => [newAlert, ...prev]);
    } else {
      sendFinalImageMessage(uri, text, false);
    }
  };

  const handleIgnoreAndSend = () => {
    setNaviBypassCount(prev => prev + 1);
    setSafetyAlertsLog(prev => prev.map((a, idx) => idx === 0 && a.action === 'Pending Reconsideration' ? { ...a, action: 'Bypassed' } : a));

    if (pendingImage || pendingText) {
      saveInterventionLogToSupabase('Bypassed', pendingImage ? 'Sent Image Intercepted' : 'Sent Message Intercepted', pendingText || '[Image]');
    } else {
      saveInterventionLogToSupabase('Ignored', 'Received Message Flagged', interceptedText || '');
    }

    if (pendingImage) {
      sendFinalImageMessage(pendingImage.uri, pendingImage.text, true);
      setPendingImage(null);
    } else if (pendingText) {
      sendFinalTextMessage(pendingText);
      setPendingText(null);
    }

    // Animate exit smoothly instead of unmounting instantly
    Animated.parallel([
      Animated.timing(naviAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(naviMascotAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true
      })
    ]).start(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSafetyCategory(null);
      setNaviSpeechVisible(false);
      setNaviFeedbackMessage(null);
      setNaviMascotImageState('serious');
    });
  };

  const handleListenToSuggestions = () => {
    if (!activeChat) return;
    setNaviListenCount(prev => prev + 1);
    setSafetyAlertsLog(prev => prev.map((a, idx) => idx === 0 && a.action === 'Pending Reconsideration' ? { ...a, action: 'Listened' } : a));

    let textToAnalyze = "";
    if (pendingText) {
      textToAnalyze = pendingText;
    } else if (pendingImage) {
      textToAnalyze = pendingImage.text || "mean photo";
    } else {
      // Received message case: use interceptedText if available, else last message in history
      const activeMessages = (activeChat && messages[activeChat.id]) ? messages[activeChat.id] : [];
      textToAnalyze = interceptedText || (activeMessages.length > 0 ? activeMessages[activeMessages.length - 1].text : "");
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNaviMascotImageState('thumbs_up');
    setSuggestionsVisible(true);
    generatePoliteSuggestions(textToAnalyze);
  };

  const sendReportToAdult = (adultId) => {
    let reportText = "";
    if (pendingImage) {
      reportText = `🚨 [Navi Safety Report]\nI was about to send an unsafe image.\nCan you help intervene? 🛡️`;
    } else if (pendingText) {
      const type = safetyCategory === 'IGNORE_PIVOT' ? 'private information' : 'unsafe content';
      reportText = `🚨 [Navi Safety Report]\nI was about to send a message containing ${type}: "${pendingText}".\nCan you help intervene? 🛡️`;
    } else {
      const lastMsgText = interceptedText || "";
      const type = safetyCategory === 'IGNORE_PIVOT' ? 'request for private information' : 'mean or unsafe content';
      reportText = `🚨 [Navi Safety Report]\n${activeChat?.name || 'Someone'} sent me a message containing ${type}: "${lastMsgText}".\nCan you help intervene? 🛡️`;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => ({
      ...prev,
      [adultId]: [...(prev[adultId] || []), {
        id: `safety_report_${Date.now()}`,
        text: reportText,
        sender: 'user',
        time: timeStr
      }]
    }));

    setProfiles(prev => prev.map(p => 
      p.id === adultId ? { ...p, time: timeStr, lastUpdated: Date.now() } : p
    ));

    if (supabase && currentUser && adultId !== 'trusted_adult' && adultId !== '4' && adultId !== '5') {
      sendSupabaseMessage(currentUser.id, adultId, reportText);
    }
  };

  const handleNaviTellAdult = () => {
    if (!activeChat) return;
    setNaviAlertAdultCount(prev => prev + 1);
    setSafetyAlertsLog(prev => prev.map((a, idx) => idx === 0 && a.action === 'Pending Reconsideration' ? { ...a, action: 'Alerted' } : a));

    const contactId = activeChat.id;
    const activeMessages = messages[contactId] || [];
    const lastMsgText = activeMessages.length > 0 ? activeMessages[activeMessages.length - 1].text : "";

    // Construct the automatic report text
    let reportText = "";
    if (pendingImage) {
      reportText = `🚨 [Navi Safety Report]\nI was about to send an unsafe image.\nCan you help intervene? 🛡️`;
      saveInterventionLogToSupabase('Alerted', 'Sent Image Intercepted', '[Image]');
    } else if (pendingText) {
      const type = safetyCategory === 'IGNORE_PIVOT' ? 'private information' : 'unsafe content';
      reportText = `🚨 [Navi Safety Report]\nI was about to send a message containing ${type}: "${pendingText}".\nCan you help intervene? 🛡️`;
      saveInterventionLogToSupabase('Alerted', 'Sent Message Intercepted', pendingText);
    } else {
      const type = safetyCategory === 'IGNORE_PIVOT' ? 'request for private information' : 'mean or unsafe content';
      reportText = `🚨 [Navi Safety Report]\n${activeChat.name} sent me a message containing ${type}: "${lastMsgText}".\nCan you help intervene? 🛡️`;
      saveInterventionLogToSupabase('Alerted', 'Received Message Flagged', lastMsgText);
    }

    setPendingImage(null);
    setPendingText(null);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Send the report automatically to Mommy, Daddy, and the Custom Trusted Adult (if present)
    setMessages(prev => {
      const updated = { ...prev };
      
      // Send to Mommy
      const mommyMsgId = `mommy_report_${Date.now()}`;
      updated['4'] = [...(updated['4'] || []), {
        id: mommyMsgId,
        text: reportText,
        sender: 'user',
        time: timeStr
      }];
      
      // Send to Daddy
      const daddyMsgId = `daddy_report_${Date.now()}`;
      updated['5'] = [...(updated['5'] || []), {
        id: daddyMsgId,
        text: reportText,
        sender: 'user',
        time: timeStr
      }];

      // Send to all actual adult contacts
      const adultContacts = getAdultContacts();
      adultContacts.forEach(adult => {
        const msgId = `auto_report_${adult.id}_${Date.now()}`;
        updated[adult.id] = [...(updated[adult.id] || []), {
          id: msgId,
          text: reportText,
          sender: 'user',
          time: timeStr
        }];

        if (supabase && currentUser && !adult.is_simulated) {
          sendSupabaseMessage(currentUser.id, adult.id, reportText);
        }
      });
      
      return updated;
    });

    // Bring profiles to top
    const adultContacts = getAdultContacts();
    setProfiles(prev => prev.map(p => {
      const isAdult = adultContacts.some(a => a.id === p.id);
      if (isAdult) {
        return { ...p, time: timeStr, lastUpdated: Date.now() };
      }
      return p;
    }));

    // Trigger thumbs up mood and success message
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNaviMascotImageState('thumbs_up');
    setNaviFeedbackMessage("Awesome! You told a parent. Navi is super proud of you! 👍");
    setInterceptedText(null);
    setIsBypassReady(false);

    // Wait 2.5 seconds, then animate exit, clean up, and open the chat
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(naviAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true
        }),
        Animated.timing(naviMascotAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true
        })
      ]).start(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSafetyCategory(null);
        setNaviSpeechVisible(false);
        setNaviFeedbackMessage(null);
        setNaviMascotImageState('serious');
        
        // Open the designated chat screen
        const adultContacts = getAdultContacts();
        if (adultContacts.length > 0) {
          const targetProfile = profiles.find(p => p.id === adultContacts[0].id);
          if (targetProfile) {
            openChat(targetProfile);
          }
        }
      });
    }, 2500);
  };

  const messageMommyAction = () => {
    setAdultAlertVisible(false);
    sendReportToAdult('4');
    const mommyProfile = profiles.find(p => p.id === '4');
    if (mommyProfile) {
      openChat(mommyProfile);
    }
  };

  const messageDaddyAction = () => {
    setAdultAlertVisible(false);
    sendReportToAdult('5');
    const daddyProfile = profiles.find(p => p.id === '5');
    if (daddyProfile) {
      openChat(daddyProfile);
    }
  };

  const messageTrustedAdultAction = () => {
    setAdultAlertVisible(false);
    const adultId = trustedAdult ? (trustedAdult.id || 'trusted_adult') : 'trusted_adult';
    sendReportToAdult(adultId);
    const adultProfile = profiles.find(p => p.id === adultId);
    if (adultProfile) {
      openChat(adultProfile);
    }
  };

  const startCall = (type) => {
    if (!activeChat) return;
    setActiveCall({ contactId: activeChat.id, contactName: activeChat.name, type });
    if (supabase && !activeChat.is_simulated && currentUser) {
      const signalingText = `__CALL_INITIATED_${type.toUpperCase()}__`;
      sendSupabaseMessage(currentUser.id, activeChat.id, signalingText);
    }
  };

  const startCallWithProfile = (profile, type) => {
    if (!profile) return;
    setActiveCall({ contactId: profile.id, contactName: profile.name, type });
    if (supabase && !profile.is_simulated && currentUser) {
      const signalingText = `__CALL_INITIATED_${type.toUpperCase()}__`;
      sendSupabaseMessage(currentUser.id, profile.id, signalingText);
    }
  };

  const endCall = () => {
    if (activeCallRef.current) {
      const { contactId } = activeCallRef.current;
      const isSimulated = !contactId || 
                          contactId === '4' || 
                          contactId === '5' || 
                          contactId === 'trusted_adult';
      if (supabase && currentUser && contactId && !isSimulated) {
        sendSupabaseMessage(currentUser.id, contactId, '__CALL_ENDED__');
      }
    }
    setActiveCall(null);
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    const { senderId, senderName, type } = incomingCall;
    if (supabase && currentUser) {
      sendSupabaseMessage(currentUser.id, senderId, '__CALL_ACCEPTED__');
    }
    setActiveCall({ contactId: senderId, contactName: senderName, type, isIncoming: true });
    setCallStatus('connected');
    setIncomingCall(null);
  };

  const declineCall = () => {
    if (!incomingCall) return;
    const { senderId } = incomingCall;
    if (supabase && currentUser) {
      sendSupabaseMessage(currentUser.id, senderId, '__CALL_DECLINED__');
    }
    setIncomingCall(null);
  };

  const handleSaveTrustedAdult = async (name, phone, relation) => {
    if (!name.trim() || !phone.trim() || !relation.trim()) {
      Alert.alert("Error", "Please fill in all the details.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    let matchedProfile = profiles.find(p => p.phone && p.phone.replace(/\D/g, '') === cleanPhone);

    if (!matchedProfile && supabase) {
      try {
        const dbProfile = await fetchProfileByPhone(cleanPhone);
        if (dbProfile) {
          matchedProfile = {
            id: dbProfile.id,
            name: dbProfile.name,
            phone: dbProfile.phone,
            role: dbProfile.role || 'Contact',
            bio: dbProfile.bio || '',
            avatar: null,
            time: 'Just now',
            unread: 0,
            is_simulated: false
          };
          setProfiles(prev => [...prev, matchedProfile]);
        }
      } catch (dbErr) {
        console.error('[Trusted Adult] Error checking database for phone:', dbErr);
      }
    }

    const adultId = matchedProfile ? matchedProfile.id : 'trusted_adult';

    const newAdult = { 
      name: name.trim(), 
      phone: phone.trim(), 
      relation: relation.trim(),
      id: adultId
    };

    setTrustedAdult(newAdult);
    await AsyncStorage.setItem('navi_trusted_adult', JSON.stringify(newAdult));
    
    setProfiles(prev => {
      const cleanPhone = newAdult.phone.replace(/\D/g, '');
      const exists = prev.some(p => p.id === adultId || (p.phone && p.phone.replace(/\D/g, '') === cleanPhone));

      if (exists) {
        return prev.map(p => {
          if (p.id === adultId || (p.phone && p.phone.replace(/\D/g, '') === cleanPhone)) {
            return {
              ...p,
              name: newAdult.name,
              phone: newAdult.phone,
              isTrustedAdult: true,
              role: p.role && p.role.includes('🛡️') ? p.role : `${p.role || ''} (${newAdult.relation} 🛡️)`
            };
          }
          return p;
        });
      } else {
        return [
          ...prev,
          {
            id: adultId,
            name: newAdult.name,
            phone: newAdult.phone,
            role: `${newAdult.relation} 🛡️ (Trusted Adult)`,
            bio: `My designated trusted adult for safety alerts.`,
            avatar: null,
            time: 'Just now',
            unread: 0,
            is_simulated: adultId === 'trusted_adult'
          }
        ];
      }
    });

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAddAdultModalVisible(false);
    Alert.alert("Success", `${newAdult.name} has been added as your trusted adult!`);
  };

  // Swipe to dismiss bottom sheet logic
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selectedProfile !== null) {
      translateY.setValue(0);
    }
  }, [selectedProfile]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Handle dragging downwards
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Lower distance threshold (50px) or fast downward velocity (vy > 0.3)
        if (gestureState.dy > 50 || gestureState.vy > 0.3) {
          // Swipe down completely and dismiss
          Animated.timing(translateY, {
            toValue: 800,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setSelectedProfile(null);
          });
        } else {
          // Return back to original position
          Animated.spring(translateY, {
            toValue: 0,
            tension: 40,
            friction: 6,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Filter profiles based on search and sort by lastUpdated (newest first!)
  const filteredProfiles = profiles
    .filter(profile => {
      const role = (profile.role || '').toLowerCase();
      if (role.includes('support')) return false; // hide support users from chat
      return (
        profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));

  // Clear unread count when opening a chat
  const openChat = async (profile) => {
    setActiveChat(profile);
    setSelectedProfile(null);
    setNaviSpeechVisible(false);
    setInterceptedText(null);
    setIsBypassReady(false);
    setSuggestionsVisible(false);
    setPoliteSuggestions([]);
    setProfiles(prev => prev.map(p => 
      p.id === profile.id ? { ...p, unread: 0 } : p
    ));

    // Fetch history from Supabase if connected and not simulated
    if (supabase && !profile.is_simulated && currentUser) {
      const history = await fetchChatHistory(currentUser.id, profile.id);
      setMessages(prev => ({
        ...prev,
        [profile.id]: history
      }));
    }
  };

  const handleRegisterUser = async () => {
    if (!regPhone.trim()) {
      Alert.alert("Required Field", "Please enter your phone number to sign in or create an account!");
      return;
    }

    const cleanPhone = regPhone.replace(/\D/g, '');
    if (cleanPhone.length < 7) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number!");
      return;
    }

    setIsUserLoading(true);
    try {
      let existing = null;
      if (supabase) {
        existing = await fetchProfileByPhone(cleanPhone);
      }
      if (!existing) {
        existing = profiles.find(p => p.phone && p.phone.replace(/\D/g, '') === cleanPhone && !p.is_simulated);
      }

      if (existing) {
        // Log in to existing account!
        const userProfile = {
          id: existing.id || cleanPhone,
          name: regName.trim() || existing.name,
          role: regName.trim() ? regRole : (existing.role || 'Kid'),
          phone: cleanPhone,
          bio: regName.trim() ? regBio.trim() : (existing.bio || ''),
          avatar_url: existing.avatar_url || '',
          is_simulated: false
        };

        if (supabase) {
          await upsertProfile(userProfile);
        }
        await AsyncStorage.setItem('navi_user_profile', JSON.stringify(userProfile));
        setCurrentUser(userProfile);
        setActiveTab((userProfile.role || '').toLowerCase().includes('support') ? 'support_inbox' : 'chats');
        Alert.alert("Welcome Back!", `Logged in as ${userProfile.name}.`);
      } else {
        // Create new account
        if (!regName.trim()) {
          Alert.alert("Required Field", "Please enter your name to create your account!");
          return;
        }

        if (regRole === 'Parent' || regRole === 'Support') {
          if (isAbove18 === null) {
            Alert.alert("Age Verification", "Please confirm whether you are 18 or above.");
            return;
          }
          if (isAbove18 === false) {
            Alert.alert("Age Restriction", `${regRole} account registration requires you to be 18 years of age or older.`);
            return;
          }
        }

        const userProfile = {
          id: cleanPhone,
          name: regName.trim(),
          role: regRole,
          phone: cleanPhone,
          bio: regBio.trim(),
          avatar_url: '',
          is_simulated: false
        };
        if (supabase) {
          await upsertProfile(userProfile);
        }
        await AsyncStorage.setItem('navi_user_profile', JSON.stringify(userProfile));
        setCurrentUser(userProfile);
        setActiveTab((userProfile.role || '').toLowerCase().includes('support') ? 'support_inbox' : 'chats');
        Alert.alert("Registration Complete", `Welcome to Navi, ${userProfile.name}!`);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not complete sign in / registration.");
    } finally {
      setIsUserLoading(false);
    }
  };

  const handleSearchContactByPhone = async () => {
    if (!searchPhoneQuery.trim()) {
      Alert.alert("Error", "Please enter a phone number to search!");
      return;
    }
    const cleanQuery = searchPhoneQuery.replace(/\D/g, '');
    if (cleanQuery.length < 7) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number!");
      return;
    }

    setIsSearchingContact(true);
    setFoundContactProfile(null);

    try {
      if (supabase) {
        const found = await fetchProfileByPhone(cleanQuery);
        if (found) {
          // Check if already in our profiles list
          const alreadyExists = profiles.some(p => p.id === found.id);
          if (alreadyExists) {
            Alert.alert("Already Added", `${found.name} is already in your contact list!`);
            setIsSearchingContact(false);
            return;
          }

          setFoundContactProfile({
            id: found.id,
            name: found.name,
            role: found.role || 'Friend 👧',
            avatar: found.avatar_url || '', // use avatar_url if present, else first letter default
            status: 'online',
            statusText: found.bio || 'Active',
            time: 'Just Now',
            unread: 0,
            email: found.email || '',
            phone: found.phone,
            bio: found.bio || '',
            lastUpdated: new Date(found.last_updated).getTime(),
            is_simulated: false
          });
        } else {
          Alert.alert("Not Found", "No user is registered with this phone number on Navi yet.");
        }
      } else {
        Alert.alert("Offline Mode", "Supabase connection is not active. Search is only available online.");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to search for contact.");
    } finally {
      setIsSearchingContact(false);
    }
  };

  const handleConfirmAddFoundContact = () => {
    if (!foundContactProfile) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setProfiles(prev => [foundContactProfile, ...prev]);
    setMessages(prev => ({ ...prev, [foundContactProfile.id]: [] }));

    // Reset states
    setSearchPhoneQuery('');
    setFoundContactProfile(null);
    setAddContactModalVisible(false);
    Alert.alert("Success", `${foundContactProfile.name} added to your chats!`);
  };

  // Scroll to bottom when messages or typing status updates
  useEffect(() => {
    if (chatScrollRef.current) {
      setTimeout(() => {
        chatScrollRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [activeChat, messages, isTyping]);

  const sendFinalTextMessage = async (messageText) => {
    if (!activeChat) return;
    const contactId = activeChat.id;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessageId = `${contactId}_user_${Date.now()}`;

    const newMsg = {
      id: newMessageId,
      text: messageText,
      sender: 'user',
      time: timeStr
    };

    // Add user message
    setMessages(prev => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMsg]
    }));

    // Update profile card info (bring to top of list)
    setProfiles(prev => prev.map(p => 
      p.id === contactId 
        ? { ...p, time: timeStr, lastUpdated: Date.now() } 
        : p
    ));

    setInputText('');
    setSafetyCategory(null);
    setNaviSpeechVisible(false);
    setInterceptedText(null);
    setIsBypassReady(false);

    // Send to Supabase if real user
    if (supabase && !activeChat.is_simulated && currentUser) {
      await sendSupabaseMessage(currentUser.id, contactId, messageText);
    } else {
      // Trigger auto reply if online or away (only for simulated contacts)
      if (activeChat.status !== 'offline') {
        setIsTyping(true);
        
        setTimeout(async () => {
          setIsTyping(false);
          
          let replyText = "";
          const userMsgSafety = checkMessageSafety(messageText, true);

          if (userMsgSafety) {
            // If the child was mean or unsafe, the contact replies with a polite boundary or safe pivot
            if (userMsgSafety === 'TELL_ADULT') {
              replyText = "That doesn't sound safe. We should probably ask a trusted adult about this! 👩";
            } else if (userMsgSafety === 'IGNORE_PIVOT') {
              replyText = "I don't think we should share private info online. What's your favorite video game? 🎮";
            } else {
              replyText = `Please don't call me names. Let's keep our conversation kind and friendly! 😊`;
            }
          } else {
            // Get the default fallback text from the sequential pool
            const contactReplies = autoReplies[contactId] || ["Received! 👍"];
            const currentIdx = replyIndices[contactId] || 0;
            const fallbackText = contactReplies[currentIdx % contactReplies.length];
            
            // Increment reply index
            setReplyIndices(prev => ({
              ...prev,
              [contactId]: (prev[contactId] || 0) + 1
            }));

            // Generate response using local AI model, falling back to static text if needed
            const activeMessages = messages[contactId] || [];
            const currentHistory = [...activeMessages, { text: messageText, sender: 'user' }];
            replyText = await generateContactResponse(activeChat, currentHistory, fallbackText);
          }

          const replyId = `${contactId}_contact_${Date.now()}`;
          
          const replyMsg = {
            id: replyId,
            text: replyText,
            sender: 'contact',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          setMessages(prev => ({
            ...prev,
            [contactId]: [...(prev[contactId] || []), replyMsg]
          }));

          // Update profile card info (bring to top of list)
          setProfiles(prev => prev.map(p => 
            p.id === contactId 
              ? { ...p, time: replyMsg.time, lastUpdated: Date.now() } 
              : p
          ));

          // Scan contact's received message for safety if it's NOT Mommy or Daddy (trusted parents)
          const adultContacts = getAdultContacts();
          const isAdultContact = adultContacts.some(a => a.id === contactId);
          if (contactId !== '4' && contactId !== '5' && !isAdultContact) {
            const replySafety = checkMessageSafety(replyText, false);
            if (replySafety) {
              setSafetyCategory(replySafety);
              setNaviSpeechVisible(true);
              // Increment Parent Insights toxic received count
              setToxicReceivedCount(prev => prev + 1);
              // Add incident to safety log
              const newAlert = {
                id: `alert_${Date.now()}`,
                time: 'Just Now',
                type: 'Received Message Flagged',
                contact: activeChat ? activeChat.name : 'Unknown',
                action: 'Navi Alerted'
              };
              setSafetyAlertsLog(prev => [newAlert, ...prev]);
            }
          }
        }, 1500);
      }
    }
  };

  // Handle message sending
  const sendMessage = () => {
    if (!inputText.trim() || !activeChat) return;

    const messageText = inputText.trim();

    // Check message safety BEFORE sending
    const safety = checkMessageSafety(messageText, true);

    // If it is unsafe, intercept and show Navi safety options
    if (safety) {
      setPendingText(messageText);
      setPendingImage(null);
      setSafetyCategory(safety);
      setNaviSpeechVisible(true);
      // Increment Parent Insights popup count
      setNaviPopupCount(prev => prev + 1);
      // Add incident to safety log
      const newAlert = {
        id: `alert_${Date.now()}`,
        time: 'Just Now',
        type: 'Sent Message Intercepted',
        contact: activeChat ? activeChat.name : 'Unknown',
        action: 'Pending Reconsideration'
      };
      setSafetyAlertsLog(prev => [newAlert, ...prev]);
      return; // Intercept: do not send yet
    }

    sendFinalTextMessage(messageText);
  };

  const triggerSimulationMessage = async (type) => {
    if (!activeChat) return;
    const contactId = activeChat.id;
    setIsTyping(true);

    let replyText = await generateSimulatedMessage(activeChat.name, activeChat.bio, type);

    // Static fallback if model is unavailable
    if (!replyText) {
      if (type === 'good') {
        const staticGoodReplies = [
          "I had so much fun playing badminton with you today! 🏸",
          "That sounds awesome! Let's do it after school! 🌟",
          "Have you seen my new drawing? I can show you tomorrow! 🎨",
          "Let's play some video games after homework is done! 🎮"
        ];
        replyText = staticGoodReplies[Math.floor(Math.random() * staticGoodReplies.length)];
      } else if (type === 'info') {
        const staticInfoReplies = [
          "Where do you live? Can I come over to your house? 🏠",
          "What is your phone number so I can call you? 📞",
          "What school do you go to? Are you home alone? 🏫",
          "What is your email or password for your gaming account? 🔒"
        ];
        replyText = staticInfoReplies[Math.floor(Math.random() * staticInfoReplies.length)];
      } else {
        replyText = "Why do you always fail? 😡";
      }
    }

    setIsTyping(false);

    const replyId = `${contactId}_contact_${Date.now()}`;
    const replyMsg = {
      id: replyId,
      text: replyText,
      sender: 'contact',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), replyMsg]
    }));

    // Update profile card info (bring to top of list)
    setProfiles(prev => prev.map(p => 
      p.id === contactId 
        ? { ...p, time: replyMsg.time, lastUpdated: Date.now() } 
        : p
    ));

    // Scan contact's received message for safety if it's NOT Mommy or Daddy (trusted parents)
    const adultContacts = getAdultContacts();
    const isAdultContact = adultContacts.some(a => a.id === contactId);
    if (contactId !== '4' && contactId !== '5' && !isAdultContact) {
      const replySafety = checkMessageSafety(replyText, false);
      if (replySafety) {
        setSafetyCategory(replySafety);
        setNaviSpeechVisible(true);
        // Increment Parent Insights toxic received count
        setToxicReceivedCount(prev => prev + 1);
        // Add incident to safety log
        const newAlert = {
          id: `alert_${Date.now()}`,
          time: 'Just Now',
          type: 'Received Message Flagged',
          contact: activeChat ? activeChat.name : 'Unknown',
          action: 'Navi Alerted'
        };
        setSafetyAlertsLog(prev => [newAlert, ...prev]);
      }
    }
  };

  const animatedSpeechStyle = {
    opacity: naviAnim,
    transform: [
      {
        scale: naviAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1]
        })
      },
      {
        translateY: naviAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [40, 0]
        })
      }
    ]
  };

  if (isUserLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 12, fontSize: 15, fontWeight: '600', color: '#475569' }}>Loading Navi Profile...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60, flexGrow: 1, justifyContent: 'center' }} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Image 
                source={require('./assets/navi_thumbs_up.png')} 
                style={{ width: 90, height: 90, resizeMode: 'contain', marginBottom: 10 }} 
              />
              <Text style={{ fontSize: 26, fontWeight: '900', color: '#1E3A8A', textAlign: 'center' }}>Welcome to Navi! 🛡️</Text>
              <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 6, paddingHorizontal: 12 }}>
                Navi is your online safety buddy. Let's create your profile to start chatting with friends safely!
              </Text>
            </View>

            <View style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6 }}>Your Name *</Text>
              <TextInput
                style={{
                  height: 46,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  paddingHorizontal: 16,
                  fontSize: 15,
                  color: '#1E293B',
                  marginBottom: 14,
                  backgroundColor: '#F8FAFC'
                }}
                placeholder="Enter your name (e.g. Pari)"
                placeholderTextColor="#94A3B8"
                value={regName}
                onChangeText={setRegName}
              />

              <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6 }}>Phone Number *</Text>
              <TextInput
                style={{
                  height: 46,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  paddingHorizontal: 16,
                  fontSize: 15,
                  color: '#1E293B',
                  marginBottom: 14,
                  backgroundColor: '#F8FAFC'
                }}
                placeholder="Enter phone number (e.g. 555-0199)"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={regPhone}
                onChangeText={setRegPhone}
              />

              <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6 }}>Account Type</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {['Kid', 'Parent', 'Support'].map((role) => {
                  const isSelected = regRole === role;
                  let activeBgColor = '#DBEAFE'; // light blue
                  let activeBorderColor = '#3B82F6';
                  let activeTextColor = '#1E40AF';
                  
                  if (role === 'Parent') {
                    activeBgColor = '#DCFCE7'; // light green
                    activeBorderColor = '#22C55E';
                    activeTextColor = '#15803D';
                  } else if (role === 'Support') {
                    activeBgColor = '#FEE2E2'; // light red
                    activeBorderColor = '#EF4444';
                    activeTextColor = '#B91C1C';
                  }
                  
                  return (
                    <TouchableOpacity
                      key={role}
                      style={{
                        flex: 1,
                        height: 42,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isSelected ? activeBorderColor : '#E2E8F0',
                        backgroundColor: isSelected ? activeBgColor : '#FFFFFF',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                      onPress={() => setRegRole(role)}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isSelected ? activeTextColor : '#475569' }}>
                        {role}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {(regRole === 'Parent' || regRole === 'Support') && (
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6 }}>
                    Are you 18 or above? *
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        height: 42,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isAbove18 === true ? '#22C55E' : '#E2E8F0',
                        backgroundColor: isAbove18 === true ? '#DCFCE7' : '#FFFFFF',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                      onPress={() => setIsAbove18(true)}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isAbove18 === true ? '#15803D' : '#475569' }}>
                        Yes (18+)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        flex: 1,
                        height: 42,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isAbove18 === false ? '#EF4444' : '#E2E8F0',
                        backgroundColor: isAbove18 === false ? '#FEE2E2' : '#FFFFFF',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                      onPress={() => setIsAbove18(false)}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isAbove18 === false ? '#B91C1C' : '#475569' }}>
                        No (Under 18)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6 }}>Short Bio</Text>
              <TextInput
                style={{
                  height: 46,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  paddingHorizontal: 16,
                  fontSize: 15,
                  color: '#1E293B',
                  marginBottom: 20,
                  backgroundColor: '#F8FAFC'
                }}
                placeholder="Loves painting and coding! 🎨💻"
                placeholderTextColor="#94A3B8"
                value={regBio}
                onChangeText={setRegBio}
              />

              <TouchableOpacity 
                style={{
                  height: 48,
                  backgroundColor: '#2563EB',
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                  elevation: 2
                }} 
                onPress={handleRegisterUser}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Start Using Navi 🛡️</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const isAdultBg = isCurrentUserAdult();
  const isSupport = currentUser && (currentUser.role || '').toLowerCase().includes('support');
  const bgThemeColor = isSupport ? '#FEE2E2' : isAdultBg ? '#C8FFC2' : '#E6F0FA';

  return (
    <View style={[styles.safeArea, { backgroundColor: bgThemeColor }]}>
      <StatusBar barStyle="dark-content" backgroundColor={bgThemeColor} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {activeChat ? (
          /* Chat Window Screen */
          <View style={[styles.container, { backgroundColor: bgThemeColor }]}>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setActiveChat(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.chatHeaderProfile}
                onPress={() => setSelectedProfile(activeChat)}
                activeOpacity={0.7}
              >
                <RenderAvatar name={activeChat.name} avatar={activeChat.avatar} style={styles.chatHeaderAvatar} />
                <View style={styles.chatHeaderDetails}>
                  <Text style={styles.chatHeaderName}>{activeChat.name}</Text>
                  <Text style={styles.chatHeaderStatus}>
                    {activeChat.status === 'online' ? 'Online' : 
                     activeChat.status === 'away' ? 'Away' : 'Offline'}
                  </Text>
                </View>
              </TouchableOpacity>


            </View>



            {/* Chat Messages */}
            <ScrollView 
              ref={chatScrollRef}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
            >
              {/* Center Date Separator Oval */}
              <View style={styles.dateSeparatorWrapper}>
                <View style={styles.dateSeparatorOval}>
                  <Text style={styles.dateSeparatorText}>Today</Text>
                </View>
              </View>

               {messages[activeChat.id]
                ?.filter((msg) => !msg.text || (!msg.text.startsWith('__SYSTEM_INTERVENTION__') && !msg.text.startsWith('__CALL_')))
                ?.map((msg) => (
                <View 
                  key={msg.id} 
                  style={[
                    styles.msgBubbleWrapper,
                    msg.sender === 'user' ? styles.msgSentWrapper : styles.msgReceivedWrapper
                  ]}
                >
                  <View 
                    style={[
                      styles.msgBubble,
                      msg.sender === 'user' ? styles.msgBubbleSent : styles.msgBubbleReceived
                    ]}
                  >
                    {msg.image && (
                      <Image 
                        source={{ uri: msg.image }} 
                        style={styles.msgImage} 
                        resizeMode="cover"
                      />
                    )}
                    {msg.text ? (
                      <Text style={[
                        styles.msgText,
                        msg.sender === 'user' ? styles.msgTextSent : styles.msgTextReceived
                      ]}>
                        {msg.text}
                      </Text>
                    ) : null}
                    <Text style={[
                      styles.msgTime,
                      msg.sender === 'user' ? styles.msgTimeSent : styles.msgTimeReceived
                    ]}>
                      {msg.time}
                    </Text>
                  </View>
                </View>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <View style={[styles.msgBubbleWrapper, styles.msgReceivedWrapper]}>
                  <View style={[styles.msgBubble, styles.msgBubbleReceived, styles.typingBubble]}>
                    <Text style={styles.typingText}>typing...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Chat Input Bar */}
            <View style={styles.inputBar}>
              <TouchableOpacity 
                style={styles.imageAttachBtn} 
                onPress={sendMockImagePrompt}
                activeOpacity={0.7}
                disabled={isAnalyzingImage}
              >
                {isAnalyzingImage ? (
                  <ActivityIndicator size="small" color="#4F46E5" />
                ) : (
                  <Text style={styles.imageAttachText}>📷</Text>
                )}
              </TouchableOpacity>
              
              <TextInput
                style={styles.chatInput}
                placeholder="Type a message..."
                placeholderTextColor="#6F6D83"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity 
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
                onPress={sendMessage}
                disabled={!inputText.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
            {/* Navi Safety Buddy Floating Widget - Pops up only on mean/unsafe messages */}
            {safetyCategory !== null && (
              <View style={styles.naviContainer}>
                {/* Speech Bubble */}
                <Animated.View 
                  pointerEvents={naviSpeechVisible ? 'auto' : 'none'} 
                  style={[styles.naviSpeechBubble, animatedSpeechStyle]}
                >
                  {naviFeedbackMessage ? (
                    <>
                      <Text style={styles.naviSpeechTitle}>Success!</Text>
                      <Text style={styles.naviSpeechText}>{naviFeedbackMessage}</Text>
                    </>
                  ) : suggestionsVisible ? (
                    <>
                      <Text style={styles.naviSpeechTitle}>💬 Choose a reply (3):</Text>
                      {isGeneratingSuggestions ? (
                        <ActivityIndicator size="small" color="#1D4ED8" style={{ marginVertical: 8 }} />
                      ) : (
                        <>
                          <ScrollView 
                            style={{ maxHeight: 130, width: '100%' }} 
                            contentContainerStyle={{ paddingBottom: 2 }}
                            showsVerticalScrollIndicator={true}
                          >
                            {politeSuggestions.map((suggestion, idx) => (
                              <TouchableOpacity 
                                key={idx}
                                style={styles.naviOptionBtn}
                                onPress={() => {
                                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                  handleSelectPoliteSuggestion(suggestion);
                                }}
                              >
                                <Text style={styles.naviOptionText}>{suggestion}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                          <TouchableOpacity 
                            style={[styles.naviOptionBtn, { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB', marginTop: 4 }]}
                            onPress={() => {
                              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                              setNaviMascotImageState('serious');
                              setSuggestionsVisible(false);
                              setPoliteSuggestions([]);
                            }}
                          >
                            <Text style={[styles.naviOptionText, { color: '#4B5563' }]}>⬅️ Back</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Text style={styles.naviSpeechTitle}>
                        {pendingText || pendingImage ? "🛡️ Reconsider Choice" : "🛡️ Navi Safety Alert"}
                      </Text>
                      <Text style={styles.naviSpeechText}>
                        {pendingImage 
                          ? "This image looks mean. Reconsider sending?"
                          : pendingText 
                            ? (safetyCategory === 'IGNORE_PIVOT' 
                                ? "This contains personal info. Reconsider sending?"
                                : "This message looks mean. Reconsider sending?")
                            : (safetyCategory === 'IGNORE_PIVOT'
                                ? "This person is asking for personal info. How should we reply?"
                                : safetyCategory === 'TELL_ADULT'
                                  ? "This message might not be safe. How should we reply?"
                                  : "That message looks mean. How should we reply?")}
                      </Text>
                      
                      {/* Safety Options */}
                      <TouchableOpacity 
                        style={styles.naviOptionBtn}
                        onPress={handleIgnoreAndSend}
                      >
                        <Text style={styles.naviOptionText}>
                          {pendingText || pendingImage ? "🔀 Send anyway" : "❌ Dismiss"}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.naviOptionBtn}
                        onPress={handleListenToSuggestions}
                      >
                        <Text style={styles.naviOptionText}>
                          {pendingText || pendingImage ? "💬 See suggestions (3)" : "💬 Reply politely (3)"}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.naviOptionBtn, styles.naviOptionBtnAlert]}
                        onPress={handleNaviTellAdult}
                      >
                        <Text style={[styles.naviOptionText, styles.naviOptionTextAlert]}>❤️ Tell an adult</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Navi Feedback Rating Widget */}
                  {naviFeedbackMessage && (
                    <View style={styles.naviRatingContainer}>
                      {naviRating === null ? (
                        <>
                          <Text style={styles.naviRatingText}>Rate Navi's advice:</Text>
                          <View style={styles.naviRatingRow}>
                            <TouchableOpacity 
                              style={styles.naviRatingBtn} 
                              onPress={() => {
                                setNaviRating('up');
                                Alert.alert("Thank you! 👍", "Navi is happy to help!");
                              }}
                            >
                              <Text style={styles.naviRatingIcon}>👍</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.naviRatingBtn} 
                              onPress={() => {
                                setNaviRating('down');
                                Alert.alert("Thank you! 👎", "Navi will try to learn and give better tips next time!");
                              }}
                            >
                              <Text style={styles.naviRatingIcon}>👎</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      ) : (
                        <Text style={styles.naviRatingFeedback}>Thanks for rating! 🌟</Text>
                      )}
                    </View>
                  )}
                </Animated.View>

                {/* Navi Mascot Trigger Button */}
                <Animated.View
                  style={{
                    transform: [
                      {
                        scale: naviMascotAnim
                      },
                      {
                        translateY: naviMascotAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [100, 0]
                        })
                      }
                    ],
                    opacity: naviMascotAnim
                  }}
                >
                  <TouchableOpacity 
                    style={styles.naviTrigger}
                    onPress={() => setNaviSpeechVisible(prev => !prev)}
                    activeOpacity={0.8}
                  >
                    <Image 
                      source={naviMascotImageState === 'thumbs_up' ? require('./assets/navi_thumbs_up.png') : require('./assets/navi_serious.png')} 
                      style={styles.naviMascotImage} 
                    />
                    {/* Visual badge/notification on Navi */}
                    {!naviSpeechVisible && (
                      <View style={styles.naviAlertBadge}>
                        <Text style={styles.naviAlertText}>?</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>
            )}
          </View>
        ) : (
          /* Main Tab Screen */
          <View style={[styles.container, { backgroundColor: bgThemeColor }]}>
            {activeTab === 'support_inbox' && isSupport && renderSupportInbox()}

            {activeTab === 'chats' && !isSupport && (
              <>
                {/* Header */}
                <View style={styles.headerVertical}>
                  <View style={styles.headerTopRow}>
                    <TouchableOpacity 
                      style={styles.threeDotsButton}
                      onPress={() => setMenuVisible(prev => !prev)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.threeDotsText}>•••</Text>
                    </TouchableOpacity>
                    
                    {/* Top Right Action Circles */}
                    <View style={styles.headerTopRightActions}>
                      <TouchableOpacity 
                        style={styles.headerTopCircleBtn}
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setAddContactModalVisible(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.headerTopCircleText}>＋</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.headerBottomRow}>
                    <Text style={styles.headerTitle}>Chats</Text>
                    <Image 
                      source={require('./assets/navi_thumbs_up.png')} 
                      style={{ width: 54, height: 54, resizeMode: 'contain', marginRight: 4 }} 
                    />
                  </View>
                </View>

                {/* Unified Top Controls Block (Smushed Together, White Background) */}
                <View style={[styles.topControlsBlock, { backgroundColor: bgThemeColor }]}>
                  {/* Search Bar */}
                  <View style={styles.searchContainer}>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="🔍 Find people"
                      placeholderTextColor="#6F6D83"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                </View>

                {/* Profiles List */}
                <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollContent}>
                  {filteredProfiles.length > 0 ? (
                    filteredProfiles.map(profile => {
                      const isSelected = selectedChatIds.includes(profile.id);
                      const isSupport = (profile.role || '').toLowerCase().includes('support');
                      return (
                        <TouchableOpacity
                          key={profile.id}
                          style={[
                            styles.profileCard,
                            isSupport && { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
                            selectModeActive && isSelected && styles.profileCardSelected
                          ]}
                          onPress={() => {
                            if (selectModeActive) {
                              toggleChatSelection(profile.id);
                            } else {
                              openChat(profile);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          {/* Checkbox circle when in select mode */}
                          {selectModeActive && (
                            <View style={[
                              styles.selectCheckbox,
                              isSelected && styles.selectCheckboxChecked
                            ]}>
                              {isSelected && <Text style={styles.selectCheckboxText}>✓</Text>}
                            </View>
                          )}

                          {/* Avatar without Status Ring */}
                          <View style={styles.avatarWrapper}>
                            <RenderAvatar name={profile.name} avatar={profile.avatar} style={styles.avatarImage} />
                          </View>

                          {/* Profile Details */}
                          <View style={styles.cardInfo}>
                            <View style={styles.cardHeader}>
                              <Text style={styles.profileName}>{profile.name}</Text>
                              <Text style={styles.timeText}>{profile.time}</Text>
                            </View>
                            <Text style={styles.profileRole}>{profile.role}</Text>
                            
                            {/* Show last message from state */}
                            <Text style={styles.lastMessageText} numberOfLines={1}>
                              {messages[profile.id]?.[messages[profile.id].length - 1]?.text || 'No messages yet'}
                            </Text>
                          </View>

                          {/* Unread Counter Badge */}
                          {profile.unread > 0 && (
                            <View style={styles.unreadBadge}>
                              <Text style={styles.unreadBadgeText}>{profile.unread}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No profiles found matching your search</Text>
                    </View>
                  )}
                </ScrollView>
              </>
            )}



            {activeTab === 'dashboard' && isCurrentUserAdult() && !isSupport && renderDashboardScreen()}

            {activeTab === 'resources' && renderResourcesScreen()}

            {activeTab === 'kids_page' && !isCurrentUserAdult() && renderKidsPage()}

            {activeTab === 'safety' && renderSafetyScreen()}

            {activeTab === 'profile' && renderProfileScreen()}

            {/* Bottom Tab Bar */}
            {renderTabBar()}
          </View>
        )}

        {/* Profile Detail Modal */}
        <Modal
          visible={selectedProfile !== null}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedProfile(null)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View 
              style={[
                styles.modalContainer,
                { transform: [{ translateY }] }
              ]}
            >
              {selectedProfile && (
                <>
                  {/* Floating Top Right Calling Oval */}
                  <View style={styles.modalCallingOval}>
                    <TouchableOpacity 
                      style={styles.modalCallingIconBtn}
                      onPress={() => { setSelectedProfile(null); startCallWithProfile(selectedProfile, 'video'); }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalCallingIconText}>📹</Text>
                    </TouchableOpacity>
                    <View style={styles.modalCallingDivider} />
                    <TouchableOpacity 
                      style={styles.modalCallingIconBtn}
                      onPress={() => { setSelectedProfile(null); startCallWithProfile(selectedProfile, 'voice'); }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalCallingIconText}>📞</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Top drag handle area triggers swipe down */}
                  <View 
                    style={styles.dragHandleArea} 
                    {...panResponder.panHandlers}
                  >
                    <View style={styles.modalDragHandle} />
                  </View>

                  <ScrollView style={styles.modalScroll}>
                    {/* Top profile header in Modal also responds to pan gestures */}
                    <View 
                      style={styles.modalProfileHeader}
                      {...panResponder.panHandlers}
                    >
                      <TouchableOpacity 
                        style={styles.modalAvatarWrapper}
                        onPress={() => setSelectedProfile(null)}
                        activeOpacity={0.8}
                      >
                        <RenderAvatar name={selectedProfile.name} avatar={selectedProfile.avatar} style={styles.modalAvatarImage} />
                      </TouchableOpacity>
                      <Text style={styles.modalName}>{selectedProfile.name}</Text>
                      <Text style={styles.modalRole}>{selectedProfile.role}</Text>
                      
                      <View style={styles.modalStatusTextWrapper}>
                        <Text style={styles.modalStatusText}>"{selectedProfile.statusText}"</Text>
                      </View>
                    </View>

                    {/* Bio Section */}
                    <View style={styles.infoSection}>
                      <Text style={styles.sectionLabel}>About</Text>
                      <Text style={styles.sectionValue}>{selectedProfile.bio}</Text>
                    </View>

                    {/* Contact Info */}
                    <View style={styles.infoSection}>
                      <Text style={styles.sectionLabel}>Email</Text>
                      <Text style={styles.sectionValue}>{selectedProfile.email}</Text>
                    </View>

                    <View style={styles.infoSection}>
                      <Text style={styles.sectionLabel}>Phone</Text>
                      <Text style={styles.sectionValue}>{selectedProfile.phone}</Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.modalActions}>
                      <TouchableOpacity 
                        style={styles.actionBtnPrimary} 
                        onPress={() => openChat(selectedProfile)}
                      >
                        <Text style={styles.actionBtnPrimaryText}>Send Message</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.actionBtnSecondary} 
                        onPress={() => setSelectedProfile(null)}
                      >
                        <Text style={styles.actionBtnSecondaryText}>Close Details</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </>
              )}
            </Animated.View>
          </View>
        </Modal>

        {/* Mock Call Overlay */}
        <Modal
          visible={activeCall !== null}
          animationType="slide"
          transparent={false}
          onRequestClose={() => endCall()}
        >
          <View style={styles.fullscreenCallContainer}>
            {callStatus === 'connected' && activeCall && !(
              !activeCall.contactId || 
              activeCall.contactId === '4' || 
              activeCall.contactId === '5' || 
              activeCall.contactId === 'trusted_adult'
            ) ? (
              <View style={{ flex: 1, width: '100%', height: '100%' }}>
                <WebView
                  source={{ uri: `https://meet.jit.si/NaviSecureCall_${[currentUser?.id, activeCall?.contactId].sort().join('_')}#config.startWithVideoMuted=${activeCall?.type === 'voice'}&config.startWithAudioMuted=false` }}
                  style={{ flex: 1 }}
                  originWhitelist={['*']}
                  mediaPlaybackRequiresUserAction={false}
                  allowsInlineMediaPlayback={true}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  userAgent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36"
                />
                
                {/* Floating In-App End Call button at the bottom */}
                <View style={{
                  position: 'absolute',
                  bottom: 24,
                  left: 0,
                  right: 0,
                  alignItems: 'center',
                  zIndex: 20000
                }}>
                  <TouchableOpacity 
                    style={styles.endCallCircularBtn}
                    onPress={() => endCall()}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.endCallEmoji}>📞</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {/* Background for Video Call */}
                {activeCall?.type === 'video' && !isVideoOff && (
                  <View style={styles.callVideoBackground}>
                    <View style={styles.simulatedVideoPlaceholder}>
                      <Text style={styles.simulatedVideoEmoji}>🧑‍💻</Text>
                      <Text style={styles.simulatedVideoText}>Simulated Video Feed</Text>
                    </View>
                  </View>
                )}

                {/* Top Bar: Status, Name, Timer */}
                <SafeAreaView style={styles.callHeaderArea}>
                  <View style={styles.callHeaderContent}>
                    <View style={styles.callSecurePill}>
                      <Text style={styles.callSecurePillText}>🛡️ Secured by Navi</Text>
                    </View>
                    <Text style={styles.callContactNameText}>{activeCall?.contactName}</Text>
                    <Text style={styles.callStatusText}>
                      {callStatus === 'ringing' ? 'Ringing...' : 'Connected'}
                    </Text>
                    {callStatus === 'connected' && (
                      <Text style={styles.callTimerText}>{formatCallTime(callTimer)}</Text>
                    )}
                  </View>
                </SafeAreaView>

                {/* Center Area (Audio Call or Video Call when video is disabled) */}
                {(activeCall?.type === 'voice' || (activeCall?.type === 'video' && isVideoOff)) && (
                  <View style={styles.callCenterArea}>
                    <View style={styles.pulseContainer}>
                      {/* Glowing Pulse Rings */}
                      <View style={[styles.pulseRing, { width: 160, height: 160, borderRadius: 80, opacity: 0.15 }]} />
                      <View style={[styles.pulseRing, { width: 200, height: 200, borderRadius: 100, opacity: 0.08 }]} />
                      
                      {/* Large Avatar */}
                      <View style={styles.largeCallAvatar}>
                        <Text style={styles.largeCallAvatarText}>
                          {activeCall?.contactName ? activeCall.contactName.charAt(0).toUpperCase() : '?'}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.audioCallingIndicator}>
                      {callStatus === 'ringing' ? '☎️ Dialing secure line...' : '🔊 Audio Active'}
                    </Text>
                  </View>
                )}

                {/* Picture-in-Picture (PiP) user camera preview (Video calls only) */}
                {activeCall?.type === 'video' && (
                  <View style={styles.userPipPreview}>
                    {isVideoOff ? (
                      <View style={styles.pipVideoOff}>
                        <Text style={{ fontSize: 16 }}>🔇</Text>
                        <Text style={styles.pipText}>Video Off</Text>
                      </View>
                    ) : (
                      <View style={styles.pipVideoOn}>
                        <Text style={styles.pipEmoji}>🧒</Text>
                        <Text style={styles.pipLabel}>You</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Bottom Controls Floating Container */}
                <View style={styles.callControlsContainer}>
                  <View style={styles.callControlsRow}>
                    {/* Mute button */}
                    <TouchableOpacity 
                      style={[styles.callBtnRound, isMuted && styles.callBtnActive]}
                      onPress={() => setIsMuted(!isMuted)}
                    >
                      <Text style={styles.callBtnEmoji}>{isMuted ? '🔇' : '🎙️'}</Text>
                      <Text style={styles.callBtnLabel}>Mute</Text>
                    </TouchableOpacity>

                    {/* Speaker button */}
                    <TouchableOpacity 
                      style={[styles.callBtnRound, isSpeaker && styles.callBtnActive]}
                      onPress={() => setIsSpeaker(!isSpeaker)}
                    >
                      <Text style={styles.callBtnEmoji}>{isSpeaker ? '🔈' : '🔊'}</Text>
                      <Text style={styles.callBtnLabel}>Speaker</Text>
                    </TouchableOpacity>

                    {/* Video Call Camera Switch toggle */}
                    {activeCall?.type === 'video' && (
                      <TouchableOpacity 
                        style={[styles.callBtnRound, isVideoOff && styles.callBtnActive]}
                        onPress={() => setIsVideoOff(!isVideoOff)}
                      >
                        <Text style={styles.callBtnEmoji}>{isVideoOff ? '📹' : '📷'}</Text>
                        <Text style={styles.callBtnLabel}>Camera</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* End Call Button */}
                  <TouchableOpacity 
                    style={styles.endCallCircularBtn}
                    onPress={() => endCall()}
                  >
                    <Text style={styles.endCallEmoji}>📞</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </Modal>

        {/* Incoming Call Overlay */}
        <Modal
          visible={incomingCall !== null}
          animationType="fade"
          transparent={true}
          onRequestClose={() => declineCall()}
        >
          <View style={styles.incomingCallOverlay}>
            <View style={styles.incomingCallCard}>
              <View style={styles.incomingCallMascotIcon}>
                <Text style={{ fontSize: 40 }}>📞</Text>
              </View>
              <Text style={styles.incomingCallTitle}>
                {incomingCall?.type === 'video' ? 'INCOMING VIDEO CALL' : 'INCOMING AUDIO CALL'}
              </Text>
              <Text style={styles.incomingCallName}>{incomingCall?.senderName}</Text>
              <Text style={styles.incomingCallSub}>Navi has verified this connection as safe 🛡️</Text>
              
              <View style={styles.incomingCallActionsRow}>
                {/* Decline Button container */}
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <TouchableOpacity 
                    style={[styles.incomingCallRoundBtn, { backgroundColor: '#EF4444' }]}
                    onPress={declineCall}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.callActionEmoji, { transform: [{ rotate: '135deg' }] }]}>📞</Text>
                  </TouchableOpacity>
                  <Text style={styles.callActionLabelText}>Decline</Text>
                </View>

                {/* Accept Button container */}
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <TouchableOpacity 
                    style={[styles.incomingCallRoundBtn, { backgroundColor: '#10B981' }]}
                    onPress={acceptCall}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.callActionEmoji}>📞</Text>
                  </TouchableOpacity>
                  <Text style={styles.callActionLabelText}>Accept</Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Trusted Adult Modal Overlay */}
        <Modal
          visible={adultAlertVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setAdultAlertVisible(false)}
        >
          <View style={styles.adultAlertOverlay}>
            <View style={styles.adultAlertContainer}>
              <Text style={styles.adultAlertHeader}>🛡️ Talk to a Trusted Adult</Text>
              <Text style={styles.adultAlertBody}>
                If someone says something online that makes you feel uncomfortable, worried, or sad, you should always tell an adult you trust (like Mom, Dad, a grandparent, or a teacher).
              </Text>
              <Text style={styles.adultAlertSub}>
                Would you like to send a quick safety report message to your trusted adult contact right now to check in?
              </Text>
              
              <View style={styles.adultAlertActions}>
                {getAdultContacts().map(adult => (
                  <TouchableOpacity 
                    key={adult.id}
                    style={[styles.adultAlertBtnPrimary, { backgroundColor: '#2563EB', marginBottom: 8 }]} 
                    onPress={() => {
                      setAdultAlertVisible(false);
                      sendReportToAdult(adult.id);
                      openChat(adult);
                    }}
                  >
                    <Text style={styles.adultAlertBtnPrimaryText}>
                      Message {adult.name} ({adult.role || 'Adult'}) 🛡️
                    </Text>
                  </TouchableOpacity>
                ))}
                
                {getAdultContacts().length === 0 && (
                  <TouchableOpacity 
                    style={[styles.adultAlertBtnPrimary, { backgroundColor: '#10B981', marginBottom: 8 }]} 
                    onPress={() => {
                      setAdultAlertVisible(false);
                      setAddAdultModalVisible(true);
                    }}
                  >
                    <Text style={styles.adultAlertBtnPrimaryText}>+ Add Trusted Adult Contact</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={styles.adultAlertBtnSecondary} 
                  onPress={() => setAdultAlertVisible(false)}
                >
                  <Text style={styles.adultAlertBtnSecondaryText}>Got it, close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Trusted Adult Modal */}
        <Modal
          visible={addAdultModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setAddAdultModalVisible(false);
          }}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <TouchableWithoutFeedback onPress={() => {
              Keyboard.dismiss();
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setAddAdultModalVisible(false);
            }}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View style={[styles.modalContainer, { padding: 24, paddingBottom: 8 }]}>
                    <View style={styles.dragHandleArea}>
                      <View style={styles.modalDragHandle} />
                    </View>
                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                      <Text style={{ fontSize: 20, fontWeight: '800', marginBottom: 6, color: '#1E3A8A', textAlign: 'center' }}>
                        🛡️ Add a Trusted Adult
                      </Text>
                      <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 20, textAlign: 'center', paddingHorizontal: 10 }}>
                        This is the adult you can contact immediately if someone makes you feel uncomfortable or unsafe online.
                      </Text>

                      <Text style={styles.inputLabel}>Adult's Name</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="e.g. Aunt Sarah, Coach Dave"
                        placeholderTextColor="#94A3B8"
                        value={adultName}
                        onChangeText={setAdultName}
                      />

                      <Text style={styles.inputLabel}>Phone Number</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="e.g. 555-0199"
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                        value={adultPhone}
                        onChangeText={setAdultPhone}
                      />

                      <Text style={styles.inputLabel}>Relationship</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="e.g. Aunt, Teacher, Grandma"
                        placeholderTextColor="#94A3B8"
                        value={adultRelation}
                        onChangeText={setAdultRelation}
                      />

                      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                        <TouchableOpacity 
                          style={[styles.modalBtn, { flex: 1, backgroundColor: '#F1F5F9', height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 12 }]}
                          onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setAddAdultModalVisible(false);
                          }}
                        >
                          <Text style={[styles.modalBtnText, { color: '#64748B' }]}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.modalBtn, { flex: 1, backgroundColor: '#2563EB', height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 12 }]}
                          onPress={() => handleSaveTrustedAdult(adultName, adultPhone, adultRelation)}
                        >
                          <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>

        {/* Add Contact Modal */}
        <Modal
          visible={addContactModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setAddContactModalVisible(false);
          }}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <TouchableWithoutFeedback onPress={() => {
              Keyboard.dismiss();
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setAddContactModalVisible(false);
            }}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View style={[styles.modalContainer, { padding: 24, paddingBottom: 8 }]}>
                    {/* Drag Handle to make it consistent with bottom sheet style */}
                    <View style={styles.dragHandleArea}>
                      <View style={styles.modalDragHandle} />
                    </View>
                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                      <Text style={{ fontSize: 20, fontWeight: '800', marginBottom: 20, color: '#1E3A8A', textAlign: 'center' }}>
                        ➕ Add Contact by Phone Number
                      </Text>
                      
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6 }}>Search by Phone Number *</Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                        <TextInput
                          style={[styles.chatInput, { flex: 1, height: 44, marginRight: 0 }]}
                          placeholder="Enter phone number (e.g. 555-0199)"
                          placeholderTextColor="#6F6D83"
                          keyboardType="phone-pad"
                          value={searchPhoneQuery}
                          onChangeText={setSearchPhoneQuery}
                        />
                        <TouchableOpacity 
                          style={[styles.sendButton, { width: 50, height: 44, paddingHorizontal: 0, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' }]} 
                          onPress={handleSearchContactByPhone}
                        >
                          {isSearchingContact ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={{ fontSize: 18 }}>🔍</Text>
                          )}
                        </TouchableOpacity>
                      </View>

                      {foundContactProfile && (
                        <View style={{ backgroundColor: '#EFF6FF', padding: 16, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#3B82F6', marginBottom: 20 }}>
                          <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E3A8A', marginBottom: 8 }}>Found User! ✅</Text>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>Name: {foundContactProfile.name}</Text>
                          <Text style={{ fontSize: 13, color: '#475569' }}>Role: {foundContactProfile.role}</Text>
                          <Text style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic', marginTop: 4 }}>"{foundContactProfile.bio}"</Text>
                        </View>
                      )}

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
                        <TouchableOpacity 
                          style={[styles.actionBtnSecondary, { flex: 1, height: 48 }]} 
                          onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setSearchPhoneQuery('');
                            setFoundContactProfile(null);
                            setAddContactModalVisible(false);
                          }}
                        >
                          <Text style={styles.actionBtnSecondaryText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.sendButton, { flex: 1, height: 48, backgroundColor: foundContactProfile ? '#10B981' : '#94A3B8' }]} 
                          onPress={handleConfirmAddFoundContact}
                          disabled={!foundContactProfile}
                        >
                          <Text style={styles.sendButtonText}>Add to Chats</Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>

        {/* Menu Options Popover */}
        {menuVisible && (
          <TouchableOpacity 
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          >
            <View style={styles.menuDropdown}>
              {/* Select Chats Item */}
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleToggleSelectMode}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircleWrapper}>
                  <View style={styles.menuCircle}>
                    <Text style={styles.menuCheckMark}>✓</Text>
                  </View>
                </View>
                <Text style={styles.menuItemText}>Select chats</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.menuDivider} />

              {/* Read All Item */}
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleReadAll}
                activeOpacity={0.7}
              >
                <View style={styles.iconMessageWrapper}>
                  <View style={styles.customBubble}>
                    <View style={styles.customBubbleTail} />
                    <Text style={styles.customBubbleCheckMark}>✓</Text>
                  </View>
                </View>
                <Text style={styles.menuItemText}>Read all</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Select Mode Bottom Actions Bar */}
        {selectModeActive && (
          <View style={styles.selectActionsBar}>
            <Text style={styles.selectCountText}>
              {selectedChatIds.length} chat{selectedChatIds.length !== 1 ? 's' : ''} selected
            </Text>
            
            <View style={styles.selectActionsGroup}>
              <TouchableOpacity 
                style={[
                  styles.selectActionCircle, 
                  { backgroundColor: '#3B82F6' },
                  selectedChatIds.length === 0 && styles.selectActionBtnDisabled
                ]}
                onPress={handleMarkReadSelected}
                disabled={selectedChatIds.length === 0}
                activeOpacity={0.7}
              >
                <Text style={styles.selectActionCircleText}>Read</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.selectActionCircle, 
                  { backgroundColor: '#EF4444' },
                  selectedChatIds.length === 0 && styles.selectActionBtnDisabled
                ]}
                onPress={handleDeleteSelected}
                disabled={selectedChatIds.length === 0}
                activeOpacity={0.7}
              >
                <Text style={styles.selectActionCircleText}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.selectActionCircle, { backgroundColor: '#64748B' }]}
                onPress={() => setSelectModeActive(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.selectActionCircleText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E6F0FA',
    paddingTop: Platform.OS === 'ios' ? 47 : 0,
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#E6F0FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  unreadTotalBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  unreadTotalText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  topControlsBlock: {
    backgroundColor: '#E6F0FA',
    paddingVertical: 10,
    marginTop: 0,
    marginBottom: 0,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  searchInput: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 0,
    marginVertical: 0,
    color: '#0F172A',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterRow: {
    paddingHorizontal: 24,
    height: 30,
    marginTop: 0,
    marginBottom: 0,
    overflow: 'hidden',
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  filterChipTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 110,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E2E8F0',
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  statusOnline: {
    backgroundColor: '#10B981',
  },
  statusAway: {
    backgroundColor: '#F59E0B',
  },
  statusOffline: {
    backgroundColor: '#94A3B8',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
  },
  profileRole: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
  lastMessageText: {
    fontSize: 14,
    color: '#475569',
    marginTop: 6,
  },
  unreadBadge: {
    backgroundColor: '#3B82F6',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
    textAlign: 'center',
  },
  /* Chat Header Styles */
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '600',
  },
  chatHeaderProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatHeaderAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E2E8F0',
  },
  chatHeaderDetails: {
    marginLeft: 12,
  },
  chatHeaderName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  chatHeaderStatus: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  /* Messages List Styles */
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  msgBubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    width: '100%',
  },
  msgSentWrapper: {
    justifyContent: 'flex-end',
  },
  msgReceivedWrapper: {
    justifyContent: 'flex-start',
  },
  msgBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  msgBubbleSent: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  msgBubbleReceived: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  typingBubble: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 20,
  },
  msgTextSent: {
    color: '#FFFFFF',
  },
  msgTextReceived: {
    color: '#0F172A',
  },
  typingText: {
    color: '#64748B',
    fontSize: 14,
    fontStyle: 'italic',
  },
  msgTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  msgTimeSent: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  msgTimeReceived: {
    color: '#64748B',
  },
  /* Chat Input Bar Styles */
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    zIndex: 10,
    elevation: 10,
  },
  chatInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 20,
    color: '#0F172A',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  imageAttachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 10,
  },
  imageAttachText: {
    fontSize: 18,
  },
  msgImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  archivedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 28,
    paddingVertical: 0,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  archivedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  archivedIcon: {
    fontSize: 18,
    marginRight: 12,
    color: '#64748B',
  },
  archivedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  archivedCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  /* Modal Overlay Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    minHeight: '50%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dragHandleArea: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modalDragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalScroll: {
    paddingHorizontal: 24,
  },
  modalProfileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalAvatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  modalAvatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E2E8F0',
  },
  modalStatusDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  modalName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalRole: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 4,
  },
  modalStatusTextWrapper: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalStatusText: {
    color: '#475569',
    fontSize: 14,
    fontStyle: 'italic',
  },
  infoSection: {
    marginTop: 20,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  sectionValue: {
    fontSize: 15,
    color: '#0F172A',
    lineHeight: 22,
  },
  modalActions: {
    marginTop: 30,
    marginBottom: 10,
    gap: 12,
  },
  actionBtnPrimary: {
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    backgroundColor: '#F1F5F9',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnSecondaryText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
  // Navi Safety Buddy styling
  naviContainer: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    alignItems: 'flex-end',
    zIndex: 5,
  },
  naviTrigger: {
    width: 90,
    height: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 0,
  },
  naviMascotImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // Show full head without cropping
  },
  naviAlertBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  naviAlertText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  naviSpeechBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 8,
    width: 240,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  naviSpeechTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 4,
    textAlign: 'center',
  },
  naviSpeechText: {
    fontSize: 11.5,
    color: '#475569',
    marginBottom: 4,
    lineHeight: 15,
  },
  naviOptionBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingVertical: 4.5,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  naviOptionBtnAlert: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  naviOptionText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '600',
    textAlign: 'center',
  },
  naviOptionTextAlert: {
    color: '#DC2626',
  },
  naviRatingContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    alignItems: 'center',
  },
  naviRatingText: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 4,
  },
  naviRatingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  naviRatingBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  naviRatingIcon: {
    fontSize: 14,
  },
  naviRatingFeedback: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 2,
  },

  // Simulation Controls Bar styles
  simControlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  simBtn: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  simBtnGood: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  simBtnBad: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  simBtnInfo: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  simBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
  },

  // Adult Alert Modal styles
  adultAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  adultAlertContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  adultAlertHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 12,
  },
  adultAlertBody: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  adultAlertSub: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 20,
  },
  adultAlertActions: {
    width: '100%',
    gap: 10,
  },
  adultAlertBtnPrimary: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  adultAlertBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  adultAlertBtnSecondary: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  adultAlertBtnSecondaryText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '600',
  },
  // Three-dots and Menu styles
  headerVertical: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 0,
    marginBottom: 0,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  headerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threeDotsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTopRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTopCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTopCircleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#64748B',
  },
  threeDotsText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: -1,
    marginTop: -2,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  menuDropdown: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 65 : 55,
    left: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: 170,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    padding: 6,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  // Icon designs
  iconCircleWrapper: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCheckMark: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '800',
    marginTop: -1,
  },
  iconMessageWrapper: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  menuBubbleIcon: {
    fontSize: 16,
  },
  menuBubbleCheck: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: '900',
    color: '#10B981',
    top: 7,
    left: 7,
  },
  customBubble: {
    width: 18,
    height: 14,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: -2,
  },
  customBubbleTail: {
    position: 'absolute',
    bottom: -3,
    left: 2,
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderTopColor: '#3B82F6',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    borderRightWidth: 3,
    borderRightColor: 'transparent',
  },
  customBubbleCheckMark: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    marginTop: -1,
  },
  // Select mode card selection
  profileCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  selectCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectCheckboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  selectCheckboxText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  // Bottom select actions bar
  selectActionsBar: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectCountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  selectActionsGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
  },
  selectActionCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectActionCircleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  selectActionBtnDisabled: {
    opacity: 0.4,
  },
  // Tab Bar styles
  tabContentContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 20,
    left: 20,
    right: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    height: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    marginHorizontal: 4,
  },
  tabItemActive: {
    backgroundColor: '#EFF6FF',
  },
  tabIcon: {
    fontSize: 20,
    color: '#94A3B8',
  },
  tabIconActive: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#3B82F6',
  },
  
  // Safety tips styles
  safetyHeaderBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  safetyHeaderBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  safetyIntroCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  safetyIntroMascot: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  safetyIntroTextWrapper: {
    flex: 1,
  },
  safetyIntroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  safetyIntroBody: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
  },
  safetyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  safetyCardEmoji: {
    fontSize: 28,
  },
  safetyCardContent: {
    flex: 1,
  },
  safetyCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  safetyCardBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },

  // Profile styles
  profileAvatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  profileAvatarBorder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FEF3C7',
    borderWidth: 3,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileAvatarText: {
    fontSize: 36,
  },
  profileSub: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
    marginBottom: 12,
  },
  progressBarBg: {
    width: '80%',
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  progressLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  profileSectionLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  badgeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeDesc: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
  },
  badgeCardLocked: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
    opacity: 0.6,
  },
  badgeEmojiLocked: {
    fontSize: 24,
    color: '#94A3B8',
    marginBottom: 12,
  },
  badgeTitleLocked: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
  },
  badgeDescLocked: {
    fontSize: 9,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Updates Screen styles
  updatesSectionLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 18,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  statusScrollRow: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingVertical: 4,
  },
  myStatusCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 72,
  },
  myStatusAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  statusAvatarText: {
    fontSize: 24,
  },
  statusAddBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#3B82F6',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  statusAddText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    marginTop: -1,
  },
  statusLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  statusCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 72,
  },
  statusAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  channelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  channelBadgeBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  channelBadgeText: {
    fontSize: 20,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  channelUpdateText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  channelFollowBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  channelFollowBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },

  // Calls Screen styles
  callRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  callAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  callInfo: {
    flex: 1,
  },
  callName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  callStatusText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  callActionBtn: {
    backgroundColor: '#ECFDF5',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callActionBtnIcon: {
    fontSize: 16,
    color: '#10B981',
  },

  // Communities Screen styles
  communityIntroCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  communityIntroEmoji: {
    fontSize: 32,
  },
  communityIntroText: {
    flex: 1,
  },
  communityIntroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  communityIntroDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  communityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  communityBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityBadgeEmoji: {
    fontSize: 20,
  },
  communityName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  communitySubText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  communityJoinBtn: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  communityJoinBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
  },

  // Profile Safety Link styles
  profileSafetyLinkCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  profileSafetyLinkIcon: {
    fontSize: 28,
  },
  profileSafetyLinkText: {
    flex: 1,
  },
  profileSafetyLinkTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 2,
  },
  profileSafetyLinkDesc: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '600',
  },
  profileSafetyLinkArrow: {
    fontSize: 18,
    fontWeight: '950',
    color: '#3B82F6',
  },
  safetyHeaderBackBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  safetyHeaderBackText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  // Active Chat Header Calling Oval
  chatHeaderCallingOval: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginLeft: 12,
  },
  chatHeaderCallingBtn: {
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderCallingText: {
    fontSize: 14,
  },
  chatHeaderCallingDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 8,
  },
  // Date Separator styles
  dateSeparatorWrapper: {
    alignItems: 'center',
    marginVertical: 12,
    width: '100%',
  },
  dateSeparatorOval: {
    backgroundColor: 'rgba(241, 245, 249, 0.9)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateSeparatorText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Profile Modal Calling Oval
  modalCallingOval: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    zIndex: 100,
  },
  modalCallingIconBtn: {
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCallingIconText: {
    fontSize: 16,
  },
  modalCallingDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 8,
  },
  // Call Overlay styles
  fullscreenCallContainer: {
    flex: 1,
    backgroundColor: '#0B0F19',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  callVideoBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simulatedVideoPlaceholder: {
    alignItems: 'center',
  },
  simulatedVideoEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  simulatedVideoText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
  callHeaderArea: {
    zIndex: 10,
  },
  callHeaderContent: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  callSecurePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  callSecurePillText: {
    fontSize: 12,
    color: '#34D399',
    fontWeight: '800',
  },
  callContactNameText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  callStatusText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  callTimerText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: 1,
  },
  callCenterArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    height: 240,
    width: 240,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  largeCallAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 2,
  },
  largeCallAvatarText: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  audioCallingIndicator: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 24,
  },
  userPipPreview: {
    position: 'absolute',
    top: 140,
    right: 20,
    width: 110,
    height: 160,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  pipVideoOff: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  pipText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    marginTop: 8,
  },
  pipVideoOn: {
    flex: 1,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  pipLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  callControlsContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 20,
  },
  callControlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    marginBottom: 32,
  },
  callBtnRound: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  callBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  callBtnEmoji: {
    fontSize: 24,
  },
  callBtnLabel: {
    position: 'absolute',
    bottom: -22,
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    width: 80,
    textAlign: 'center',
  },
  endCallCircularBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    transform: [{ rotate: '135deg' }],
  },
  endCallEmoji: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  joinCallPill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinCallPillText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Incoming Call Overlay styles
  incomingCallOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 10000,
  },
  incomingCallCard: {
    backgroundColor: '#1E293B',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: '90%',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  incomingCallMascotIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  incomingCallTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#3B82F6',
    marginBottom: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  incomingCallName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  incomingCallSub: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
    marginBottom: 36,
  },
  incomingCallActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    gap: 32,
  },
  incomingCallRoundBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  callActionEmoji: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  callActionLabelText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
  },
  // Resources Screen Styles
  resourceIntroCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  resourceIntroEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  resourceIntroText: {
    flex: 1,
  },
  resourceIntroTitle: {
    fontSize: 16,
    fontWeight: '850',
    color: '#312E81',
    marginBottom: 4,
  },
  resourceIntroDesc: {
    fontSize: 12,
    color: '#4F46E5',
    lineHeight: 16,
  },
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  checkEmoji: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  checkTextWrapper: {
    flex: 1,
  },
  checkItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  checkItemDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'flex-start',
  },
  resourceCardEmoji: {
    fontSize: 28,
    marginRight: 12,
    marginTop: 2,
  },
  resourceCardContent: {
    flex: 1,
  },
  resourceCardTitle: {
    fontSize: 14,
    fontWeight: '850',
    color: '#0F172A',
    marginBottom: 4,
  },
  resourceCardDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 12,
  },
  resourceCallBtn: {
    backgroundColor: '#3B82F6',
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceCallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  resourceRowBtns: {
    flexDirection: 'row',
  },
  // Settings Screen Styles
  settingsMiniProfile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trustedAdultSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trustedAdultSectionTitle: {
    fontSize: 14,
    fontWeight: '850',
    color: '#1E3A8A',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trustedAdultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trustedAdultDetails: {
    flex: 1,
    marginRight: 12,
  },
  trustedAdultNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  trustedAdultPhoneText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  trustedAdultEditBtn: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  trustedAdultEditBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  trustedAdultAddBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#3B82F6',
  },
  trustedAdultAddBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  formInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1E293B',
    marginBottom: 16,
    backgroundColor: '#F8FAFC'
  },
  modalBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  settingsAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
    marginRight: 16,
  },
  settingsAvatarText: {
    fontSize: 24,
  },
  settingsProfileInfo: {
    flex: 1,
  },
  settingsProfileName: {
    fontSize: 16,
    fontWeight: '850',
    color: '#0F172A',
    marginBottom: 2,
  },
  settingsProfileDesc: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
  },
  settingsListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingsRowEmojiBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingsRowEmoji: {
    fontSize: 18,
  },
  settingsRowContent: {
    flex: 1,
  },
  settingsRowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  settingsRowDesc: {
    fontSize: 11,
    color: '#64748B',
  },
  settingsRowArrow: {
    fontSize: 16,
    color: '#CBD5E1',
    fontWeight: '750',
    marginLeft: 8,
  },
  // Parent Dashboard Styles
  parentLockWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#E6F0FA',
  },
  parentLockIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  parentLockTitle: {
    fontSize: 22,
    fontWeight: '850',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
  },
  parentLockDesc: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  parentPinInput: {
    width: '80%',
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
    letterSpacing: 8,
  },
  parentUnlockBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  parentUnlockBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  parentPinHint: {
    marginTop: 16,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  parentLockBadge: {
    backgroundColor: '#EF4444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  parentLockBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  safetyOverviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
  },
  safetyScoreWrapper: {
    alignItems: 'center',
    marginRight: 16,
  },
  safetyScoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  safetyScoreNum: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  safetyScoreLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textAlign: 'center',
  },
  safetyOverviewText: {
    flex: 1,
  },
  safetyOverviewTitle: {
    fontSize: 16,
    fontWeight: '850',
    color: '#0F172A',
    marginBottom: 4,
  },
  safetyOverviewDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyLogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyLogText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  alertLogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  alertLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  alertLogHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  alertLogEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  alertLogTitle: {
    fontSize: 13,
    fontWeight: '850',
    color: '#0F172A',
  },
  alertLogTime: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 1,
  },
  alertBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  alertBadgeBypass: {
    backgroundColor: '#FEF2F2',
  },
  alertBadgeListen: {
    backgroundColor: '#ECFDF5',
  },
  alertBadgeAdult: {
    backgroundColor: '#EFF6FF',
  },
  alertBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  alertBadgeTextBypass: {
    color: '#EF4444',
  },
  alertBadgeTextListen: {
    color: '#10B981',
  },
  alertBadgeTextAdult: {
    color: '#3B82F6',
  },
  alertLogBody: {
    marginTop: 2,
  },
  alertContactText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  alertMessageText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#334155',
    lineHeight: 18,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  singleMetricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  singleMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricSeparator: {
    width: 1.5,
    height: 40,
    backgroundColor: '#F1F5F9',
  },
  choicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  choiceBox: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  choiceBoxBypass: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderTopColor: '#EF4444',
    borderTopWidth: 4,
  },
  choiceBoxListen: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderTopColor: '#10B981',
    borderTopWidth: 4,
  },
  choiceBoxAlert: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderTopColor: '#3B82F6',
    borderTopWidth: 4,
  },
  choiceNum: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
    marginTop: 4,
  },
  choiceTextBypass: {
    color: '#EF4444',
  },
  choiceTextListen: {
    color: '#10B981',
  },
  choiceTextAlert: {
    color: '#3B82F6',
  },
  choiceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statsRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  statsValueHighlight: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10B981',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsSubDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 4,
  },
  categoryItem: {
    width: '100%',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chartBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
    paddingTop: 10,
    marginBottom: 10,
  },
  chartBarItem: {
    alignItems: 'center',
    width: 32,
  },
  chartBarFill: {
    width: 12,
    borderRadius: 6,
  },
  chartBarDay: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 6,
  },
  supportLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    marginTop: 16,
  },
  textingTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  textingTypeBox: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  textingTypeBoxSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  textingTypeBoxText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  textingTypeBoxTextSelected: {
    color: '#2563EB',
  },
  situationInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    height: 100,
    fontSize: 15,
    color: '#1E293B',
    textAlignVertical: 'top',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  helperChoiceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  helperChoiceBox: {
    flex: 1,
    height: 112,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    justifyContent: 'flex-start',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  helperChoiceBoxSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  helperChoiceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  helperChoiceTextSelected: {
    color: '#2563EB',
  },
  checkmarkCircleBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  checkmarkIconText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
});

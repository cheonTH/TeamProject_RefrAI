/* global __firebase_config, __app_id, __initial_auth_token */ // eslint-disable-line no-redeclare

// Firebase App ID를 가져오는 유틸리티 함수
export const getAppId = () => {
  // .env 파일의 REACT_APP_FIREBASE_APP_ID를 우선 사용
  if (typeof process.env.REACT_APP_FIREBASE_APP_ID !== 'undefined') {
    return process.env.REACT_APP_FIREBASE_APP_ID;
  }
  // 그 다음 전역 변수 __app_id 사용
  if (typeof __app_id !== 'undefined') {
    return __app_id;
  }
  console.warn("App ID is undefined. Using 'local-dev-app-id'. This is normal in local dev outside Canvas.");
  return 'local-dev-app-id';
};

// Firebase Config를 가져오는 유틸리티 함수
export const getFirebaseConfig = () => {
  const firebaseConfigFromGlobal = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

  if (firebaseConfigFromGlobal && firebaseConfigFromGlobal.projectId) {
    return firebaseConfigFromGlobal;
  } else if (process.env.REACT_APP_FIREBASE_API_KEY && process.env.REACT_APP_FIREBASE_PROJECT_ID) {
    console.log("Using Firebase config from .env file.");
    return {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_PROJECT_ID + ".firebaseapp.com",
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_PROJECT_ID + ".appspot.com",
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
      appId: process.env.REACT_APP_FIREBASE_APP_ID || "YOUR_APP_ID",
    };
  } else {
    console.error("Firebase config is incomplete or missing. Please provide `REACT_APP_FIREBASE_API_KEY` and `REACT_APP_FIREBASE_PROJECT_ID` in your .env file or ensure __firebase_config is set.");
    return {}; // 빈 객체 반환하여 앱이 크래시되지 않도록 함
  }
};

// 초기 인증 토큰을 가져오는 유틸리티 함수
export const getInitialAuthToken = () => {
  if (typeof __initial_auth_token !== 'undefined') {
    return __initial_auth_token;
  }
  console.warn("Initial auth token is undefined. This is normal in local dev outside Canvas.");
  return null;
};

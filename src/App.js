/* global __initial_auth_token */ // eslint-disable-line no-redeclare 
// __firebase_config, __app_id는 이제 firebaseUtils.js에서 처리되므로 global 선언에서 제거합니다.
import React, { useState, useEffect, useRef } from 'react'; // useRef 임포트 추가
import './App.css';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';

// Firebase 관련 임포트
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut, EmailAuthProvider, GoogleAuthProvider, linkWithCredential, linkWithPopup } from 'firebase/auth';
import { getFirestore, addDoc, collection, serverTimestamp, doc, updateDoc, deleteDoc, getDocs, writeBatch, query, where, getDoc, setDoc } from 'firebase/firestore';

// 기존 컴포넌트 임포트
import RecipeForm from './components/RecipeForm';
import RecipeResult from './components/RecipeResult';
import MyRecipesPage from './components/MyRecipesPage';

// 게시판 컴포넌트 임포트
import BoardProvider from './components/board/context/BoardContext';
import Board from './components/board/Board';
import BoardWrite from './components/board/BoardWrite';
import BoardDetail from './components/board/BoardDetail';
import BoardEdit from './components/board/EditBoard';


// 개인 맞춤형 추천 섹션 컴포넌트 임포트
import RecommendationSection from './components/RecommendationSection';

// 로딩 오버레이 컴포넌트 임포트
import LoadingOverlay from './components/LoadingOverlay';

// 고객센터 챗봇 컴포넌트 임포트
import CustomerServiceChatbot from './components/CustomerServiceChatbot';

// 프로필, 인증 관련 컴포넌트 임포트 (src/components/pages/ 안에 있음)
import Login from './components/pages/Login';
import Signup from './components/pages/Signup';
import FindIdPassword from './components/pages/Find-Id-Password';

// src/components/pages/profile/ 내의 컴포넌트들 
import ProfileEdit from './components/pages/profile/ProfileEdit';
import InfoEdit from './components/pages/profile/InfoEdit';
import MyPage from './components/pages/profile/MyPage';
import DeleteAccount from './components/pages/profile/Delete-Account';
import MemberShip from './components/pages/profile/MemberShip';

// Header 컴포넌트 임포트
import Header from './Header';

// MainPage 컴포넌트 임포트 
import MainPage from './MainPage';

// NotFoundPage 임포트 (src/components/ 안에 있음)
import NotFoundPage from './components/NotFoundPage';
import { FridgeProvider } from './components/fridge/contexts/FridgeContext';
import RefrigeratorPage from './components/fridge/RefrigeratorPage';
import FridgeApiClient from './components/fridge/utils/FridgeApiClient';
import AxiosInstance from './components/pages/AxiosInstance';

// ✅ Firebase 유틸리티 함수 임포트 (App.js 자체 정의 함수 제거)
import { getFirebaseConfig, getInitialAuthToken, getAppId } from './components/fridge/utils/firebaseUtils';
import MySideProfile from './components/MyProfile/MySideProfile';


// Firestore 데이터 마이그레이션 함수 (userId가 변경될 경우)
async function migrateUserData(db, appId, oldUserId, newUserId) {
    if (!db || !appId || !oldUserId || !newUserId || oldUserId === newUserId) {
        console.warn("Invalid parameters for data migration or oldUserId is same as newUserId. Skipping migration.");
        return;
    }

    const collectionsToMigrate = ['saved_recipes', 'user_profile', 'refrigerator_ingredients'];

    for (const collectionName of collectionsToMigrate) {
        const oldPath = `artifacts/${appId}/users/${oldUserId}/${collectionName}`;
        const newPath = `artifacts/${appId}/users/${newUserId}/${collectionName}`;

        try {
            const oldDocsSnapshot = await getDocs(collection(db, oldPath));
            if (oldDocsSnapshot.empty) {
                continue;
            }

            const batch = writeBatch(db);

            oldDocsSnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const newDocRef = doc(collection(db, newPath), docSnap.id);
                batch.set(newDocRef, data);
                batch.delete(docSnap.ref); // 기존 문서 삭제 (마이그레이션 성공 시)
            });

            await batch.commit();
        } catch (error) {
            console.error(`Error migrating collection ${collectionName}:`, error);
        }
    }
}


function App() {
    const [ingredientsInput, setIngredientsInput] = useState('');
    const [servingSize, setServingSize] = useState(2);
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [recommendationTab, setRecommendationTab] = useState('forEveryone');
    const [recipeType, setRecipeType] = useState('adult');

    const [activeTab, setActiveTab] = useState('')

    const navigate = useNavigate();
    const location = useLocation();

    const recipeDataForRecipeResult = location.state?.recipeData || null;
    const returnPagePathForRecipeResult = location.state?.returnPagePath || '/';

    // Firebase 관련 상태
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null); // Firebase Auth UID
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // 사용자 로그인 관련 상태
    const [isLoggined, setIsLoggined] = useState(false); // 실제 로그인 여부 (Firebase Auth 상태 기반)
    const [userProfile, setUserProfile] = useState(null); // 사용자 프로필 정보 (닉네임, 비건타입 등)

    // ✅ 스프링 부트 백엔드 URL (주요 API: 사용자 관리, 게시판 등)
    const springBackendUrl = process.env.REACT_APP_SPRING_BACKEND_URL
    // ✅ 파이썬 백엔드 URL (AI 관련 API: 레시피 생성, 챗봇 등)
    const backendUrl = process.env.REACT_APP_BACKEND_URL;

    // 헤더 높이를 동적으로 측정하기 위한 ref와 상태
    const headerRef = useRef(null);
    const [mainPaddingTop, setMainPaddingTop] = useState('0px');

    // Firebase 초기화 및 인증 상태 리스너 설정
    useEffect(() => {
        let currentAuthUser = null;

        // 비동기 초기화 함수 정의
        const initializeFirebase = async () => {
            try {
                const firebaseConfig = getFirebaseConfig(); // ✅ 유틸리티 함수 사용
                if (Object.keys(firebaseConfig).length === 0 || !firebaseConfig.projectId) {
                    console.error("Firebase configuration is missing or incomplete.");
                    setIsAuthReady(true);
                    return;
                }

                const app = initializeApp(firebaseConfig);
                const authInstance = getAuth(app);
                const dbInstance = getFirestore(app);

                setAuth(authInstance);
                setDb(dbInstance);

                // onAuthStateChanged 리스너: Firebase의 실제 인증 상태 변경을 감지합니다.
                const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                    const prevUserId = currentAuthUser?.uid;
                    currentAuthUser = user;

                    if (user) {
                        setUserId(user.uid);
                        setIsLoggined(true);

                        // 데이터 이전 로직 (필요 시 유지)
                        if (prevUserId && prevUserId !== user.uid && !user.isAnonymous) {
                            await migrateUserData(dbInstance, getAppId(), prevUserId, user.uid); // ✅ 유틸리티 함수 사용
                        }

                        // 사용자 프로필 로딩
                        const userProfileDocRef = doc(dbInstance, `artifacts/${getAppId()}/users/${user.uid}/user_profile/data`); // ✅ 유틸리티 함수 사용
                        try {
                            const docSnap = await getDoc(userProfileDocRef);
                            if (docSnap.exists()) {
                                setUserProfile(docSnap.data());
                            } else {
                                console.log("No user profile found for UID:", user.uid);
                                setUserProfile(null);
                            }
                        } catch (profileErr) {
                            console.error("Error fetching user profile:", profileErr);
                            setUserProfile(null);
                        }

                    } else {
                        console.log("onAuthStateChanged: No user is signed in.");
                        setIsLoggined(false);
                        setUserId(null);
                        setUserProfile(null);
                        sessionStorage.removeItem('token');
                    }

                    setIsAuthReady(true);
                });

                // 초기 커스텀 토큰 로그인 시도
                // const initialAuthToken = getInitialAuthToken(); // ✅ 유틸리티 함수 사용
                // if (initialAuthToken) {
                //     try {
                //         await signInWithCustomToken(authInstance, initialAuthToken);
                //         console.log("Signed in with custom token.");
                //     } catch (error) {
                //         console.error("Error signing in with custom token:", error);
                //         // 커스텀 토큰 실패 시 익명 로그인 시도
                //         try {
                //             await signInAnonymously(authInstance);
                //             console.log("Signed in anonymously after custom token failure.");
                //         } catch (anonError) {
                //             console.error("Error signing in anonymously:", anonError);
                //         }
                //     }
                // } else {
                //     // 토큰이 없으면 익명 로그인 시도
                //     try {
                //         await signInAnonymously(authInstance);
                //         console.log("Signed in anonymously as no custom token provided.");
                //     } catch (anonError) {
                //         console.error("Error signing in anonymously:", anonError);
                //     }
                // }

                // 클린업 함수 반환
                return () => unsubscribe();

            } catch (e) {
                console.error("Firebase initialization failed:", e);
                setError("Firebase 초기화 중 오류가 발생했습니다: " + e.message);
                setIsAuthReady(true);
            }
        };

        // useEffect 내에서 비동기 초기화 함수 호출
        initializeFirebase();

    }, []); // 이 useEffect는 앱 시작 시 단 한번만 실행됩니다.


    // 헤더 높이를 측정하고 mainPaddingTop 상태 업데이트
    useEffect(() => {
        const updateMainPadding = () => {
            if (headerRef.current) {
                setMainPaddingTop(`${headerRef.current.offsetHeight}px`);
            }
        };

        // 컴포넌트 마운트 시 및 리사이즈 시 높이 측정
        updateMainPadding();
        window.addEventListener('resize', updateMainPadding);

        // 컴포넌트 언마운트 시 이벤트 리스너 제거
        return () => {
            window.removeEventListener('resize', updateMainPadding);
        };
    }, [isAuthReady]); // isAuthReady가 변경될 때도 다시 계산 (초기 렌더링 후)

    const handleGenerateAndDisplayRecipe = async (ingredientsArray, targetServingSize = 2, currentRecipeType = 'adult') => {
        setLoading(true);
        setRecipe(null);
        setError('');

        if (ingredientsArray.length === 0) {
            setError('재료를 하나 이상 입력해주세요.');
            setLoading(false);
            return;
        }
        if (targetServingSize <= 0) {
            setError('인분 수는 1 이상이어야 합니다.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/generate-recipe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ingredients: ingredientsArray,
                    serving_size: targetServingSize,
                    recipe_type: currentRecipeType
                }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.recipe_data) {
                    navigate('/recipe-result', { state: { recipeData: data.recipe_data, returnPagePath: '/' } });
                } else {
                    setError(data.error || '백엔드에서 레시피 데이터를 찾을 수 없습니다.');
                }
            } else {
                setError(data.error || '백엔드 서버에 연결할 수 없거나 레시피를 가져오는 데 실패했습니다.');
            }
        } catch (err) {
            console.error('App.js - API 호출 중 오류 발생:', err);
            setError('백엔드 서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해주세요.');
        } finally {
            setLoading(false);
        }
    };

    const gotoNotice = () => {
        setActiveTab('notice')
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const ingredientsArray = ingredientsInput.split(',').map(item => item.trim()).filter(item => item !== '');
        handleGenerateAndDisplayRecipe(ingredientsArray, servingSize, recipeType);
    };

    const handleSelectRecommendedRecipe = (recipeTitle) => {
        handleGenerateAndDisplayRecipe([recipeTitle], 2, 'adult');
    };

    const handleSaveRecipe = async (recipeContent) => {
        if (!db || !userId) {
            setError("레시피를 저장하려면 로그인/인증이 필요합니다.");
            console.error("App.js - handleSaveRecipe: Firestore DB or User ID not ready:", { db, userId });
            return;
        }
        if (!recipeContent || !recipeContent.title) {
            setError("저장할 레시피 내용이 없거나 제목이 유효하지 않습니다.");
            console.error("App.js - handleSaveRecipe: Invalid recipeData for saving:", recipeContent);
            return;
        }

        setIsSaving(true);
        setError('');

        const appId = getAppId(); // ✅ 유틸리티 함수 사용
        const collectionPath = `artifacts/${appId}/users/${userId}/saved_recipes`;

        try {
            const recipeTitle = recipeContent.title.substring(0, 50).trim() || "새로운 레시피";

            await addDoc(collection(db, collectionPath), {
                title: recipeTitle,
                content: JSON.stringify(recipeContent),
                createdAt: serverTimestamp(),
                isFavorite: false,
                type: recipeType
            });
        } catch (e) {
            console.error("App.js - Error adding document to Firestore: ", e);
            setError("레시피 저장 중 오류가 발생했습니다: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleFavorite = async (recipeId, currentIsFavorite) => {
        if (!db || !userId) {
            setError("즐겨찾기 상태를 변경할 수 없습니다: 로그인/인증이 필요합니다.");
            return;
        }
        const appId = getAppId(); // ✅ 유틸리티 함수 사용
        const docRef = doc(db, `artifacts/${appId}/users/${userId}/saved_recipes`, recipeId);
        try {
            await updateDoc(docRef, {
                isFavorite: !currentIsFavorite,
            });
            setError('');
        } catch (e) {
            console.error("App.js - Error toggling favorite status:", e);
            setError("즐겨찾기 상태 변경 중 오류가 발생했습니다: " + e.message);
        }
    };

    const handleDeleteRecipe = async (recipeId) => {
        if (!db || !userId) {
            setError("레시피를 삭제할 수 없습니다: 로그인/인증이 필요합니다.");
            return;
        }
        // ✅ window.confirm 대신 커스텀 모달 UI 사용 권장 (현재는 alert 유지)
        if (window.confirm("정말 이 레시피를 삭제하시겠습니까?")) {
            const appId = getAppId(); // ✅ 유틸리티 함수 사용
            const docRef = doc(db, `artifacts/${appId}/users/${userId}/saved_recipes`, recipeId);
            try {
                await deleteDoc(docRef);
                setError('');
            } catch (e) {
                console.error("App.js - Error deleting recipe:", e);
                setError("레시피 삭제 중 오류가 발생했습니다: " + e.message);
            }
        }
    };

    const handleViewSavedRecipeDetail = (recipeToView) => {
        try {
            const parsedRecipeContent = JSON.parse(recipeToView.content);
            navigate('/recipe-result', { state: { recipeData: parsedRecipeContent, returnPagePath: '/my-recipes' } });
        } catch (e) {
            console.error("App.js - handleViewSavedRecipeDetail: Error parsing saved recipe content:", e);
            setError("저장된 레시피 내용을 불러오는 중 오류가 발생했습니다. 저장된 레시피 형식이 유효하지 않을 수 있습니다. 해당 레시피를 삭제하고 새로 저장해보세요.");
            setRecipe(null);
            navigate('/my-recipes');
        }
    };

    const handleGoBackToMainPage = () => {
        navigate('/');
        setIngredientsInput('');
        setRecipe(null);
        setError('');
    };

    const handleCloseRecipeResult = () => {
        navigate(returnPagePathForRecipeResult);
        setIngredientsInput('');
        setRecipe(null);
        setError('');
    };

    const handleSignupSuccess = async (email, password, userProfileData) => {
        if (!auth || !db) {
            setError("Firebase 서비스가 준비되지 않았습니다.");
            return;
        }

        try {
            const firebaseUser = auth.currentUser;

            if (firebaseUser) {
            const newUserUid = firebaseUser.uid;

            // ✅ Firestore에 저장
            const userProfileDocRef = doc(db, `artifacts/${getAppId()}/users/${newUserUid}/user_profile/data`);
            await setDoc(userProfileDocRef, {
                ...userProfileData,
                uid: newUserUid,
                createdAt: serverTimestamp(),
            });


            // ✅ Spring Boot 서버에도 저장
            const backendUserData = {
                email,
                nickName: userProfileData.nickname,
                gender: userProfileData.gender,
                veganType: userProfileData.veganType,
                foodOptions: userProfileData.preferredFoods,
                firebaseUid: newUserUid,
            };

            const response = await fetch(`${springBackendUrl}/api/users/firebase-signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backendUserData),
            });

            if (!response.ok) {
                const errorMsg = await response.text();
                throw new Error("Spring 서버 저장 실패: " + errorMsg);
            }


            // 성공 시 로그인 페이지로 이동
            navigate('/login');
            setError('');
            } else {
            console.error("User UID not available after signup.");
            }

        } catch (err) {
            console.error("회원가입 처리 중 오류:", err);
            setError("회원가입 처리 중 오류가 발생했습니다: " + err.message);
        }
    };


    const handleLoginSuccess = async (firebaseUser, userProfileFromFirestore) => {
        if (firebaseUser) {
            setUserId(firebaseUser.uid);
            setIsLoggined(true);
            setUserProfile(userProfileFromFirestore);

            try {
                // ✅ Firebase에서 JWT 발급을 위한 ID 토큰을 가져옴
                const idToken = await firebaseUser.getIdToken();

                // ✅ Spring Boot 서버로 토큰 전송
                const response = await fetch(`${springBackendUrl}/api/users/firebase-login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ firebaseToken: idToken }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Spring 서버 로그인 실패:", errorText);
                    setError("서버 로그인 실패: " + errorText);
                    return;
                }

                const userData = await response.json();
                // 필요하다면 로컬 스토리지에 저장 가능
                sessionStorage.setItem("jwtToken", userData.token);

            } catch (err) {
                console.error("JWT 요청 중 오류 발생:", err);
                setError("JWT 요청 실패: " + err.message);
            }

            navigate('/');
        } else {
            console.error("Login success callback called without a Firebase user object.");
            setError("로그인 처리 중 오류 발생: 사용자 정보 없음.");
        }
    };


    const handleLogout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            sessionStorage.clear();
            setIsLoggined(false);
            setUserId(null);
            setUserProfile(null);
            // ✅ alert 대신 커스텀 모달 UI 사용 권장 (현재는 alert 유지)
            alert("로그아웃 되었습니다.");
            navigate('/login');
        } catch (error) {
            console.error("로그아웃 실패:", error);
            setError("로그아웃 중 오류가 발생했습니다: " + error.message);
        }
    };

    if (!isAuthReady) {
        return (
            <div className="App loading-screen">
                <p>Firebase 인증 준비 중...</p>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="App">
            {loading && <LoadingOverlay message="맛있는 레시피를 만들고 있어요!" />}

            {/* headerRef를 Header 컴포넌트에 전달 */}
            <Header isLoggined={isLoggined} handleLogout={handleLogout} headerRef={headerRef} />

            <div className="app-body" style={{ paddingTop: mainPaddingTop }}>
            {/* main 태그에 동적으로 계산된 padding-top 적용 */}
            <main style={{ paddingTop: mainPaddingTop }} className='main-container'>
                <FridgeProvider isLoggedIn={isLoggined}>
                    <Routes>
                        <Route path="/" element={
                            <MainPage
                                ingredientsInput={ingredientsInput}
                                setIngredientsInput={setIngredientsInput}
                                servingSize={servingSize}
                                setServingSize={setServingSize}
                                handleSubmit={handleSubmit}
                                loading={loading}
                                error={error}
                                userId={userId}
                                db={db}
                                recipeType={recipeType}
                                setRecipeType={setRecipeType}
                                recommendationTab={recommendationTab}
                                setRecommendationTab={setRecommendationTab}
                                handleSelectRecommendedRecipe={handleSelectRecommendedRecipe}
                                isLoggined={isLoggined}
                            />
                        } />

                        <Route path="/recipe-result" element={
                            <RecipeResult
                                recipe={recipeDataForRecipeResult}
                                error={error}
                                handleGoBackToMainPage={handleGoBackToMainPage}
                                onClose={handleCloseRecipeResult}
                                onSaveRecipe={handleSaveRecipe}
                                isSaving={isSaving}
                                db={db}
                                userId={userId}
                                returnPage={returnPagePathForRecipeResult}
                                recipeType={recipeType}
                            />
                        } />

                        <Route path="/my-recipes" element={
                            <MyRecipesPage
                                handleGoBackToMainPage={handleGoBackToMainPage}
                                db={db}
                                auth={auth}
                                userId={userId}
                                handleViewSavedRecipeDetail={handleViewSavedRecipeDetail}
                                handleToggleFavorite={handleToggleFavorite}
                                handleDeleteRecipe={handleDeleteRecipe}
                            />
                        } />

                        <Route path="/community/*" element={
                            <BoardProvider>
                                <div className="main-content">
                                    <Routes>
                                        <Route index element={<Board />} />
                                        <Route path="write" element={<BoardWrite />} />
                                        <Route path=":id" element={<BoardDetail />} />
                                        <Route path=":id/edit" element={<BoardEdit />} />
                                    </Routes>
                                </div>
                            </BoardProvider>
                        } />

                        <Route path="/customer-service/*" element={
                            <Routes>
                                <Route index element={<CustomerServiceChatbot backendUrl={backendUrl} />}/>
                                <Route path=":id" element={<BoardDetail />} />
                            </Routes>
                        } />

                        <Route path="/refrigerator" element={
                            <RefrigeratorPage />
                        } />

                        {/* Login, Signup, FindIdPassword는 src/components/pages/ 아래에 있음 */}
                        <Route path="/login" element={<Login auth={auth} db={db} handleLoginSuccess={handleLoginSuccess} isLoggined={isLoggined} />} />
                        <Route path="/signup" element={<Signup auth={auth} db={db} handleSignupSuccess={handleSignupSuccess} />} />
                        <Route path="/find-id-password" element={<FindIdPassword />} />

                        {/* MyPage와 그 하위 경로들은 src/components/pages/profile/ 아래에 있음 */}
                        <Route path="/my-page/*" element={
                            <MyPage db={db} auth={auth} userId={userId} userProfile={userProfile} />} >
                            {/* InfoEdit 컴포넌트 렌더링 부분 수정 */}
                            <Route
                                path="info-edit"
                                element={<InfoEdit
                                    auth={auth}
                                    db={db}
                                    userId={userId}
                                    userProfile={userProfile}
                                    setUserProfile={setUserProfile}
                                    // ⭐ onProfileUpdateSuccess 콜백 함수 수정: 업데이트된 데이터를 인자로 받음 ⭐
                                    onProfileUpdateSuccess={(updatedData) => {
                                        setUserProfile(updatedData); // 받은 데이터를 직접 상태에 설정
                                    }}
                                />}
                            />
                            <Route path="profile-edit" element={<ProfileEdit auth={auth} db={db} userId={userId} userProfile={userProfile} />} />
                            <Route path="membership" element={<MemberShip />} />
                            <Route path="delete-account" element={<DeleteAccount auth={auth} db={db} userId={userId} handleLogout={handleLogout} />} />
                        </Route>


                        <Route path="*" element={<NotFoundPage />} />

                    </Routes>
                </FridgeProvider>
            </main>

            {isLoggined &&(
                <aside className="global-aside">
                    <MySideProfile onLogout={handleLogout} isLoggined={isLoggined} />
                </aside>)}


            </div>

            <footer>
                <p>&copy; 2025 내 냉장고 레시피. AI와 함께.</p>
            </footer>
        </div>
    );
}

export default App;

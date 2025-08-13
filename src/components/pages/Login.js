import React, { useState } from 'react';
import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";
import AxiosInstance from "./AxiosInstance";
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth'; // GoogleAuthProvider, signInWithPopup 제거
import { doc, getDoc, setDoc } from 'firebase/firestore';

// ✅ firebaseUtils.js의 getAppId 함수 임포트
import { getAppId } from '../../components/fridge/utils/firebaseUtils'; 


const Container = styled.div`
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #fff;
`;

const Box = styled.div`
    width: 400px;
    padding: 40px;
    background-color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.img`
    width: 120px;
    height: 120px;
    margin: 40px;
`;

const Input = styled.input`
    width: 100%;
    padding: 12px 14px;
    margin-bottom: 12px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 6px;
    &:focus {
        outline: none;
        border-color: #ff8c00;
        box-shadow: 0 0 0 2px rgba(255, 140, 0, 0.2);
    }
`;

const Button = styled.button`
    width: 100%;
    padding: 12px;
    background-color: #ff8c00;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 17px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s ease;
    &:hover {
        background-color: #e67e00;
    }
    &:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }
`;

const LinksRow = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    margin-top: 20px;
`;

const LinkContainer = styled.div`
    display: flex;
    align-items: center;
`;

const LinkText = styled(Link)`
    color: #666;
    font-size: 14px;
    text-decoration: none;
    margin: 0 5px;
    &:hover {
        color: #ff8c00;
    }
`;

const Divider = styled.span`
    color: #ccc;
    font-size: 14px;
`;

const ErrorText = styled.p`
    color: red;
    font-size: 14px;
    margin-top: 10px;
`;

function Login({ auth, db, handleLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const managerPassword = process.env.MANAGER_PASSWORD;

    const handleLogin = async () => {
        setError('');
        try {
            // 1. Firebase 로그인
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Firebase ID 토큰 발급
            const firebaseToken = await user.getIdToken();

            // 3. Spring 서버에 Firebase 토큰 전달 → JWT 발급
            const jwtRes = await AxiosInstance.post("/api/users/firebase-login", {
                firebaseToken: firebaseToken,
            });

            const jwtToken = jwtRes.data.token;

            console.log("jwtToken => ", jwtToken)

            // 4. JWT로 사용자 정보 요청
            const meRes = await AxiosInstance.get("/api/users/me", {
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                },
            });

            const backendUserData = meRes.data;
            const userId = backendUserData.userId; // 👉 여기서 꺼냄

            // 5. Firestore 프로필 조회 또는 생성
            // ✅ getAppId() 유틸리티 함수 사용
            const userProfileDocRef = doc(db, `artifacts/${getAppId()}/users/${user.uid}/user_profile/data`);
            const docSnap = await getDoc(userProfileDocRef);
            let userProfileFromFirestore = null;

            if (docSnap.exists()) {
                userProfileFromFirestore = docSnap.data();
            } else {
                console.warn("Firestore에 사용자 프로필 없음. 새로 생성합니다.");
                await setDoc(userProfileDocRef, {
                    nickname: backendUserData.nickName || user.email,
                    email: user.email,
                    profileImageUrl: "https://img.freepik.com/free-vector/graident-ai-robot-vectorart_78370-4114.jpg?semt=ais_hybrid&w=740",
                    veganType: "",
                    preferredFoods: [],
                    createdAt: new Date(),
                });
                userProfileFromFirestore = (await getDoc(userProfileDocRef)).data();
            }

            // ✅ 6. sessionStorage에 저장
            sessionStorage.setItem("token", jwtToken);
            sessionStorage.setItem("email", user.email);
            sessionStorage.setItem("userId", userId);
            sessionStorage.setItem("nickName", userProfileFromFirestore.nickname || backendUserData.nickName);

            // 7. 로그인 후 처리
            handleLoginSuccess(user, { ...userProfileFromFirestore, token: jwtToken });

        } catch (err) {
            console.error("로그인 오류:", err.code || err.message, err.response?.data);
            let errorMessage = "로그인 실패: 알 수 없는 오류";
            if (err.code) {
                switch (err.code) {
                    case 'auth/invalid-email':
                        errorMessage = "유효하지 않은 이메일 주소입니다.";
                        break;
                    case 'auth/user-disabled':
                        errorMessage = "비활성화된 계정입니다.";
                        break;
                    case 'auth/user-not-found':
                        errorMessage = "등록되지 않은 이메일입니다.";
                        break;
                    case 'auth/wrong-password':
                    case 'auth/invalid-credential': // Firebase v9+에서 비밀번호 오류 포함
                        errorMessage = "아이디 또는 비밀번호가 일치하지 않습니다.";
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = "로그인 시도 횟수가 너무 많습니다. 잠시 후 다시 시도해주세요.";
                        break;
                    default:
                        errorMessage = `로그인 실패: ${err.message}`;
                }
            } else if (err.response && err.response.data && err.response.data.message) {
                errorMessage = "로그인 실패: " + err.response.data.message; // 백엔드에서 보낸 상세 메시지 사용
            }
            setError(errorMessage);
        }
    };

    // ✅ handleGoogleLogin 함수 제거
    // const handleGoogleLogin = async () => { /* ... */ };


    return (
        <Container>
            <Box>
                <Logo src="https://img.freepik.com/free-vector/graident-ai-robot-vectorart_78370-4114.jpg?semt=ais_hybrid&w=740" />
                <Input placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)}/>
                <Input 
                    placeholder="비밀번호" 
                    type="password" value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    onKeyDown={(e) => {if(e.key === 'Enter'){ 
                        handleLogin();
                    }}}/>
                <Button onClick={handleLogin}>로그인</Button>

                <LinksRow>
                    <LinkContainer>
                        <LinkText to="/find-id-password">아이디/비밀번호 찾기</LinkText> 
                        <Divider>I</Divider>
                        <LinkText to="/signup">회원가입</LinkText> 
                    </LinkContainer>
                </LinksRow>

                {/* ✅ Google 로그인 버튼 제거 */}
                {/* <Button onClick={handleGoogleLogin} style={{ backgroundColor: "#DB4437", marginTop: "15px" }}>
                    Google로 로그인
                </Button> */}

                <Button onClick={() => {setEmail('refrmanager00@gmail.com'); setPassword('12345678@!')}} style={{ backgroundColor: "#eee", color: "#000", marginTop: "20px" }}>
                    관리자 로그인
                </Button>

                <Button onClick={() => {setEmail('tester05300@gmail.com'); setPassword('12345678!')}} style={{ backgroundColor: "#eee", color: "#000", marginTop: "20px" }}>
                    테스터 로그인
                </Button>

                <Button onClick={() => navigate('/')} style={{ backgroundColor: "#eee", color: "#000", marginTop: "20px" }}>
                    메인으로 돌아가기
                </Button>
            </Box>
        </Container>
    );
}

export default Login;

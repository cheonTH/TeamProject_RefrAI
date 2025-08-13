// src/components/pages/profile/ProfileEdit.js
import React, { useState, useEffect } from 'react'; // 'react'에 따옴표 확인
import styled from 'styled-components';
import AxiosInstance from '../AxiosInstance'; // 경로 확인
import { useLocation, useNavigate, Link } from 'react-router-dom'; 
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'; 

// App.js에서 MyPage의 사이드바 스타일을 가져와서 재활용하거나 유사하게 정의합니다.
// 여기서는 MyPage 컴포넌트와 동일한 구조로 가정합니다.
const Container = styled.div`
    display: flex;
    max-width: 1200px;
    margin: 40px auto;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    min-height: 70vh;
`;

const Sidebar = styled.div`
    width: 240px;
    background-color: #FF8C00;
    padding: 40px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 8px 0 0 8px;
`;

const ProfilePic = styled.img`
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 15px;
    border: 3px solid #fff;
    box-shadow: 0 0 10px rgba(0,0,0,0.2);
`;

const SidebarHeader = styled.h2`
    font-size: 24px;
    color: #333;
    margin-bottom: 30px;
    text-align: center;
    color: #fff;
`;

const SidebarNickname = styled.p`
    font-size: 1.4em;
    font-weight: bold;
    color: #fff;
    margin-bottom: 20px;
`;

const NavList = styled.ul`
    list-style: none;
    padding: 0;
    width: 100%;
`;

const NavItem = styled.li`
    margin-bottom: 15px;
    width: 100%;
`;

const NavLink = styled(Link)`
    display: block;
    padding: 12px 15px;
    background-color: #fff;
    color: #FF8C00;
    text-decoration: none;
    border-radius: 5px;
    font-weight: bold;
    transition: background-color 0.3s ease, color 0.3s ease;
    text-align: center;

    &:hover {
        background-color: #f0f0f0;
        color: #e67e00;
    }

    &.active {
        background-color: #e67e00;
        color: #fff;
    }
`;

const Content = styled.div`
    flex: 1;
    padding: 30px 40px;
    background-color: #f9f9f9;
    border-radius: 0 8px 8px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
`;

const Title = styled.h2`
    font-size: 28px;
    color: #333;
    margin-bottom: 30px;
    text-align: center;
    width: 100%;
`;

const ProfileBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-width: 600px;
    width: 100%;
    padding: 40px 24px;
    margin: auto;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    background-color: #fff;
`;

const Input = styled.input`
    width: 100%;
    padding: 12px 14px;
    margin-bottom: 12px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 6px;
`;

const Button = styled.button`
    width: 100%;
    padding: 14px;
    margin-top: 10px;
    background-color: #FF8C00;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
        background-color: #e67e00;
    }
    &:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }
`;

const Message = styled.p`
    color: ${props => props.type === 'error' ? 'red' : 'green'};
    margin-top: 10px;
    font-size: 14px;
    width: 100%;
    text-align: center;
`;

const ProfileEdit = ({ auth, db, userId, userProfile }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Firebase Auth user object from App.js
    const firebaseUser = auth?.currentUser;

    const getAppId = () => typeof __app_id !== 'undefined' ? __app_id : 'local-dev-app-id';

    // 각 메뉴 항목의 활성화 상태를 current path에 따라 결정합니다.
    const isNavLinkActive = (path) => location.pathname.startsWith(path);

    const handleSubmitPasswordChange = async () => {
        if (!firebaseUser) {
            setError("로그인된 사용자 정보가 없습니다.");
            return;
        }
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setError("모든 비밀번호 필드를 채워주세요.");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
            return;
        }
        if (newPassword.length < 8) { // 최소 8자 이상 요구 (Firebase 기본)
            setError("새 비밀번호는 8자 이상이어야 합니다.");
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            // 1. 현재 사용자 재인증
            const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
            await reauthenticateWithCredential(firebaseUser, credential);

            // 2. 비밀번호 업데이트
            await updatePassword(firebaseUser, newPassword);
            
            // 3. (선택 사항) 백엔드에 비밀번호 변경 알림 또는 동기화
            // 백엔드에서 사용자 비밀번호를 직접 관리하는 경우 이 부분에 API 호출 추가
            // await AxiosInstance.post('/api/users/change-password', { newPassword });
            
            setSuccessMessage("비밀번호가 성공적으로 업데이트되었습니다!");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');

        } catch (err) {
            console.error("비밀번호 변경 실패:", err);
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError("현재 비밀번호가 올바르지 않습니다.");
            } else if (err.code === 'auth/requires-recent-login') {
                setError("보안을 위해 최근 로그인해야 비밀번호를 변경할 수 있습니다. 다시 로그인 후 시도해주세요.");
            } else if (err.code === 'auth/weak-password') {
                setError("새 비밀번호가 너무 약합니다. 더 강력한 비밀번호를 사용해주세요.");
            }
             else {
                setError("비밀번호 변경 중 오류가 발생했습니다: " + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <Sidebar>
                {/* MyPage와 동일한 사이드바 구조를 여기에 직접 정의하거나, MyPage에서 children으로 받아옴 */}
                <ProfilePic 
                    src={userProfile?.profileImageUrl || "https://img.freepik.com/free-vector/graident-ai-robot-vectorart_78370-4114.jpg?semt=ais_hybrid&w=740"} 
                    alt="프로필 이미지" 
                />
                <SidebarNickname>{userProfile?.nickname || "사용자"}</SidebarNickname>
                <NavList>
                    <NavItem>
                        <NavLink to="/my-page" className={isNavLinkActive("/my-page") && location.pathname === '/my-page' ? "active" : ""}>
                            마이페이지 홈
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink to="/my-page/info-edit" className={isNavLinkActive("/my-page/info-edit") ? "active" : ""}>
                            개인 정보 수정
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink to="/my-page/profile-edit" className={isNavLinkActive("/my-page/profile-edit") ? "active" : ""}>
                            비밀번호 변경
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink to="/my-page/membership" className={isNavLinkActive("/my-page/membership") ? "active" : ""}>
                            멤버쉽 설명
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink to="/my-page/delete-account" className={isNavLinkActive("/my-page/delete-account") ? "active" : ""}>
                            회원 탈퇴
                        </NavLink>
                    </NavItem>
                </NavList>
            </Sidebar>

            <Content>
                <ProfileBox>
                    <Title>비밀번호 변경</Title>

                    {error && <Message type="error">{error}</Message>}
                    {successMessage && <Message type="success">{successMessage}</Message>}

                    <Input
                        type="password"
                        placeholder="현재 비밀번호"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={loading}
                    />
                    <Input
                        type="password"
                        placeholder="새 비밀번호 (8자 이상)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={loading}
                    />
                    <Input
                        type="password"
                        placeholder="새 비밀번호 확인"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        disabled={loading}
                    />
                    <Button onClick={handleSubmitPasswordChange} disabled={loading}>
                        {loading ? '변경 중...' : '비밀번호 변경'}
                    </Button>
                </ProfileBox>
            </Content>
        </Container>
    );
};

export default ProfileEdit;
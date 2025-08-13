// src/components/pages/profile/Delete-Account.js
import React, { useState } from 'react'; // 'react'에 따옴표 확인
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { doc, deleteDoc, collection, writeBatch, getDocs } from 'firebase/firestore'; 

import AxiosInstance from '../AxiosInstance';

const Container = styled.div`
    min-height: 100vh;
    background-color: #fff;
    display: flex;
`;

const Content = styled.div`
    flex: 1;
    padding: 60px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    width: 100%;
`;

const Title = styled.h2`
    font-size: 24px;
    margin-bottom: 30px;
    text-align: center;
    color: #333;
`;

const DeleteBox = styled.div`
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
    margin-bottom: 20px;
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
    margin-bottom: 15px;
`;

const CustomConfirmModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-11/12">
                <p className="mb-5 text-lg">{message}</p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onConfirm}
                        className="px-5 py-2 bg-red-500 text-white font-bold rounded-md hover:bg-red-600 transition-colors"
                    >
                        확인
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-5 py-2 bg-gray-300 text-gray-800 font-bold rounded-md hover:bg-gray-400 transition-colors"
                    >
                        취소
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeleteAccount = ({ auth, db, userId, handleLogout }) => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false); // ⭐ 모달 표시 상태

    const backendUrl = process.env.REACT_APP_BACKEND_URL;

    const getAppId = () => typeof __app_id !== 'undefined' ? __app_id : 'local-dev-app-id';

    // ⭐ 실제 계정 삭제 로직을 별도 함수로 분리
    const executeDeleteAccount = async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');

        const user = auth.currentUser;
        const email = user.email;

        try {
            // 1. Firebase 재인증
            const credential = EmailAuthProvider.credential(email, password);
            await reauthenticateWithCredential(user, credential);

            // 2. 백엔드에서 사용자 데이터 삭제 요청
            try {
                const token = await user.getIdToken();
                const response = await fetch(`${backendUrl}/api/users/delete-account`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ firebaseUid: user.uid, email: user.email })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || '백엔드 데이터 삭제 실패');
                }
            } catch (backendError) {
                console.warn("백엔드 사용자 데이터 삭제 실패 (구현되지 않았거나 오류 발생):", backendError);
                setError("백엔드 데이터 삭제 중 오류가 발생했습니다. 일부 데이터가 남아있을 수 있습니다.");
            }

            // 3. Firestore에서 사용자 관련 데이터 삭제
            const userProfileDocRef = doc(db, `artifacts/${getAppId()}/users/${userId}/user_profile/data`);
            const savedRecipesCollectionRef = collection(db, `artifacts/${getAppId()}/users/${userId}/saved_recipes`);
            const refrigeratorCollectionRef = collection(db, `artifacts/${getAppId()}/users/${userId}/refrigerator_ingredients`);
            // 추가적인 사용자 데이터 컬렉션이 있다면 여기에 추가

            const batch = writeBatch(db);

            // 프로필 문서 삭제
            batch.delete(userProfileDocRef);

            // 저장된 레시피 삭제 (컬렉션 내 모든 문서 삭제)
            const savedRecipesSnapshot = await getDocs(savedRecipesCollectionRef);
            savedRecipesSnapshot.forEach(docSnap => {
                batch.delete(docSnap.ref);
            });

            // 냉장고 재료 삭제 (컬렉션 내 모든 문서 삭제)
            const refrigeratorSnapshot = await getDocs(refrigeratorCollectionRef);
            refrigeratorSnapshot.forEach(docSnap => {
                batch.delete(docSnap.ref);
            });

            await batch.commit();

            // 4. Firebase 사용자 계정 삭제
            await deleteUser(user);

            setSuccessMessage("계정이 성공적으로 탈퇴되었습니다.");
            handleLogout(); // App.js에서 로그인 상태 초기화 및 리디렉션
            
        } catch (err) {
            console.error("계정 탈퇴 실패:", err);
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError("비밀번호가 올바르지 않습니다.");
            } else if (err.code === 'auth/requires-recent-login') {
                setError("보안을 위해 최근 로그인해야 계정을 탈퇴할 수 있습니다. 다시 로그인 후 시도해주세요.");
            } else {
                setError("계정 탈퇴 중 오류가 발생했습니다: " + err.message);
            }
        } finally {
            setLoading(false);
            setShowConfirmModal(false); // 모달 숨기기
        }
    };

    // ⭐ handleDeleteAccount: 모달을 띄우는 함수
    const handleDeleteAccount = () => {
        if (!auth || !auth.currentUser || !db || !userId) {
            setError("사용자 정보를 찾을 수 없습니다. 다시 로그인 해주세요.");
            return;
        }

        const user = auth.currentUser;
        const email = user.email;
        
        if (!email) {
            setError("이메일로 가입된 계정만 탈퇴를 진행할 수 있습니다. 다른 로그인 방식의 경우 관리자에게 문의해주세요.");
            return;
        }

        if (!password) {
            setError("비밀번호를 입력해주세요.");
            return;
        }

        // ⭐ 확인 모달 표시
        setShowConfirmModal(true);
    };

    return (
        <div className="flex justify-center items-center bg-white min-h-screen font-inter">
            <div className="w-full max-w-2xl p-5 flex justify-center items-center">
                <div className="w-full p-10 bg-white rounded-lg shadow-lg text-center">
                    <h2 className="text-2xl font-bold mb-8">회원 탈퇴</h2>
                    <p className="mb-6 text-gray-700">계정을 탈퇴하시려면 현재 비밀번호를 입력해주세요.</p>
                    <input
                        type="password"
                        placeholder="현재 비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="w-full px-4 py-3 mb-4 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
                    {successMessage && <div className="text-green-500 text-sm mb-4">{successMessage}</div>}
                    <button
                        onClick={handleDeleteAccount}
                        disabled={loading}
                        className="w-full px-5 py-3 mt-2 bg-orange-500 text-white font-bold rounded-md hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? '탈퇴 처리 중...' : '회원 탈퇴'}
                    </button>
                    <button 
                        onClick={() => navigate('/my-page')} 
                        className="w-full px-5 py-3 mt-4 bg-gray-300 text-gray-800 font-bold rounded-md hover:bg-gray-400 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        취소
                    </button>
                </div>
            </div>

            {/* ⭐ 확인 모달 렌더링 */}
            {showConfirmModal && (
                <CustomConfirmModal
                    message="정말로 계정을 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다."
                    onConfirm={executeDeleteAccount} // 확인 시 실제 삭제 로직 호출
                    onCancel={() => setShowConfirmModal(false)} // 취소 시 모달 닫기
                />
            )}
        </div>
    );
};

export default DeleteAccount;
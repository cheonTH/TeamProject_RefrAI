// src/components/pages/profile/InfoEdit.js
import React, { useEffect, useState, useRef } from 'react';
import styled from "styled-components";
import AxiosInstance from '../AxiosInstance';
import { useNavigate, Link, useLocation } from "react-router-dom"; 
import { getAuth } from 'firebase/auth'; 
import { doc, getDoc, updateDoc, collection } from 'firebase/firestore'; 
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Styled-components (기존과 동일)
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
`;

const InfoBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-width: 600px;
    width: 100%;
    padding: 40px 24px;
    margin: auto;
    border: 1px solid #ccc;
    border-radius: 8鳴;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    background-color: #fff;
`;

const ProfileImageContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 30px;
`;

const ProfileImage = styled.img`
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 15px;
    border: 3px solid #f0f0f0;
    background-color: #eee; /* 이미지가 없을 때 배경색 */
`;

const ImageUploadButton = styled.button`
    padding: 8px 16px;
    background-color: #f7f7f7;
    color: #333;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
        background-color: #e9e9e9;
    }
`;

const Label = styled.label`
    font-size: 20px;
    margin-bottom: 4px;
    display: block;
    width: 100%;
    text-align: left;
    margin-top: 15px;
`;

const Input = styled.input`
    width: 100%;
    padding: 12px 14px;
    margin-bottom: 12px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 6px;
    &[type="radio"], &[type="checkbox"] {
        width: auto; /* auto로 변경하여 라디오/체크박스 고유 너비 유지 */
        min-width: unset; /* 최소 너비 제한 해제 */
        height: 18px; 
        width: 18px; 
        margin-right: 5px;
        margin-left: 0;
        padding: 0;
        vertical-align: middle;
        margin-bottom: 0;
    }
`;

const CheckButton = styled.button`
    width: 30%;
    padding: 12px;
    margin-left : 10px;
    margin-bottom: 12px;
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

const RadioGroup = styled.div`
    margin-top: 10px;
    margin-bottom: 10px;
    display: flex;
    width: 100%;
    gap: 20px;
    justify-content: flex-start;
`;

const CheckboxGroup = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-top: 10px;
    width: 100%;
    padding-left: 5px;
`;

const CheckboxLabel = styled.label`
    display: flex;
    align-items: center;
    font-size: 16px;
`;

const SubmitButton = styled.button`
    width: 100%;
    padding: 14px;
    margin-top: 20px;
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

const InfoEdit = ({ auth, db, storage, userId, userProfile, onProfileUpdateSuccess }) => {
    const navigate = useNavigate();
    const location = useLocation();
    // 파일 입력을 위한 ref
    const fileInputRef = useRef(null);

    const [profileImageUrl, setProfileImageUrl] = useState(''); // 현재 프로필 이미지 URL
    const [newImageFile, setNewImageFile] = useState(null);       // 새로 선택된 이미지 파일
    const [imagePreview, setImagePreview] = useState('');         

    const [currentNickName, setCurrentNickName] = useState('');
    const [newNickName, setNewNickName] = useState('');
    const [isNicknameAvailable, setIsNicknameAvailable] = useState(false);
    const [nicknameError, setNicknameError] = useState('');
    const [gender, setGender] = useState('');
    const [veganType, setVeganType] = useState('');
    const [preferredFoods, setPreferredFoods] = useState([]);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(true); // 데이터를 가져오는 동안 로딩 상태로 시작

    const foodOptions = [
        "양식", "일식", "중식", "한식", "분식", "디저트", "기타 음식"
    ];

    const getAppId = () => typeof __app_id !== 'undefined' ? __app_id : 'local-dev-app-id';

    // ⭐ 컴포넌트 마운트 시 백엔드에서 사용자 프로필을 가져오는 useEffect ⭐
    useEffect(() => {
        const fetchUserProfileFromBackend = async () => {
            if (!userId) { // userId가 없으면 인증되지 않은 상태이므로 로딩 종료
                setLoading(false);
                return;
            }
            setLoading(true);
            setError('');
            try {
                // AxiosInstance를 사용하여 백엔드에서 프로필 가져오기 (JWT 토큰 포함)
                const response = await AxiosInstance.get('/api/users/me');
                const fetchedProfile = response.data;

                // 가져온 데이터로 상태 업데이트
                setProfileImageUrl(fetchedProfile.profileImageUrl || ''); // 백엔드 필드명에 맞게 조정
                setCurrentNickName(fetchedProfile.nickName || '');
                setNewNickName(fetchedProfile.nickName || '');
                setGender(fetchedProfile.gender || '');
                setVeganType(fetchedProfile.veganType || '');
                setPreferredFoods(fetchedProfile.foodOptions || []);
                setIsNicknameAvailable(true);
            } catch (err) {
                console.error("InfoEdit.js: 백엔드에서 프로필 가져오는 중 오류 발생:", err);
                setError("프로필 정보를 불러오는 데 실패했습니다. 다시 시도해주세요.");
                // 백엔드에서 가져오기 실패 시, prop으로 전달받은 데이터를 폴백으로 사용
                if (userProfile) {
                    setCurrentNickName(userProfile.nickname || '');
                    setNewNickName(userProfile.nickname || '');
                    setGender(userProfile.gender || '');
                    setVeganType(userProfile.veganType || '');
                    setPreferredFoods(userProfile.preferredFoods || []);
                    setIsNicknameAvailable(true);
                    console.warn("InfoEdit.js: 백엔드 가져오기 실패로 userProfile prop으로 폴백합니다.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchUserProfileFromBackend();
    }, [userId]); // userId 변경 시 다시 가져오기 (예: 로그인 후)

    // // 이미지 변경 핸들러 함수
    // const handleImageChange = (e) => {
    //     const file = e.target.files[0];
    //     if (file && file.type.startsWith('image/')) {
    //         setNewImageFile(file);
    //         setImagePreview(URL.createObjectURL(file));
    //     } else {
    //         setError('이미지 파일만 선택 가능합니다.');
    //     }
    // };

    const handleNicknameChange = (e) => {
        const value = e.target.value;
        setNewNickName(value);
        if (value === currentNickName) {
            setIsNicknameAvailable(true); // 현재 닉네임과 같으면 유효
            setNicknameError('');
        } else {
            setIsNicknameAvailable(false); // 다르면 중복 확인 필요
            setNicknameError('닉네임 중복 확인이 필요합니다.');
        }
    };

    const checkNicknameAvailability = async () => {
        if (newNickName === currentNickName) {
            setIsNicknameAvailable(true);
            setNicknameError('');
            return;
        }
        if (!newNickName.trim()) {
            setNicknameError("닉네임을 입력해 주세요.");
            setIsNicknameAvailable(false);
            return;
        }
        try {
            const res = await AxiosInstance.get(`/api/users/check-nickname`, {
                params: { nickName: newNickName }
            });
            if (res.data.isDuplicate) {
                setNicknameError("이미 사용 중인 닉네임입니다.");
                setIsNicknameAvailable(false);
            } else {
                setNicknameError("사용 가능한 닉네임입니다.");
                setIsNicknameAvailable(true);
            }
        } catch (err) {
            console.error("닉네임 중복 확인 실패:", err);
            setNicknameError("닉네임 중복 확인 중 오류 발생.");
            setIsNicknameAvailable(false);
        }
    };

    const handleGenderChange = (value) => {
        setGender(value);
    };

    const handleVeganTypeChange = (type) => {
        setVeganType(type);
        setPreferredFoods([]); // 비건 타입 변경 시 선호 음식 초기화
    };

    const handlePreferredFoodChange = (food) => {
        if (veganType === 'vegan') {
            setPreferredFoods(["채식(비건)"]);
            return;
        }

        if (preferredFoods.includes(food)) {
            setPreferredFoods(prev => prev.filter(item => item !== food));
        } else {
            if (preferredFoods.length < 3) {
                setPreferredFoods(prev => [...prev, food]);
            } else {
                setError("선호 음식은 최대 3개까지 선택할 수 있습니다.");
                setTimeout(() => setError(''), 3000); // 3초 후 에러 메시지 제거
            }
        }
    };

    const handleSubmit = async () => {
        if (!userId || !db) {
            setError("사용자 정보 또는 데이터베이스가 준비되지 않았습니다.");
            return;
        }

        // 닉네임이 변경되었는데 중복 확인이 안 되었거나, 유효하지 않은 경우
        if (newNickName.trim() === '' || (newNickName.trim() !== currentNickName && !isNicknameAvailable)) {
            setError("닉네임을 확인하거나 중복 확인을 해주세요.");
            return;
        }

        if (!gender) {
            setError("성별을 선택해 주세요.");
            return;
        }
        if (!veganType) {
            setError("음식 성향을 선택해 주세요.");
            return;
        }
        if (veganType === 'non-vegan' && preferredFoods.length === 0) {
            setError("선호 음식을 선택해 주세요.");
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            let uploadedImageUrl = profileImageUrl; // 기본값은 현재 이미지 URL

            if (newImageFile) {
                // storage prop이 유효한지 확인합니다.
                if (!storage) {
                    throw new Error("Firebase Storage 인스턴스가 준비되지 않았습니다.");
                }

                const imageRef = ref(storage, `profile_pictures/${userId}/${Date.now()}_${newImageFile.name}`);
                const uploadResult = await uploadBytes(imageRef, newImageFile);
                uploadedImageUrl = await getDownloadURL(uploadResult.ref);
            }
            
            // 업데이트할 데이터 객체를 생성합니다.
            const updates = {
                newNickName: newNickName,
                gender: gender,
                veganType: veganType,
                preferredFoods: preferredFoods,
                profileImageUrl: uploadedImageUrl // 이미지 URL 필드 추가 (백엔드와 필드명 일치 필요)
            };

            // 백엔드에 모든 프로필 정보(새 이미지 URL 포함) 업데이트 요청
            const backendRes = await AxiosInstance.put('/api/users/update-profile', updates);

            // Firestore 업데이트 (새 이미지 URL 포함)
            const userProfileDocRef = doc(db, `artifacts/${getAppId()}/users/${userId}/user_profile/data`);
            await updateDoc(userProfileDocRef, updates);

            setSuccessMessage('프로필이 성공적으로 업데이트되었습니다!');
            
            // App.js로 최신 데이터 전달
            const updatedProfileDocSnap = await getDoc(userProfileDocRef);
            if (updatedProfileDocSnap.exists()) {
                const updatedProfileData = updatedProfileDocSnap.data();
                if (typeof onProfileUpdateSuccess === 'function') {
                    onProfileUpdateSuccess(updatedProfileData);
                }
            }

            // 로컬 상태 업데이트
            setCurrentNickName(newNickName);
            setProfileImageUrl(uploadedImageUrl); // 로컬 이미지 URL도 업데이트
            setNewImageFile(null); // 파일 선택 상태 초기화
            setImagePreview('');   // 미리보기 초기화

            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (err) {
            console.error("InfoEdit.js - 프로필 업데이트 중 오류 발생:", err);
            let errorMessage = "프로필 업데이트 중 오류가 발생했습니다.";
            if (err.response && err.response.data && err.response.data.message) {
                errorMessage = "프로필 업데이트 실패: " + err.response.data.message;
            } else if (err.code) { // Firebase Storage 오류 처리
                errorMessage = `이미지 업로드 실패: ${err.code}`;
            } else if (err.message) {
                errorMessage = `프로필 업데이트 중 오류가 발생했습니다: ${err.message}`;
            }
            setError(errorMessage);

            // ⭐ 오류 발생 시 UI 상태를 현재 저장된 값으로 되돌립니다. ⭐
            setNewNickName(currentNickName); // 닉네임 입력 필드를 현재 닉네임으로 되돌림
            setIsNicknameAvailable(true);    // 현재 닉네임은 사용 가능하므로 true
            setNicknameError('');           // 닉네임 에러 메시지 초기화 (새로운 시도를 유도)
            
            // Firestore에 이미 업데이트된 내용이 있다면, App.js의 userProfile도 현재 Firestore 내용으로 동기화 시도
            if (db && userId) {
                const userProfileDocRef = doc(db, `artifacts/${getAppId()}/users/${userId}/user_profile/data`);
                getDoc(userProfileDocRef, { source: 'server' }).then(docSnap => {
                    if (docSnap.exists()) {
                        if (typeof onProfileUpdateSuccess === 'function') {
                            onProfileUpdateSuccess(docSnap.data());
                        }
                    }
                }).catch(fetchErr => {
                    console.error("InfoEdit.js - 재동기화를 위해 프로필을 다시 가져오는 중 오류 발생:", fetchErr);
                });
            }

        } finally {
            setLoading(false);
            navigate('/my-page');
        }
    };

    return (
        <Container>
            <Content>
                <InfoBox>
                    <Title>개인 정보 수정</Title>
                    <ProfileImageContainer>
                        {/* <ProfileImage 
                            src={imagePreview || "https://img.freepik.com/free-vector/graident-ai-robot-vectorart_78370-4114.jpg?semt=ais_hybrid&w=740"} // 미리보기, 현재 이미지, 기본 이미지 순으로 표시
                            alt="Profile" 
                        />
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleImageChange}
                        /> */}
                        {/* <ImageUploadButton onClick={() => fileInputRef.current.click()} disabled={loading}>
                            사진 변경
                        </ImageUploadButton> */}
                    </ProfileImageContainer>

                    {error && <Message type="error">{error}</Message>}
                    {successMessage && <Message type="success">{successMessage}</Message>}
                    <Label>닉네임</Label>
                    <div style={{ display: 'flex', width: '100%' }}>
                        <Input
                            type="text"
                            value={newNickName}
                            onChange={handleNicknameChange}
                            placeholder="새 닉네임"
                            style={{ flex: 1 }}
                        />
                        <CheckButton onClick={checkNicknameAvailability} disabled={newNickName.trim() === currentNickName || newNickName.trim() === '' || loading}>
                            {newNickName === currentNickName ? '현재 닉네임' : (isNicknameAvailable ? '사용 가능' : '중복 확인')}
                        </CheckButton>
                    </div>
                    {nicknameError && <Message type={isNicknameAvailable ? 'success' : 'error'}>{nicknameError}</Message>}

                    <Label>성별</Label>
                    <RadioGroup>
                        {["남성", "여성", "선택 안 함"].map((g) => (
                            <CheckboxLabel key={g}>
                                <Input
                                    type="radio"
                                    value={g}
                                    name="gender"
                                    checked={gender === g}
                                    onChange={(e) => handleGenderChange(e.target.value)}
                                />
                                {g}
                            </CheckboxLabel>
                        ))}
                    </RadioGroup>

                    <Label>음식 성향</Label>
                    <RadioGroup>
                        <CheckboxLabel>
                            <Input
                                type="radio"
                                value="vegan"
                                name="foodType"
                                checked={veganType === 'vegan'}
                                onChange={() => handleVeganTypeChange('vegan')}
                            />
                            비건
                        </CheckboxLabel>
                        <CheckboxLabel>
                            <Input
                                type="radio"
                                value="non-vegan"
                                name="foodType"
                                checked={veganType === 'non-vegan'}
                                onChange={() => handleVeganTypeChange('non-vegan')}
                            />
                            논비건
                        </CheckboxLabel>
                    </RadioGroup>

                    <Label>선호 음식 (논비건 선택 시 최대 3개)</Label>
                    {/* {veganType === 'vegan' && (
                        <CheckboxGroup>
                            <CheckboxLabel>
                                <Input type="checkbox" value="채식(비건)" checked={preferredFoods.includes("채식(비건)")} onChange={() => {}} readOnly />
                                채식(비건)
                            </CheckboxLabel>
                        </CheckboxGroup>
                    )} */}

                    {veganType === 'non-vegan' && (
                        <CheckboxGroup>
                            {foodOptions.map((food) => (
                                <CheckboxLabel key={food}>
                                    <Input 
                                        type="checkbox" 
                                        value={food} 
                                        checked={preferredFoods.includes(food)} 
                                        onChange={() => handlePreferredFoodChange(food)} 
                                        disabled={preferredFoods.length >= 3 && !preferredFoods.includes(food)} 
                                    />
                                    {food}
                                </CheckboxLabel>
                            ))}
                        </CheckboxGroup>
                    )}
                    <SubmitButton 
                        onClick={handleSubmit}
                        disabled={loading || (newNickName.trim() !== currentNickName && !isNicknameAvailable)}
                    >
                        {loading ? '저장 중...' : '저장하기'}
                    </SubmitButton>
                </InfoBox>
            </Content>
        </Container>
    );
}

export default InfoEdit;

import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from './AxiosInstance'; // AxiosInstance가 정의되어 있다고 가정

const Container = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 800px;
    margin: 40px auto;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const ContentSection = styled.div`
    padding: 20px 0;
`;

const SectionTitle = styled.h3`
    margin-bottom: 15px;
    color: #333;
`;

const RadioGroup = styled.div`
    margin-bottom: 20px;
`;

const RadioLabel = styled.label`
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    cursor: pointer;
    input {
        margin-right: 10px;
    }
`;

const InputGroup = styled.div`
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    align-items: center;
`;

const InputField = styled.input`
    flex: ${(props) => (props.$fullWidth ? '1' : 'none')};
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    width: ${(props) => (props.$fullWidth ? '100%' : 'auto')};
`;

const Button = styled.button`
    padding: 10px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    &:hover {
        background-color: #0056b3;
    }
    &:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }
`;

const SmallText = styled.p`
    font-size: 0.85rem;
    color: #777;
    margin-top: 5px;
`;

const Find_Id_Password = () => {

    // 비밀번호 찾기 상태
    const [findPwMethod, setFindPwMethod] = useState('email');
    const [findPwEmail, setFindPwEmail] = useState('');
    const [findPwVerificationCode, setFindPwVerificationCode] = useState('');
    const [isFindPwCodeSent, setIsFindPwCodeSent] = useState(false);
    const [findPwMessage, setFindPwMessage] = useState('');
    const [isSendingFindPwCode, setIsSendingFindPwCode] = useState(false);
    const [isVerifyingFindPwCode, setIsVerifyingFindPwCode] = useState(false);


    const navigate = useNavigate();

    // 이메일 유효성 검사 함수
    const isValidEmail = (email) => {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    };


    // --- 비밀번호 찾기 관련 함수 ---
    const handleSendFindPwVerificationCode = async () => {
        // 백엔드 API가 userId를 필수로 요구하는 경우에만 이 조건 활성화
        if (!findPwEmail) {
             setFindPwMessage('아이디와 이메일 주소를 모두 입력해주세요.');
             return;
        }
        if (!isValidEmail(findPwEmail)) {
            setFindPwMessage('유효한 이메일 주소를 입력해주세요.');
            return;
        }

        setIsSendingFindPwCode(true);
        setFindPwMessage('인증번호를 발송 중입니다...');
        try {
            // 백엔드 /api/email/send-pw-reset-code 엔드포인트는 userId와 email을 함께 받음
            const response = await AxiosInstance.post('/api/email/send-pw-reset-code', { email: findPwEmail });
            if (response.data.success) {
                setFindPwMessage('인증번호가 성공적으로 발송되었습니다. 이메일을 확인해주세요.');
                setIsFindPwCodeSent(true);
            } else {
                setFindPwMessage(response.data.message || '인증번호 발송에 실패했습니다. 아이디와 이메일이 일치하는지 확인해주세요.');
            }
        } catch (error) {
            console.error('비밀번호 찾기 인증 코드 발송 오류:', error);
            if (error.response) {
                setFindPwMessage(error.response.data.message || '서버 오류로 인증번호 발송에 실패했습니다.');
            } else {
                setFindPwMessage('네트워크 오류 또는 서버에 연결할 수 없습니다.');
            }
        } finally {
            setIsSendingFindPwCode(false);
        }
    };

    const handleVerifyFindPwCodeAndNavigate = async () => {
        setIsVerifyingFindPwCode(true);
        setFindPwMessage('인증번호를 확인 중입니다...');
        try {
            // 백엔드 /api/email/verify-pw-reset-code 엔드포인트는 userId, email, code를 받음
            const verifyResponse = await AxiosInstance.post('/api/email/verify-pw-reset-code', { email: findPwEmail, code: findPwVerificationCode });

            if (verifyResponse.data.success) {
                setFindPwMessage('이메일 인증에 성공했습니다. 비밀번호 재설정 페이지로 이동합니다.');
                alert('이메일 인증에 성공했습니다. 비밀번호를 재설정해주세요.');
                // 인증 성공 시, 비밀번호 재설정 페이지로 email과 verificationCode를 함께 전달
                navigate('/rebuildpassword', {
                    state: {
                        email: findPwEmail,
                        verificationCode: findPwVerificationCode
                        // userId는 RebuildPassword에서 직접 필요하지 않으므로 전달하지 않음
                    }
                });
            } else {
                setFindPwMessage(verifyResponse.data.message || '인증번호가 유효하지 않거나 만료되었습니다.');
            }
        } catch (error) {
            console.error('비밀번호 찾기 코드 검증 오류:', error);
            if (error.response) {
                setFindPwMessage(error.response.data.message || '인증번호 확인 중 서버 오류가 발생했습니다.');
            } else {
                setFindPwMessage('인증번호 확인 중 네트워크 오류가 발생했습니다.');
            }
        } finally {
            setIsVerifyingFindPwCode(false);
        }
    };


    return (
        <Container>
            {/* 비밀번호 찾기 섹션 */}
            {'findPw' && (
                <ContentSection>
                    <SectionTitle>비밀번호 찾기</SectionTitle>
                    <RadioGroup>
                        <RadioLabel>
                            <input
                                type="radio"
                                name="findPwMethod"
                                value="email"
                                checked={findPwMethod === 'email'}
                                onChange={() => setFindPwMethod('email')}
                            />
                            본인 확인 이메일 인증
                        </RadioLabel>
                    </RadioGroup>

                    {findPwMethod === 'email' && (
                        <>
                            {/* 아이디 입력 필드는 백엔드 로직에 따라 선택적으로 유지 */}
                            
                            <InputGroup>
                                <InputField
                                    type="email"
                                    placeholder="가입 시 등록한 이메일 주소"
                                    value={findPwEmail}
                                    onChange={(e) => setFindPwEmail(e.target.value)}
                                    $fullWidth
                                    disabled={isFindPwCodeSent}
                                />
                                <Button onClick={handleSendFindPwVerificationCode} disabled={isSendingFindPwCode || isFindPwCodeSent}>
                                    {isSendingFindPwCode ? '발송 중...' : (isFindPwCodeSent ? '재전송' : '인증번호 받기')}
                                </Button>
                            </InputGroup>
                            {findPwMessage && <SmallText>{findPwMessage}</SmallText>}

                            {isFindPwCodeSent && (
                                <>
                                    <InputGroup>
                                        <InputField
                                            type="text"
                                            placeholder="인증번호 입력"
                                            value={findPwVerificationCode}
                                            onChange={(e) => setFindPwVerificationCode(e.target.value)}
                                            $fullWidth
                                        />
                                    </InputGroup>
                                    <Button onClick={handleVerifyFindPwCodeAndNavigate} disabled={isVerifyingFindPwCode}>
                                        {isVerifyingFindPwCode ? '확인 중...' : '비밀번호 재설정'}
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </ContentSection>
            )}
        </Container>
    );
};

export default Find_Id_Password;

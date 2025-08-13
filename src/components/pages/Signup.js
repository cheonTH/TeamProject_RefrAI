import React, { useState } from "react";
import AxiosInstance from "./AxiosInstance"; // 경로 확인
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import {
  getAuth,
  createUserWithEmailAndPassword, // 이 함수는 이제 백엔드에서 호출됩니다.
  // sendEmailVerification, // 이 함수는 이제 백엔드에서 호출됩니다.
  fetchSignInMethodsForEmail,
  // updateProfile, // 이 함수는 이제 백엔드에서 호출됩니다.
  deleteUser, // 백엔드 가입 실패 시 Firebase 계정 삭제를 위해 유지
} from "firebase/auth";

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  min-height: 100vh;
`;

const Box = styled.div`
  width: 700px;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30px;
`;

const Input = styled.input`
  width: 40%;
  padding: 12px 14px;
  margin-bottom: 12px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  &[type="radio"], &[type="checkbox"] {
    width: auto;
    margin-right: 5px;
    margin-left: 0;
    padding: 0;
    min-width: unset;
    height: 18px; 
    width: 18px; 
    vertical-align: middle;
    margin-bottom: 0;
  }
`;

const StyledInput = styled.input`
    width: 72%;
    padding: 12px 14px;
    margin-bottom: 12px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 6px;
    margin-top : 20px;
`

const CheckButton = styled.button`
  width: 20%;
  padding: 12px;
  margin-left : 30px;
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

const Label = styled.label`
  font-size: 20px;
  margin-bottom: 4px;
  display: block;
`;

const RadioGroup = styled.div`
  margin:10px;
  gap: 10px;
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
  margin-left : 10px;
`;

const Button = styled.button`
  width: 100%;
  padding: 14px;
  margin-top: 10px;
  background-color: blue;
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

const ErrorText = styled.div`
  color: red;
  font-size: 12px;
  margin-top: -8px;
  margin-bottom: 8px;
`;

const SuccessText = styled.div`
  color: green;
  font-size: 12px;
  margin-top: -8px;
  margin-bottom: 8px;
`;

const HiddenRadioGroup = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isVisible'
})`
  display: ${({ isVisible }) => (isVisible ? 'grid' : 'none')};
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 10px;
  margin-left : 10px;
`;

const StyledButton = styled.button` /* 기존 Button을 StyledButton으로 변경하여 재사용 */
    width: 90%;
    padding: 14px;
    margin-top: 10px;
    background-color: ${props => props.$bgColor || "#FF8C00"}; /* 기본 오렌지색 */
    color: ${props => props.$textColor || "white"};
    border: none;
    border-radius: 6px;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease;

    &:hover {
        background-color: ${props => props.$hoverBgColor || "#e67e00"};
        color: ${props => props.$hoverTextColor || "white"};
    }

    &:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }
`;

const EmailVerificationSection = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    width : 90%;
    margin-left : 32px;

    ${Input} {
        flex: 1;
        margin-right: 5px;
        margin-bottom: 0;
    }

    @media (max-width: 768px) {
        flex-wrap: wrap;
        ${Input} {
            width: 100%;
            margin-right: 0;
            margin-bottom: 10px;
        }
    }
`;

const Signup = ({ handleSignupSuccess }) => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [emailCheck, setEmailCheck] = useState(false); // 이메일 중복 확인 여부
    const [nickName, setNickName] = useState('');
    const [nickNameError, setNickNameError] = useState('');
    const [nickNameCheck, setNickNameCheck] = useState(false); // 닉네임 중복 확인 여부
    const [emailDomain, setEmailDomain] = useState('');
    const [emailDomainSelect, setEmailDomainSelect] = useState('direct');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordConfirmError, setPasswordConfirmError] = useState('');
    const [passwordConfirmSuccess, setPasswordConfirmSuccess] = useState('');
    const [gender, setGender] = useState('');
    const [genderError, setGenderError] = useState('');
    const [veganType, setVeganType] = useState("");
    const [veganTypeError, setVeganTypeError] = useState('');
    const [preferredFoods, setPreferredFoods] = useState([]);
    const [foodOptionError, setFoodOptionError] = useState('');

    const [inputCode, setInputCode] = useState(''); // 사용자가 입력할 인증 코드
    const [showVerificationInput, setShowVerificationInput] = useState(false); // 인증 코드 입력 필드 표시 여부
    const [isVerified, setIsVerified] = useState(false); // 이메일 인증 완료 여부
    const [emailVerificationMessage, setEmailVerificationMessage] = useState(''); // 이메일 인증 관련 메시지
    const [isSendingEmail, setIsSendingEmail] = useState(false); // 이메일 발송 중 상태
    const [isVerifyingEmail, setIsVerifyingEmail] = useState(false); // 이메일 인증 중 상태

    const foodOptions = [
        "양식", "일식", "중식", "한식", "분식", "디저트", "기타 음식"
    ];

    const handleEmailChange = (val) => {
        setEmail(val);
        setEmailError('');
        setEmailCheck(false); // 이메일 변경 시 중복 확인 초기화
        setShowVerificationInput(false); // 이메일 변경 시 인증 필드 숨김
        setIsVerified(false); // 이메일 변경 시 인증 상태 초기화
        setEmailVerificationMessage(''); // 메시지 초기화
        setInputCode(''); // 입력 코드 초기화
    }

    const checkEmailButtonClick = async () => {
        const fullEmail = `${email}@${emailDomainSelect === 'direct' ? emailDomain : emailDomainSelect}`;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!email.trim() || (emailDomainSelect === 'direct' && !emailDomain.trim())) {
            setEmailError('이메일 주소를 입력해 주세요.');
            setEmailCheck(false);
            return;
        }
        if (!emailRegex.test(fullEmail)) {
            setEmailError("유효하지 않은 이메일 주소 입니다.");
            setEmailCheck(false);
            return;
        }

        try {
            // 백엔드에 이메일 중복 확인 요청
            const response = await AxiosInstance.get(`/api/users/check-email`, {
                params: { email: fullEmail },
            });

            if (response.data) { // 백엔드에서 true를 반환하면 중복
                setEmailError("이미 사용 중인 이메일입니다.");
                setEmailCheck(false);
            } else {
                setEmailError("사용 가능한 이메일입니다.");
                setEmailCheck(true);
            }
        } catch (err) {
            console.error("이메일 중복 확인 실패:", err);
            setEmailError("이메일 중복 확인 중 오류 발생");
            setEmailCheck(false);
        }
    };


    const checkNicknameButtonClick = async () => {
        if (!nickName.trim()) {
            setNickNameError("닉네임을 입력해 주세요");
            setNickNameCheck(false);
            return
        }
        try {
            const res = await AxiosInstance.get(`/api/users/check-nickname`, {
                params: { nickName }
            });

            if (res.data) {
                setNickNameError("중복된 닉네임 입니다");
                setNickNameCheck(false);
            } else {
                setNickNameError("사용 가능한 닉네임 입니다.");
                setNickNameCheck(true);
            }
        } catch (err) {
            console.error("닉네임 중복 확인 실패:", err);
            setNickNameError("중복 확인 중 오류 발생");
            setNickNameCheck(false);
        }
    };


    const handlePreferredFoodChange = (food) => {
        if (preferredFoods.includes(food)) {
            setPreferredFoods(preferredFoods.filter(item => item !== food));
        } else {
            if (veganType === 'non-vegan' && preferredFoods.length >= 3) {
                alert("선호 음식은 최대 3개까지 선택할 수 있습니다.")
                return;
            }
            setPreferredFoods([...preferredFoods, food]);
        }
    }

    const handleVeganTypeChange = (type) => {
        setVeganType(type);
        setVeganTypeError('');
        setPreferredFoods([]);
        setFoodOptionError('');
    }

    const handleGenderChange = (val) => {
        setGender(val);
        setGenderError('');
    }

    const validatePassword = () => {
        const passwordRegex = /^(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]{8,20}$/;

        if (!password.trim()) {
            setPasswordError("비밀번호를 입력해 주세요");
            return false;
        } else if (!passwordRegex.test(password)) {
            setPasswordError("비밀번호는 8~20자, 특수문자(!@#$%^&*)를 포함해야 합니다");
            return false;
        } else {
            setPasswordError("");
            return true;
        }
    }

    const validatePasswordConfirm = () => {
        const isPasswordValid = validatePassword();

        if (!passwordConfirm.trim()) {
            setPasswordConfirmError("비밀번호 확인을 입력해 주세요");
            setPasswordConfirmSuccess('');
            return false;
        } else if (password !== passwordConfirm) {
            setPasswordConfirmError("비밀번호가 일치하지 않습니다");
            setPasswordConfirmSuccess('');
            return false;
        } else if (!isPasswordValid) {
            setPasswordConfirmError("조건에 맞지 않는 비밀번호 입니다.");
            setPasswordConfirmSuccess("");
            return false;
        } else {
            setPasswordConfirmError("");
            setPasswordConfirmSuccess("비밀번호가 일치합니다.");
            return true;
        }
    }

    const handleSendVerificationCode = async () => {
        const fullEmail = `${email}@${emailDomainSelect === 'direct' ? emailDomain : emailDomainSelect}`;

        if (!fullEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fullEmail)) {
            setEmailVerificationMessage('유효한 이메일 주소를 입력해주세요.');
            return;
        }

        setIsSendingEmail(true);
        setEmailVerificationMessage('');

        try {
            // 백엔드 API에 이메일 인증 코드 발송 요청
            const response = await AxiosInstance.post('/api/email/send-code', { email: fullEmail });
            if (response.data.success) {
                setEmailVerificationMessage('인증 코드가 성공적으로 발송되었습니다. 메일을 확인해주세요.');
                setShowVerificationInput(true); // 인증 코드 입력 필드 표시
                setIsVerified(false); // 인증 상태 초기화
            } else {
                setEmailVerificationMessage(response.data.message || '인증 코드 발송에 실패했습니다.');
            }
        } catch (error) {
            console.error("이메일 인증 메일 발송 실패:", error.response?.data?.message || error.message);
            setEmailVerificationMessage("인증 메일 발송에 실패했습니다: " + (error.response?.data?.message || error.message));
        } finally {
            setIsSendingEmail(false);
        }
    };

    // 이메일 인증번호 확인 함수 (백엔드 연동)
    const handleVerifyCode = async () => {
        const fullEmail = `${email}@${emailDomainSelect === 'direct' ? emailDomain : emailDomainSelect}`;

        if (!inputCode.trim()) {
            setEmailVerificationMessage("인증번호를 입력해주세요.")
            return;
        }

        setEmailVerificationMessage("");
        setIsVerifyingEmail(true); // 이메일 인증 중 상태 시작

        try {
            // 백엔드 API에 이메일 인증 코드 확인 요청
            const response = await AxiosInstance.post('/api/email/verify-code', {
                email: fullEmail,
                code: inputCode
            });

            if (response.data.success) { // 백엔드 응답에 'success: true'가 있다고 가정
                setIsVerified(true);
                setEmailVerificationMessage('이메일이 인증되었습니다!');
                setShowVerificationInput(false); // 인증 완료 시 입력창 숨기기
            } else {
                setIsVerified(false);
                setEmailVerificationMessage(response.data.message || "인증번호가 일치하지 않습니다.");
            }
        } catch (error) {
            console.error("이메일 인증 오류:", error.response?.data?.message || error.message);
            setIsVerified(false);
            setEmailVerificationMessage("인증번호 확인 중 오류가 발생했습니다: " + (error.response?.data?.message || error.message));
        } finally {
            setIsVerifyingEmail(false); // 이메일 인증 중 상태 종료
        }
    }

    // ⭐ submit 함수: 모든 유효성 검사 및 백엔드 회원가입 요청만 처리 ⭐
    const submit = async () => {
        let hasError = false;

        const fullEmail = `${email}@${emailDomainSelect === 'direct' ? emailDomain : emailDomainSelect}`;
        if (!email.trim() || (emailDomainSelect === 'direct' && !emailDomain.trim())) {
            setEmailError('이메일을 입력해 주세요.');
            setEmailCheck(false);
            hasError = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fullEmail)) {
            setEmailError("유효하지 않은 이메일 주소 입니다.");
            setEmailCheck(false);
            hasError = true;
        } else if (!emailCheck) {
            setEmailError("이메일 중복 확인을 완료해 주세요.");
            hasError = true;
        } else {
            setEmailError("");
        }

        if(!nickName.trim()) {
            setNickNameError("닉네임을 입력해 주세요");
            setNickNameCheck(false);
            hasError = true;
        } else if (!nickNameCheck) {
            setNickNameError("닉네임 중복확인을 완료해 주세요");
            hasError = true;
        } else {
            setNickNameError("");
        }

        const isPasswordValid = validatePassword();
        const isPasswordConfirmValid = validatePasswordConfirm();

        if (!isPasswordValid || !isPasswordConfirmValid) {
            hasError = true;
        }

        if(!gender){
            setGenderError("성별을 선택해 주세요");
            hasError = true;
        } else {
            setGenderError('');
        }

        if (!veganType) {
            setVeganTypeError("음식 성향을 선택해 주세요");
            hasError = true;
        } else {
            setVeganTypeError('');
        }

        if(veganType === 'non-vegan' && preferredFoods.length === 0){
            setFoodOptionError("선호음식을 선택해 주세요");
            hasError = true;
        } else {
            setFoodOptionError("");
        }

        if (hasError) {
            alert("모든 필수 항목을 올바르게 입력해주세요.")
            return;
        }

        try {
            const firebaseAuth = getAuth(); // submit에서도 Auth 인스턴스를 가져옵니다.
            const userCredential = await createUserWithEmailAndPassword(firebaseAuth, fullEmail, password);

            const userProfileData = {
                email: fullEmail,
                nickname: nickName,
                gender: gender,
                veganType: veganType,
                preferredFoods: preferredFoods,
            };
            
            await handleSignupSuccess(fullEmail, password, userProfileData);

        } catch (err) {
            console.error("회원가입 실패:", err.code, err.message);
            if (err.code === 'auth/email-already-in-use') {
                alert("이미 가입된 이메일 주소입니다.");
            } else if (err.code === 'auth/weak-password') {
                alert("비밀번호는 6자 이상이어야 합니다.");
            } else {
                alert("회원가입에 실패했습니다: " + err.message);
            }
        }
    };

    return (
        <Container>
            <Box>
                <Title>회원가입</Title>

                <Label>이메일 </Label>
                <Input type="text" placeholder="이메일" value={email} onChange={(e) => handleEmailChange(e.target.value)} style={{ width: "64%" }} />
                <span style={{ marginLeft: "5px" }}>@</span>
                {emailDomainSelect === 'direct' ? (
                    <Input type="text" placeholder="직접 입력" value={emailDomain} onChange={(e) => setEmailDomain(e.target.value)} style={{ marginLeft: "5px", width: "22%" }} />
                ) : (
                    <Input type="text" value={emailDomain} disabled style={{ marginLeft: "5px", width: "22%" }} />
                )}

                <select
                    value={emailDomainSelect}
                    onChange={(e) => {
                        const selected = e.target.value;
                        setEmailDomainSelect(selected);
                        setEmailDomain(selected === 'direct' ? "" : selected);
                    }}
                    style={{
                        padding: "10px",
                        fontSize: "14px",
                        marginBottom: "20px",
                        width: "64%",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        marginTop: "10px",
                    }}
                >
                    <option value={"direct"}>직접입력</option>
                    <option value={"naver.com"}>naver.com</option>
                    <option value={"gmail.com"}>gmail.com</option>
                    <option value={"daum.net"}>daum.net</option>
                </select>

                <CheckButton
                    onClick={checkEmailButtonClick}
                    style={{ width: "22%", marginLeft: "25px", marginTop: "-30px" }}
                    disabled={emailCheck}
                >
                    {emailCheck ? "확인 완료" : "중복 확인"}
                </CheckButton>
                {emailCheck === true && (
                    <StyledButton
                        onClick={handleSendVerificationCode}
                        $bgColor={isVerified ? "#28a745" : "#FF8C00"} // 인증 완료 시 초록색
                        $hoverBgColor={isVerified ? "#218838" : "#e67e00"}
                        disabled={isVerified || isSendingEmail} // 발송 중이거나 인증 완료 시 비활성화
                    >
                        {isSendingEmail ? "발송 중..." : (isVerified ? "인증 완료" : "인증번호 발송")}
                    </StyledButton>
                )}

                {showVerificationInput && !isVerified && (
                    <EmailVerificationSection>
                        <StyledInput
                            type="text"
                            placeholder="인증번호 6자리를 입력해주세요"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value)}
                            disabled={isVerifyingEmail}
                        />
                        <StyledButton
                            onClick={handleVerifyCode}
                            disabled={isVerifyingEmail || !inputCode.trim()} // 인증 중이거나 코드 미입력 시 비활성화
                            style={{width:"24%" , marginLeft : "24px"}}
                        >
                            {isVerifyingEmail ? "확인 중..." : "인증번호 확인"}
                        </StyledButton>
                    </EmailVerificationSection>
                )}

                {emailVerificationMessage && (isVerified ? <SuccessText>{emailVerificationMessage}</SuccessText> : <ErrorText>{emailVerificationMessage}</ErrorText>)}
                {emailError && (!emailCheck ? <ErrorText>{emailError}</ErrorText> : <SuccessText>{emailError}</SuccessText>)}


                <Label>닉네임 </Label>
                <Input type="text" placeholder="닉네임" value={nickName} onChange={(e) => setNickName(e.target.value)} style={{ width: "64%" }} />
                <CheckButton onClick={checkNicknameButtonClick}>중복확인</CheckButton>
                <div style={{ fontSize: "12px", margintop: "-20px", display: "grid" }}>
                    {nickNameError && (nickNameCheck ? <SuccessText>{nickNameError}</SuccessText> : <ErrorText>{nickNameError}</ErrorText>)}
                </div>

                <Label>비밀번호 </Label>
                <Input
                    type="password"
                    placeholder="비밀번호는 8~20자, 특수문자를 포함해야 합니다."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: "89%" }}
                    onBlur={validatePassword} />
                <div style={{ fontSize: "12px", margintop: "-20px", display: "grid" }}>
                    {passwordError && <ErrorText>{passwordError}</ErrorText>}
                </div>

                <Label>비밀번호 확인 </Label>
                <Input
                    type="password"
                    placeholder="비밀번호 확인"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    style={{ width: "89%" }}
                    onBlur={validatePasswordConfirm} />
                <div>
                    {passwordConfirmError && <ErrorText>{passwordConfirmError}</ErrorText>}
                    {!passwordConfirmError && passwordConfirmSuccess && <SuccessText>{passwordConfirmSuccess}</SuccessText>}
                </div>

                <RadioGroup style={{ marginLeft: "-1px" }}>
                    <Label>성별 </Label>
                    {["남성", "여성", "선택 안 함"].map((g) => (
                        <label key={g}>
                            <Input
                                type="radio"
                                value={g}
                                name="gender"
                                checked={gender === g}
                                onChange={(e) => handleGenderChange(e.target.value)}
                                style={{ width: "5%", marginLeft: "10px" }} />
                            {" "}
                            {g}
                        </label>
                    ))}
                    {genderError && <ErrorText>{genderError}</ErrorText>}
                </RadioGroup>

                <Label>음식 성향 </Label>
                <RadioGroup>
                    <div style={{ marginBottom: "-2px" }}>
                        <label>
                            <input
                                type="radio"
                                value="vegan"
                                name="foodType"
                                checked={veganType === 'vegan'}
                                onChange={() => handleVeganTypeChange('vegan')}
                            />
                            비건
                        </label>
                        <label style={{ marginLeft: "20px" }}>
                            <input
                                type="radio"
                                value="non-vegan"
                                name="foodType"
                                checked={veganType === 'non-vegan'}
                                onChange={() => handleVeganTypeChange('non-vegan')}
                            />
                            논비건
                        </label>
                    </div>
                </RadioGroup>
                {veganTypeError && <ErrorText>{veganTypeError}</ErrorText>}

                {veganType === 'vegan' && (
                    <CheckboxGroup>
                        <label>
                            <Input
                                type="checkbox"
                                value="채식(비건)"
                                checked={preferredFoods.includes("채식(비건)")}
                                onChange={() => handlePreferredFoodChange("채식(비건)")}
                                style={{ width: "5%" }}
                            />
                            {" "}
                            채식(비건)
                        </label>
                    </CheckboxGroup>
                )}

                <HiddenRadioGroup isVisible={veganType === 'non-vegan'} >
                    {foodOptions.map((food) => (
                        <label key={food}>
                            <Input
                                type="radio"
                                value={food}
                                checked={preferredFoods.includes(food)}
                                onChange={() => handlePreferredFoodChange(food)}
                                style={{ width: "5%" }}
                                disabled={veganType === 'non-vegan' && preferredFoods.length >= 3 && !preferredFoods.includes(food)}
                            />
                            {" "}
                            {food}
                        </label>
                    ))}
                </HiddenRadioGroup>
                <div>
                    {foodOptionError && <ErrorText>{foodOptionError}</ErrorText>}
                </div>
                <Button onClick={submit} style={{ background: "#FF8C00", width: "94%" }}>회원가입</Button>
                <Button onClick={() => navigate('/login')} style={{ backgroundColor: "#ccc", color: "#000", marginTop: "20px", width: "94%" }}>
                    로그인으로 돌아가기
                </Button>

                <Button onClick={() => navigate('/')} style={{ backgroundColor: "#eee", color: "#000", marginTop: "10px", width: "94%" }}>
                    메인으로 돌아가기
                </Button>

            </Box>
        </Container>
    )
}

export default Signup;

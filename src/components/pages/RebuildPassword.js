import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import AxiosInstance from "./AxiosInstance";

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

const Title = styled.h2`
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30px;
`;

const InputGroup = styled.div`
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    align-items: center;
`;

const Input = styled.input`
    width: 100%;
    padding: 12px 14px;
    margin-bottom: 12px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 6px;
    &[type="radio"] {
        width: 5%;
        margin-right: 5px;
    }
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

const Label = styled.label`
  font-size: 20px;
  margin-bottom: 4px;
  display: block;
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

const RebuildPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // FindIdPassword에서 전달된 state 가져오기
    const { email: userEmail, verificationCode: userVerificationCode } = location.state || {};

    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordConfirmError, setPasswordConfirmError] = useState('');
    const [passwordConfirmSuccess, setPasswordConfirmSuccess] = useState('');
    const [message, setMessage] = useState(''); // 성공/오류 메시지
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'
    const [loading, setLoading] = useState(false); // 로딩 상태

    const validateNewPassword = () => {
        const passwordRegex = /^(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]{8,20}$/;
        
        if(!newPassword.trim()){
            setPasswordError("비밀번호를 입력해 주세요");
            return false;
        } else if(!passwordRegex.test(newPassword)){
            setPasswordError("비밀번호는 8~20자, 특수문자(!@#$%^&*)를 포함해야 합니다");
            return false;
        } else {
            setPasswordError("");
            return true;
        }
    }

    const validateConfirmNewPassword = () => {
        const isPasswordValid = validateNewPassword();

        if (!newPasswordConfirm.trim()) {
            setPasswordConfirmError("비밀번호 확인을 입력해 주세요");
            setPasswordConfirmSuccess('');
            return false;
        } else if (newPassword !== newPasswordConfirm) {
            setPasswordConfirmError("비밀번호가 일치하지 않습니다");
            setPasswordConfirmSuccess('');
            return false;
        } else if(!isPasswordValid){
            setPasswordConfirmError("조건에 맞지 않는 비밀번호 입니다.");
            setPasswordConfirmSuccess("");
            return false;
        } else{
            setPasswordConfirmError("");
            setPasswordConfirmSuccess("비밀번호가 일치합니다.");
            return true;
        }
    }

    const handleSubmit = async () => {
        setMessage(''); // 메시지 초기화
        setMessageType('');
        setLoading(true);

        const isNewPasswordValid = validateNewPassword();
        const isConfirmNewPasswordValid = validateConfirmNewPassword();

        if (!isNewPasswordValid || !isConfirmNewPasswordValid) {
            setLoading(false);
            setMessage("모든 필수 항목을 올바르게 입력해주세요.");
            setMessageType('error');
            return;
        }

        if (!userEmail || !userVerificationCode) {
            setLoading(false);
            setMessage("이메일 또는 인증 코드가 유효하지 않습니다. 다시 시도해주세요.");
            setMessageType('error');
            return;
        }

        try {
                const payload = {
                email: userEmail,
                verificationCode: userVerificationCode,
                newPassword: newPassword
            };

            const response = await AxiosInstance.post('/api/users/reset-password', payload);

            const data = response.data;

            if (response.status === 200 && data.success) {
                setMessage("비밀번호가 성공적으로 재설정되었습니다. 이제 새 비밀번호로 로그인할 수 있습니다.");
                setMessageType('success');
                // 성공적으로 재설정되면 로그인 페이지로 이동
                setTimeout(() => {
                    navigate('/login');
                }, 1000); // 1초 후 이동
            } else {
                setMessage(data.message || "비밀번호 재설정에 실패했습니다.");
                setMessageType('error');
            }
        } catch (error) {
           if (error.response && error.response.data && error.response.data.message) {
                setMessage(error.response.data.message);
            } else if (error.message) {
                setMessage(`비밀번호 재설정 중 오류가 발생했습니다: ${error.message}`);
            } else {
                setMessage("비밀번호 재설정 중 알 수 없는 오류가 발생했습니다.");
            }
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    return(
        <Container>
            <Title>비밀번호 재설정</Title>
            <InputGroup>
            <Label>비밀번호 </Label>
                <Input
                    type="password"
                    placeholder="비밀번호는 8~20자, 특수문자를 포함해야 합니다."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} 
                    onBlur={validateNewPassword}/>
                <div>
                    {passwordError && <ErrorText>{passwordError}</ErrorText>}
                </div>
            </InputGroup>
            <InputGroup>
                <Label>비밀번호 확인 </Label>
                <Input
                    type="password"
                    placeholder="비밀번호확인"
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    onBlur={validateConfirmNewPassword}/>
                <div>
                    {passwordConfirmError && <ErrorText>{passwordConfirmError}</ErrorText>}
                    {!passwordConfirmError && passwordConfirmSuccess && <SuccessText>{passwordConfirmSuccess}</SuccessText>}
                </div>
            </InputGroup>
            <Button onClick={handleSubmit}>저장</Button>
            <Button onClick={() => navigate('/login')} >
                로그인 페이지로 돌아가기
            </Button>
        </Container>
    )
}

export default RebuildPassword;
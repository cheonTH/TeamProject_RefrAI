import axios from "axios";
import { getAuth } from "firebase/auth";

const FridgeApiClient = axios.create({
    baseURL: process.env.REACT_APP_SPRING_BACKEND_URL || 'http://springboot-developer-team-ai-env.eba-qnmitp3d.ap-northeast-2.elasticbeanstalk.com',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

const showGlobalMessage = (message) => {
    const event = new CustomEvent('show-modal-message', { detail: message });
    window.dispatchEvent(event);
};

// --- 요청 인터셉터 ---
// 모든 요청이 서버로 전송되기 전에 JWT 토큰을 자동으로 추가합니다.
FridgeApiClient.interceptors.request.use(
    async (config) => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
            try {
                // user.getIdToken()은 항상 유효한 최신 토큰을 반환합니다. (필요 시 자동 갱신)
                const token = await user.getIdToken();
                config.headers.Authorization = `Bearer ${token}`;
            } catch (error) {
                console.error("FridgeApiClient - 인터셉터: 토큰을 가져오는 데 실패했습니다.", error);
                // 토큰 가져오기 실패 시, 요청을 중단하거나 특정 처리를 할 수 있습니다.
                return Promise.reject(error);
            }
        } else {
            console.log("FridgeApiClient - 인터셉터: 로그인된 사용자가 없어 Authorization 헤더 설정을 생략합니다.");
        }
        return config;
    },
    (error) => Promise.reject(error)
);


// --- 응답 인터셉터 ---
// 서버로부터 받은 응답을 중앙에서 관리합니다. (주로 에러 처리)
FridgeApiClient.interceptors.response.use(
    // 성공 응답은 그대로 반환
    (response) => response,
    
    // 에러가 발생했을 때 실행
    (error) => {
        console.error("API Response Error:", error);

        // 1. 서버가 아예 응답하지 않는 경우 (서버가 꺼져있거나 네트워크 문제)
        if (!error.response) {
            showGlobalMessage('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        } 
        // 2. 서버가 응답했지만, 에러 코드를 보낸 경우
        else {
            switch (error.response.status) {
                case 401: // 인증 실패 (예: 유효하지 않은 토큰)
                    showGlobalMessage('인증에 실패했습니다. 다시 로그인해주세요.');
                    // 필요 시, 여기서 자동으로 로그아웃 처리 및 로그인 페이지로 이동시킬 수 있습니다.
                    // window.location.href = '/login';
                    break;
                case 403: // 권한 없음
                    showGlobalMessage('이 작업을 수행할 권한이 없습니다.');
                    break;
                case 404: // 찾을 수 없음
                    showGlobalMessage('요청한 내용을 찾을 수 없습니다.');
                    break;
                case 500: // 서버 내부 오류
                    showGlobalMessage('서버에 문제가 발생했습니다. 관리자에게 문의해주세요.');
                    break;
                default: // 그 외의 다른 에러
                    showGlobalMessage(`오류가 발생했습니다: ${error.message}`);
                    break;
            }
        }
        
        // 처리된 에러를 다음 catch 블록으로 전달합니다.
        return Promise.reject(error);
    }
);


export default FridgeApiClient;
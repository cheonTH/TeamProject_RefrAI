// src/components/pages/AxiosInstance.js
import axios from 'axios';

const AxiosInstance = axios.create({
    // ✅ 스프링 부트 백엔드 URL로 설정
    baseURL: process.env.REACT_APP_SPRING_BACKEND_URL, 
    timeout: 5000, // 요청 타임아웃
    headers: {
        'Content-Type': 'application/json',
    },
});

AxiosInstance.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // ⭐ 중요: FormData인 경우 Content-Type 헤더를 삭제하여 Axios와 브라우저가 자동으로 처리하도록 합니다.
        // 이렇게 해야 'multipart/form-data; boundary=...'가 제대로 전송됩니다.
        if (config.data instanceof FormData) {
            // FormData인 경우, Content-Type 헤더를 삭제합니다.
            // Axios와 브라우저가 이 헤더를 자동으로 설정하고 boundary도 추가하도록 합니다.
          
            delete config.headers['Content-Type']; 
        } else if (config.method === 'post' || config.method === 'put' || config.method === 'patch') {
            // POST, PUT, PATCH 요청이고 FormData가 아닌 경우, application/json으로 설정
            config.headers['Content-Type'] = 'application/json';
        } else {
            // 그 외의 경우 (GET, DELETE 등), Content-Type을 삭제하거나 설정하지 않음
            delete config.headers['Content-Type'];
        }
        
        return config;
    },
    (error) => {
        // 요청 오류 처리
        console.error("Axios Interceptor: Request error:", error);
        return Promise.reject(error);
    }
);

AxiosInstance.interceptors.response.use(
    (response) => {
        // 응답 성공 처리
        return response;
    },
    (error) => {
        // 응답 오류 처리
        console.error("Axios Interceptor: Response error:", error);
        if (error.response) {
            // 서버가 응답했지만 상태 코드가 2xx 범위를 벗어나는 경우
            console.error("Axios Interceptor: Response error data:", error.response.data);
            console.error("Axios Interceptor: Response error status:", error.response.status);
            console.error("Axios Interceptor: Response error headers:", error.response.headers);
        } else if (error.request) {
            // 요청이 만들어졌지만 응답을 받지 못한 경우 (예: 네트워크 오류)
            console.error("Axios Interceptor: No response received:", error.request);
        } else {
            // 요청 설정 중 오류가 발생한 경우
            console.error("Axios Interceptor: Error setting up request:", error.message);
        }
        return Promise.reject(error);
    }
);

export default AxiosInstance;

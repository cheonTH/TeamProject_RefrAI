import { useEffect } from "react";

const CustomModal = ({ message, onClose, duration = 2500 }) => {
    
    // useEffect를 사용하여 message prop의 변경을 감지합니다.
    useEffect(() => {
        // 1. 표시할 메시지가 있을 경우에만 타이머를 설정합니다.
        if (message) {
            const timer = setTimeout(() => {
                // 2. duration 시간 후에 onClose 함수를 호출하여 모달을 닫습니다.
                if (typeof onClose === 'function') {
                    onClose();
                }
            }, duration);

            // 3. 클린업(Cleanup) 함수:
            //    - 컴포넌트가 사라지거나,
            //    - 새로운 메시지가 들어와 useEffect가 다시 실행되기 전에
            //    기존 타이머를 제거하여 메모리 누수를 방지합니다.
            return () => clearTimeout(timer);
        }
    }, [message, onClose, duration]); // message, onClose, duration이 바뀔 때마다 이 효과를 재실행합니다.

    // 표시할 메시지가 없으면 아무것도 렌더링하지 않습니다.
    if (!message) {
        return null;
    }

    // 모달 UI 렌더링
    // 이제 '확인' 버튼 없이, 메시지만 잠시 보여주고 사라집니다.
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-25 flex items-start justify-center pt-20 z-[100]">
            <div className="bg-white p-4 rounded-lg max-w-sm w-full text-center shadow-2xl animate-fade-in-down">
                <p className="text-md font-semibold text-gray-800">{message}</p>
            </div>
        </div>
    );
};

export default CustomModal;

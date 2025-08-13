// src/components/LoadingOverlay.js
import React from 'react';
import '../App.css'; // App.css에 정의된 스타일 사용

const LoadingOverlay = ({ message }) => {
    return (
        <div className="loading-overlay">
            <div className="loading-content">
                {/* 냄비 이모지와 김 애니메이션 */}
                <div className="cooking-animation">
                    <span role="img" aria-label="cooking pot" className="cooking-pot-emoji">🍲</span>
                    <div className="steam-container">
                        <span className="steam steam-1"></span>
                        <span className="steam steam-2"></span>
                        <span className="steam steam-3"></span>
                    </div>
                </div>
                <p className="loading-message-text">{message}</p>
                <div className="loading-spinner-small"></div> {/* 작은 로딩 스피너도 함께 */}
            </div>
        </div>
    );
};

export default LoadingOverlay;

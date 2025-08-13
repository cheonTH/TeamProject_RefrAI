// src/Header.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// headerRef를 props로 받도록 수정
function Header({ isLoggined, handleLogout, headerRef }) { 
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    // nav 태그에 ref 연결
    <nav className="top-nav" ref={headerRef}> 
      <div className="header-content-wrapper">
        <Link to="/" className="logo">나만의냉장고레시피</Link>

        <div className="nav-links">
          <Link to="/" className={`nav-button ${currentPath === '/' ? 'active' : ''}`}>
            요리연구소
          </Link>
          <Link to="/customer-service" className={`nav-button ${currentPath.startsWith('/customer-service') ? 'active' : ''}`}>
            고객센터
          </Link>
          <Link to="/community" className={`nav-button ${currentPath.startsWith('/community') ? 'active' : ''}`}>
            게시글
          </Link>
          <Link to="/refrigerator" className={`nav-button ${currentPath === '/refrigerator' ? 'active' : ''}`}>
            내 냉장고 관리
          </Link>

          {isLoggined && (<Link to="/my-recipes" className={`nav-button ${currentPath === '/my-recipes' ? 'active' : ''}`}>
            내 레시피 보관함
          </Link>)}
        </div>

        <div className="user-actions">
          {isLoggined ? (
            <>
              {/* <Link to="/my-page" className={`nav-button ${currentPath.startsWith('/my-page') ? 'active' : ''}`}>
                마이페이지
              </Link>
              <button onClick={handleLogout} className="nav-button">
                로그아웃
              </button> */}
            </>
          ) : (
            <Link to="/login" className={`nav-button ${currentPath === '/login' ? 'active' : ''}`}>
              로그인
            </Link>
          )}
          
          {/* {isLoggined && (<Link to="/my-recipes" className={`nav-button nav-button-highlight ${currentPath === '/my-recipes' ? 'active' : ''}`}>
            내 레시피 보관함
          </Link>)} */}
        </div>
      </div>
    </nav>
  );
}

export default Header;

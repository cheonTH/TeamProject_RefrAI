// src/components/CustomerServiceChatbot.js
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // 🔹 useNavigate 추가
import './board/Board.css';
import '../App.css';
import BoardCardItem from './board/BoardCardItem';

const CustomerServiceChatbot = ({ backendUrl }) => {
  // ── 챗봇 상태 ─────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [activeTab, setActiveTab] = useState('ai');

  // 🔹 네비게이터 & 사용자 이메일
  const navigate = useNavigate();
  const userEmail = sessionStorage.getItem('email');

  // ── 공지사항 상태 ─────────────────────────────────────────
  const springBackendUrl = process.env.REACT_APP_SPRING_BACKEND_URL;
  const [noticeList, setNoticeList] = useState([]);
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [noticeError, setNoticeError] = useState('');
  const [noticePage, setNoticePage] = useState(1);
  const noticesPerPage = 9; // Board.js postsPerPage와 동일

  // 초기 챗봇 환영 메시지
  useEffect(() => {
    setMessages([
      {
        sender: 'ai',
        text:
          '안녕하세요! 저는 나만의 냉장고 레시피 앱의 AI 챗봇 쿡이입니다. 무엇을 도와드릴까요? 레시피, 앱 사용법, 오류 등 무엇이든 물어보세요!',
      },
    ]);
  }, []);

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 공지사항 데이터 로드
  useEffect(() => {
    if (activeTab !== 'notice') return;

    const fetchNotices = async () => {
      setNoticeLoading(true);
      setNoticeError('');
      try {
        const token = sessionStorage.getItem('token');
        const email = sessionStorage.getItem('email');

        const headers = {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(email && { email }),
        };

        const res = await fetch(`${springBackendUrl}/api/board`, { headers });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `HTTP ${res.status}`);
        }

        const json = await res.json();
        const all = Array.isArray(json?.data) ? json.data : [];

        const onlyNotices = all
          .filter((p) => String(p.category || '').toLowerCase() === 'notice')
          .sort(
            (a, b) =>
              new Date(b.writingTime || b.createdAt || 0) -
              new Date(a.writingTime || a.createdAt || 0)
          );

        setNoticeList(onlyNotices);
        setNoticePage(1);
      } catch (e) {
        console.error('공지사항 로드 실패:', e);
        setNoticeError('공지사항을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setNoticeLoading(false);
      }
    };

    fetchNotices();
  }, [activeTab, springBackendUrl]);

  // 챗봇 전송
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const userMessage = inputMessage.trim();
    if (!userMessage) return;

    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch(`${backendUrl}/chatbot-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await response.json();

      if (response.ok && data.ai_response) {
        setMessages((prev) => [...prev, { sender: 'ai', text: data.ai_response }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: '죄송합니다. 현재 상담이 어렵습니다. 잠시 후 다시 시도해주세요.' },
        ]);
        console.error('챗봇 응답 오류:', data.error || '알 수 없는 오류');
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.' },
      ]);
      console.error('챗봇 API 호출 중 오류 발생:', error);
    } finally {
      setIsTyping(false);
    }
  };

  // 공지사항 페이징
  const totalNoticePages = Math.max(1, Math.ceil(noticeList.length / noticesPerPage));
  const firstIdx = (noticePage - 1) * noticesPerPage;
  const currentNotices = noticeList.slice(firstIdx, firstIdx + noticesPerPage);

  return (
    <div>
      <div className="main-section-header">
        <h2 className="board-titles">{activeTab === 'notice' ? "공지사항" : "AI 챗봇 상담 (쿡이)"}</h2> <></>
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            AI 챗봇 상담 (쿡이)
          </button>
          <button
            className={`tab-button ${activeTab === 'notice' ? 'active' : ''}`}
            onClick={() => setActiveTab('notice')}
          >
            공지사항
          </button>
        </div>
      </div>

      {/* ─────────── AI 챗봇 ─────────── */}
      {activeTab === 'ai' && (
        <section className="customer-service-chatbot-container">
          {/* <h2>AI 챗봇 상담 (쿡이)</h2> */}
          <div className="chat-window">
            <div className="messages-display">
              {messages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.sender}`}>
                  <div className="message-bubble">{msg.text}</div>
                </div>
              ))}
              {isTyping && (
                <div className="chat-message ai typing">
                  <div className="message-bubble">쿡이가 응답을 작성 중입니다...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="message-input-form">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                disabled={isTyping}
              />
              <button type="submit" disabled={isTyping}>
                전송
              </button>
            </form>
          </div>
        </section>
      )}

      {/* ─────────── 공지사항(클래스명 Board.js와 동일) ─────────── */}
      {activeTab === 'notice' && (
        <section className="board-container">
          <div className="board-main-container">
            {/* <h2 className="board-titles">공지사항</h2> */}

            {/* 🔐 특정 이메일에게만 글쓰기 버튼 노출 */}
            {userEmail === 'refrmanager00@gmail.com' && (
              <div className="board-button-container">
                <button
                  className="board-button-right"
                  onClick={() => navigate('/community/write')}
                >
                  글쓰기
                </button>
              </div>
            )}

            {noticeLoading && <p className="notice-loading">불러오는 중…</p>}
            {noticeError && <p className="notice-error">{noticeError}</p>}

            {!noticeLoading && !noticeError && (
              <>
                <div className="board-items card-view">
                  {currentNotices.length > 0 ? (
                    currentNotices.map((post) => (
                      <Link className="board-item-link" to={`/customer-service/${post.id}`} key={post.id}>
                        <BoardCardItem
                          id={post.id}
                          title={post.title}
                          author={post.nickName}
                          writeTime={post.writingTime || post.createdAt}
                          imageUrl={post.imageUrls?.[0] || ''}
                          likeCount={post.likeCount || 0}
                          cookingTime={post.cookingTime}
                          difficulty={post.difficulty}
                          category={post.category} // 'notice'
                          isSaved={post.isSaved}
                          commentCount={post.commentCount}
                        />
                      </Link>
                    ))
                  ) : (
                    <p className="no-result">공지사항이 없습니다.</p>
                  )}
                </div>

                {totalNoticePages > 1 && (
                  <div className="board-pagination">
                    {Array.from({ length: totalNoticePages }).map((_, i) => {
                      const p = i + 1;
                      return (
                        <button
                          key={p}
                          className={noticePage === p ? 'selected' : ''}
                          onClick={() => setNoticePage(p)}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default CustomerServiceChatbot;

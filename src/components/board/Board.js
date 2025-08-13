// src/components/board/Board.js
import React, { useContext, useState, useEffect } from 'react';
import './Board.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { BoardContext } from './context/BoardContext';
import BoardCardItem from './BoardCardItem';
import BoardCardItemWithNickname from './BoardCardNicknameItem';
import LoadingOverlay from '../LoadingOverlay';

function Board() {
    const [value, setValue] = useState('');
    const [search, setSearch] = useState('');
    const [searchResult, setSearchResult] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [postsPerPage] = useState(9);
    const [totalPages, setTotalPages] = useState(1);
    const [boardNav, setBoardNav] = useState('');
    const [activeTab, setActiveTab] = useState('share');
    const [myBoardFilter, setMyBoardFilter] = useState('written');
    const [loading, setLoading] = useState(true);

    const { boardList, setBoardList } = useContext(BoardContext);
    const navigate = useNavigate();
    const location = useLocation();

    const springBackendUrl = process.env.REACT_APP_SPRING_BACKEND_URL

    const token = sessionStorage.getItem("token");

    const filteredPosts = [...boardList]
        .reverse()
        .filter(post => {
            const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase())||
                post.ingredients?.toLowerCase().includes(search.toLowerCase())||
                post.content?.toLowerCase().includes(search.toLowerCase());

            if (boardNav === 'pop' || boardNav === 'suggest') {
                return activeTab === 'share';
            }

            if (activeTab === 'share' && ['질문', '(아기)이유식', '(아기)밥', 'notice'].includes(post.category)) return false;
            if (activeTab === 'question' && post.category !== '질문') return false;
            if (activeTab === 'notice' && post.category !== 'notice') return false;
            if (activeTab === 'baby' && !['(아기)전체', '(아기)이유식', '(아기)밥'].includes(post.category)) return false;

            if (activeTab === 'my') {
                const userEmail = sessionStorage.getItem('email');
                if (!userEmail) return false;
                if (myBoardFilter === 'written') return post.email === userEmail && matchesSearch;
                if (myBoardFilter === 'saved') return post.isSaved && matchesSearch;
            }


            const matchesCategory = boardNav === '' || boardNav === 'all' || post.category === boardNav;
            return matchesSearch && matchesCategory;
        });

    let processedPosts = [...filteredPosts];
    if (activeTab === 'share') {
        if (boardNav === 'pop') {
            processedPosts = processedPosts
                .filter(post => post.likeCount > 0)
                .filter(post => post.category !== '질문')
                .filter(post => post.category !== 'notice')
                .sort((a, b) => b.likeCount - a.likeCount)
                .slice(0, 5);
        } else if (boardNav === 'suggest') {
            processedPosts = processedPosts
                .filter(post => post.category !== '질문')
                .sort(() => Math.random() - 0.5).slice(0, 5);
        }
    }

    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = processedPosts.slice(indexOfFirstPost, indexOfLastPost);

    useEffect(() => {
        const total = Math.ceil(processedPosts.length / postsPerPage);
        setTotalPages(total);
    }, [processedPosts, postsPerPage]);

    useEffect(() => {
        const fetchBoardList = async () => {
            setLoading(true); // 🟢 요청 시작 전 로딩 ON
            try {
                let jwtToken = null;

                const firebaseUser = window.firebaseAuth?.currentUser;
                if (firebaseUser) {
                    try {
                        const firebaseToken = await firebaseUser.getIdToken();
                        const loginResponse = await axios.post(
                            `${springBackendUrl}/api/users/firebase-login`,
                            { firebaseToken },
                            { headers: { "Content-Type": "application/json" } }
                        );
                        jwtToken = loginResponse.data.token;
                        sessionStorage.setItem("token", jwtToken);

                        console.log("token". jwtToken)
                    } catch (loginErr) {
                        console.warn("❌ firebase-login 실패:", loginErr.message);
                    }
                } else {
                    jwtToken = sessionStorage.getItem("token");
                    console.log("🟡 로그인되지 않음 → firebase-login 생략");
                    console.log("token". jwtToken)
                }

                const email = sessionStorage.getItem('email');
                const headers = {
                ...(jwtToken && { Authorization: `Bearer ${jwtToken}` }),
                ...(email && { email: email })  // 🔴 이메일을 헤더에 추가
                };

                const boardResponse = await axios.get(`${springBackendUrl}/api/board`, { headers });


                if (boardResponse.data?.data) {
                    setBoardList(boardResponse.data.data);
                }
            } catch (err) {
                console.error("❌ 게시글 목록 요청 중 오류:", err);
            } finally {
                setLoading(false); // 🔴 완료 후 로딩 OFF
            }
        };

        fetchBoardList();
    }, [setBoardList]);

    const handleAddPost = () => {
        if (token) navigate('/community/write');
        else alert('로그인이 필요합니다.');
    };

    const handleBoardHome = () => {
        navigate('/community');
        setSearchResult(false);
        setValue('');
        setSearch('');
    };

    const handleSearch = () => {
        if (value.trim() !== '') {
            setSearch(value);
            setCurrentPage(1);
            setSearchResult(true);
        } else {
            console.log('검색할 내용을 입력해주세요');
        }
    };

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleboardcategory = (e) => {
        const selected = e.target.value;
        setBoardNav(selected);
    };

    if (loading) {
        return <LoadingOverlay message="게시글 불러오는 중" />;
    }

    return (
        <div>
            {searchResult ? 
                <h1>'{search}' 검색 결과</h1>
                :
                <div className="main-section-header">
                    <h2 className='board-titles'>게시글</h2>
                    <div className="tabs">
                        <button className={`tab-button ${activeTab === 'share' ? 'active' : ''}`} onClick={() => {
                            setActiveTab('share');
                            setBoardNav('');
                            setSearchResult(false);
                            setValue('');
                            setSearch('');
                        }}>레시피 공유 게시판</button>
                        <button className={`tab-button ${activeTab === 'question' ? 'active' : ''}`} onClick={() => {
                            setActiveTab('question');
                            setBoardNav("질문");
                            setSearchResult(false);
                            setValue('');
                            setSearch('');
                        }}>질문 게시판</button>
                        <button className={`tab-button ${activeTab === 'baby' ? 'active' : ''}`} onClick={() => {
                            setActiveTab('baby');
                            setBoardNav('');
                            setSearchResult(false);
                            setValue('');
                            setSearch('');
                        }}>아기 레시피 게시판</button>
                        {token && <button className={`tab-button ${activeTab === 'my' ? 'active' : ''}`} onClick={() => {
                            setActiveTab('my');
                            setBoardNav('');
                            setSearchResult(false);
                            setValue('');
                            setSearch('');
                        }}>내 게시글 보관함</button>}
                    </div>
                </div>
            }

            <div className="board-container">
                <div className='board-main-container'>
                    {activeTab !== 'my' && 
                        <div className='board-button-container'>
                            <select value={boardNav} onChange={handleboardcategory} className="category-select">
                                {activeTab === 'baby' && <>
                                    <option value="">(아기)전체</option>
                                    <option value="(아기)이유식">(아기)이유식</option>
                                    <option value="(아기)밥">(아기)밥</option>
                                </>}
                                {activeTab === 'question' && <option value="질문">질문</option>}
                                {activeTab === 'share' && <>
                                    <option value="">카테고리 선택</option>
                                    <option value="한식">한식</option>
                                    <option value="중식">중식</option>
                                    <option value="일식">일식</option>
                                    <option value="양식">양식</option>
                                    <option value="디저트">디저트</option>
                                </>}
                            </select>
                            {searchResult ? 
                                <button onClick={handleBoardHome} className='board-button-right'>게시판</button>
                                :
                                <button onClick={handleAddPost} className='board-button-right'>글쓰기</button>
                            }
                        </div>
                    }

                    {activeTab === 'my' &&
                        <div className="my-board-filter">
                            <button className={`tag ${myBoardFilter === 'written' ? 'active' : ''}`} onClick={() => {setMyBoardFilter('written'); setSearch(''); setValue(''); setActiveTab('my')}} style={{marginRight:10}}>내가 쓴 글</button>
                            <button className={`tag ${myBoardFilter === 'saved' ? 'active' : ''}`} onClick={() => {setMyBoardFilter('saved'); setSearch(''); setValue(''); setActiveTab('my')}}>저장한 글</button>
                        </div>
                    }

                    {activeTab === 'share' &&
                        <div className='board-category-buttons'>
                            <button className={`non-active-button ${boardNav === '' ? 'active-button' : ''}`} onClick={() => setBoardNav('')}>전체</button>
                            <button className={`non-active-button ${boardNav === 'pop' ? 'active-button' : ''}`} onClick={() => setBoardNav('pop')}>인기</button>
                            <button className={`non-active-button ${boardNav === 'suggest' ? 'active-button' : ''}`} onClick={() => setBoardNav('suggest')}>추천</button>
                        </div>
                    }

                    <div className='board-items card-view'>
                        {currentPosts.length > 0 ? currentPosts.map(post => (
                            <Link className="board-item-link" to={`/community/${post.id}`} key={post.id}>
                                <BoardCardItem
                                    id={post.id}
                                    title={post.title}
                                    author={post.nickName}
                                    writeTime={post.writingTime}
                                    imageUrl={post.imageUrls?.[0] || ""}
                                    likeCount={post.likeCount}
                                    cookingTime={post.cookingTime}
                                    difficulty={post.difficulty}
                                    category={post.category}
                                    isSaved={post.isSaved}
                                    commentCount={post.commentCount}
                                />
                            </Link>
                        )) : <p className="no-result">게시글이 없습니다.</p>}
                    </div>

                    <div className='board-search-container'>
                        <input
                            className='board-input'
                            type='text'
                            placeholder={activeTab !== 'question' && activeTab !== 'my' ? '요리명 또는 재료를 입력해주세요.' : '검색'}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button onClick={handleSearch}>검색</button>
                    </div>

                    <div className='board-pagination'>
                        {[...Array(totalPages).keys()].map((number) => (
                            <button
                                key={number + 1}
                                className={currentPage === number + 1 ? "selected" : ""}
                                onClick={() => paginate(number + 1)}
                            >
                                {number + 1}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Board;

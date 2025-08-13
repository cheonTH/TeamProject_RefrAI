import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Board.css";
import axios from "axios";
import CommentSection from "./CommentSelect";
import { BoardContext } from "./context/BoardContext";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getApp } from "firebase/app";

const getAppId = () => typeof __app_id !== 'undefined' ? __app_id : 'local-dev-app-id';

const BoardDetail = (gotoNotice) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [mainImage, setMainImage] = useState(null);
    const [ingredientImages, setIngredientImages] = useState([]);
    const [recipeSteps, setRecipeSteps] = useState([]);
    const [ingredientImageIndex, setIngredientImageIndex] = useState(0);
    const [showSaveMessage, setShowSaveMessage] = useState(false);
    const [imageUrls, setImageUrls] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [authorNickname, setAuthorNickname] = useState('');
    const [lastSavedState, setLastSavedState] = useState(null); // true 또는 false

    const { handleSaveClick } = useContext(BoardContext);

    const springBackendUrl = process.env.REACT_APP_SPRING_BACKEND_URL

    const fetchPost = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.get(`${springBackendUrl}/api/board/${id}`, { headers });

            const fetchedPost = res.data;

            console.log("post", fetchedPost);

            const fetchedImageUrls = Array.isArray(fetchedPost.imageUrls) ? fetchedPost.imageUrls : [];
            setImageUrls(fetchedImageUrls);
            setMainImage(fetchedImageUrls[0] || null);
            setIngredientImages(fetchedImageUrls.slice(1));

            setPost({
                ...fetchedPost,
                isLiked: fetchedPost.isLiked ?? fetchedPost.liked ?? false,
                isSaved: fetchedPost.isSaved ?? fetchedPost.saved ?? false,
            });

            setRecipeSteps(fetchedPost.recipeSteps || []);
        } catch (err) {
            console.error("게시글 불러오기 실패:", err);
        }
    };

    useEffect(() => {
        fetchPost();
    }, [id]);

    useEffect(() => {
        const fetchNickname = async () => {
            if (!post || !post.email) return;

            try {
                const db = getFirestore(getApp());
                const docRef = doc(db, `artifacts/${getAppId()}/users/${post.email}/user_profile/data`);
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    const data = snap.data();
                    setAuthorNickname(data.nickname || post.nickName || "");
                } else {
                    console.warn("⚠️ Firestore 닉네임 문서 없음");
                    setAuthorNickname(post.nickName || "");
                }
            } catch (err) {
                console.error("❌ Firestore 닉네임 조회 실패:", err);
                setAuthorNickname(post.nickName || "");
            }
        };

        fetchNickname();
    }, [post]); // ✅ post 전체가 바뀔 때만 호출


    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => Math.max(prev - 1, 0));
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => Math.min(prev + 1, imageUrls.length - 1));
    };

    const handleLike = async () => {
        const token = sessionStorage.getItem("token");
        if (!token || token === "null") alert("로그인이 필요합니다");

        try {
            const res = await axios.post(
                `${springBackendUrl}/api/board/${post.id}/like`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setPost(prev => ({
                ...prev,
                isLiked: res.data.liked,
                likeCount: res.data.likeCount
            }));
        } catch (err) {
            console.error("좋아요 처리 실패:", err);
        }
    };

    const handleSave = async () => {
        const token = sessionStorage.getItem("token");
        if (!token || token === "null") return alert("로그인이 필요합니다");

        try {
            const saved = await handleSaveClick(post.id);
            if (saved !== null) {
                setLastSavedState(saved); // ✅ 새 상태로 메시지 표시
                setShowSaveMessage(true);
                setPost(prev => ({ ...prev, isSaved: saved }));
                setTimeout(() => setShowSaveMessage(false), 2000);
            }
        } catch (err) {
            console.error("저장 처리 실패:", err);
        }
    };


    const handleDelete = async () => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;

        const token = sessionStorage.getItem("token");
        const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
        try {
            await axios.delete(`${springBackendUrl}/api/board/${id}`, { headers });
            navigate('/community');
        } catch (err) {
            console.error("삭제 실패:", err);
        }
    };

    if (!post) return <p>게시글을 불러오는 중입니다...</p>;

    return (
        <div className="board-detail">
            <h2 className="center-title">{post.title}</h2>

            <div className="board-detail-info">
                <div>
                    <p>작성자: {authorNickname} | {post.writingTime}</p>
                </div>
                <div>
                    {!['질문', 'notice'].includes(post.category) && <p>🔥난이도:{post.difficulty} | ⏱요리 시간:{post.cookingTime}분</p>}
                </div>
            </div>

            {!['질문', 'notice'].includes(post.category) && (
                <>
                    <div className="recipe-row">
                        <div className="recipe-image-wrapper">
                            {mainImage && <img src={mainImage} alt="대표 이미지" className="main-recipe-image" />}
                        </div>
                        <div className="recipe-text-wrapper">
                            <h3 className="recipe-info-h3">재료 설명</h3>
                            <p>{post.ingredients}</p>
                        </div>
                    </div>
                    <hr className="recipe-divider" />

                    {ingredientImages.length > 0 && (
                        <div className="recipe-image-info">
                            <img src={ingredientImages[ingredientImageIndex]} alt="재료 이미지" className="detail-image" />
                            {ingredientImages.length > 1 && (
                                <div className="image-nav">
                                    <button onClick={() => setIngredientImageIndex(i => Math.max(i - 1, 0))}>←</button>
                                    <span>{ingredientImageIndex + 1}/{ingredientImages.length}</span>
                                    <button onClick={() => setIngredientImageIndex(i => Math.min(i + 1, ingredientImages.length - 1))}>→</button>
                                </div>
                            )}
                        </div>
                    )}

                    <h3 className="recipe-info-h3">레시피 설명</h3>
                    {recipeSteps.map((step, i) => (
                        <div key={i} className="recipe-step-row">
                            <div className="recipe-step-image">
                                {step.imageUrl?.trim() ? (
                                    <img src={step.imageUrl} alt={`step-${i}`} className="step-image" />
                                ) : (
                                    <div className="step-placeholder">이미지 없음</div>
                                )}
                            </div>
                            <div className="recipe-step-text">
                                <p>{step.text || "(내용 없음)"}</p>
                            </div>
                        </div>
                    ))}
                </>
            )}

            {['질문', 'notice'].includes(post.category) && (
                <div>
                    <div className={`board-detail-content ${imageUrls.length === 0 ? 'zero' : ''}`}>{post.content}</div>
                    {(imageUrls.length > 0 && (
                        <div className="board-detail-images">
                            <img
                                src={imageUrls[currentImageIndex]}
                                alt={`img-${currentImageIndex}`}
                                className="detail-image"
                            />
                            {imageUrls.length > 1 && 
                                <div className="round-button" style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                                    <button onClick={handlePrevImage} disabled={currentImageIndex === 0}>←</button>
                                    <span>{currentImageIndex + 1} / {imageUrls.length}</span>
                                    <button onClick={handleNextImage} disabled={currentImageIndex >= imageUrls.length - 1}>→</button>
                                </div>
                            }
                        </div>
                    ))}
                </div>
            )}

            <div className="like-save-container">
                <div className="left-like">
                    <p>좋아요 : {post.likeCount}</p>
                    <button onClick={handleLike} className="like-button">
                        {post.isLiked ? "💗" : "🤍"}
                    </button>
                </div>
                {sessionStorage.getItem("email") !== post.email && (
                    <div className="right-save">
                        <button className="save-button" onClick={handleSave}>
                            {post.isSaved ? "⭐저장됨" : "☆저장"}
                        </button>
                    </div>
                )}
            </div>

            {showSaveMessage && (
                <div className="save-popup">
                    {lastSavedState ? '저장이 완료되었습니다!' : '저장이 취소되었습니다!'}
                </div>
            )}

            {post.category !== 'notice' && <CommentSection
                key={id}
                boardId={id}
                commentCount={post.commentCount}
                onCommentAdded={fetchPost}
            />}

            <div className="Detail-buttons">
                <button onClick={() => {
                    if(post.category === "notice"){
                        navigate('/customer-service')
                    }else{
                       navigate('/community') 
                    }
                    }} className="back-button">목록</button>
                {sessionStorage.getItem("email") === (post.email, 'refrmanager00@gmail.com') && (
                    <div>
                        <button onClick={() => navigate(`/community/${id}/edit`)} className="back-button">수정</button>
                        <button onClick={handleDelete} className="delete-button">삭제</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BoardDetail;

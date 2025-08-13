import { useEffect, useState } from "react";
import axios from "axios";
import './Comment.css';

const CommentSection = ({ boardId, commentCount, onCommentAdded }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editedContent, setEditedContent] = useState("");
    const [showAll, setShowAll] = useState(false);

    const springBackendUrl = process.env.REACT_APP_SPRING_BACKEND_URL

    const fetchComments = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.get(`${springBackendUrl}/api/comments/${boardId}`, { headers });
            setComments(res.data);
        } catch (err) {
            console.error("댓글 불러오기 실패:", err.response?.data || err.message);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [boardId]);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        const token = sessionStorage.getItem("token");
        const nickName = sessionStorage.getItem("nickName");
        const email = sessionStorage.getItem("email");

        if (!token || !nickName) {
            alert("로그인이 필요합니다.");
            return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        try {
            await axios.post(`${springBackendUrl}/api/comments`, {
                email,
                nickName: nickName,
                boardId: Number(boardId),
                content: newComment,
                parentId: replyTo
            }, { headers });

            setNewComment("");
            setReplyTo(null);
            fetchComments();

            if (onCommentAdded) onCommentAdded();
        } catch (err) {
            console.error("댓글 등록 실패:", err.response?.data || err.message);
        }
    };

    const handleDelete = async (commentId) => {
        const token = sessionStorage.getItem("token");
        if (!token || token === "null") return;

        const headers = { Authorization: `Bearer ${token}` };

        try {
            await axios.delete(`${springBackendUrl}/api/comments/${commentId}`, { headers });
            fetchComments();
        } catch (err) {
            console.error("댓글 삭제 실패:", err.response?.data || err.message);
        }
    };

    const handleUpdate = async (commentId) => {
        if (!editedContent.trim()) return;
        const token = sessionStorage.getItem("token");
        if (!token || token === "null") return;

        const headers = { Authorization: `Bearer ${token}` };

        try {
            await axios.put(`${springBackendUrl}/api/comments/${commentId}`, {
                content: editedContent
            }, { headers });
            setEditingId(null);
            setEditedContent("");
            fetchComments();
        } catch (err) {
            console.error("댓글 수정 실패:", err.response?.data || err.message);
        }
    };

    const toggleShowAll = () => setShowAll(!showAll);

    const sortedComments = [...comments].sort((a, b) => new Date(a.time) - new Date(b.time)); // 오래된 순
    const visibleComments = showAll ? sortedComments : sortedComments.slice(0, 5);

    const renderComments = (comments, parentId = null, level = 0) => {
        return comments
            .filter(c => c.parentId === parentId)
            .map(comment => (
                <div key={comment.id} className={`comment-item level-${level}`}>
                    {editingId === comment.id ? (
                        <>
                            <input
                                className="edit-input"
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                            />
                            <div className="comment-meta">
                                <button onClick={() => handleUpdate(comment.id)}>저장</button>
                                <button onClick={() => setEditingId(null)}>취소</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="comment-box">
                                <div className="comment-text">
                                    <span className="comment-user">{comment.nickName}: </span>
                                    <span className="comment-content">{comment.content}</span>
                                </div>
                                <div className="comment-meta">
                                    <span className="comment-time">{comment.time}</span>
                                    <button className="comment-reply" onClick={() => {
                                        setReplyTo(comment.id);
                                        setNewComment(`@${comment.nickName} `);
                                    }}>답글</button>
                                    {sessionStorage.getItem("email") === comment.email && (
                                        <>
                                            <span className="comment-slice">|</span>
                                            <button onClick={() => {
                                                setEditingId(comment.id);
                                                setEditedContent(comment.content);
                                            }}>수정</button>
                                            <span className="comment-slice">|</span>
                                            <button onClick={() => handleDelete(comment.id)}>삭제</button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="comment-children">
                                {renderComments(comments, comment.id, level + 1)}
                            </div>
                        </>
                    )}
                </div>
            ));
    };

    return (
        <div className="comment-section">
            <div className="comment-header">
                <h4>댓글 {commentCount}</h4>
                {comments.length > 5 && (
                    <button onClick={toggleShowAll} className="toggle-comments-button">
                        {showAll ? "접기" : `댓글 더보기`}
                    </button>
                )}
            </div>

            <div className="comment-form">
                <input
                    type="text"
                    placeholder={replyTo ? "답글 입력중..." : "댓글을 입력하세요"}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddComment();
                        }
                    }}
                />
                <button onClick={handleAddComment}>등록</button>
            </div>

            <div className="comment-list">
                {renderComments(visibleComments)}
            </div>
        </div>
    );
};

export default CommentSection;
import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const BoardContext = createContext(null);

const BoardProvider = ({ children }) => {
    const [boardList, setBoardList] = useState([]);

    const springBackendUrl = process.env.REACT_APP_SPRING_BACKEND_URL

    const fetchBoardList = async () => {
        try {
            const jwtToken = sessionStorage.getItem("token");
            const email = sessionStorage.getItem("email");

            if (!jwtToken || jwtToken === "null") {
            console.warn("❌ 로그인된 사용자 토큰 없음");
            return;
            }

            const headers = {
            Authorization: `Bearer ${jwtToken}`,
            ...(email && { email: email }),
            };

            const res = await axios.get(`${springBackendUrl}/api/board`, { headers });

            if (res.data?.data) {
            setBoardList(res.data.data);
            } else {
            console.warn("⚠️ 게시글 데이터 없음");
            }
        } catch (err) {
            console.error("❌ 게시글 불러오기 실패:", err.message);
        }
    };


    const fetchMainBoardList = async () => {
        try {

            const res = await axios.get(`${springBackendUrl}/api/board`);

            if (res.data?.data) {
            setBoardList(res.data.data);
            } else {
            console.warn("⚠️ 게시글 데이터 없음");
            }
        } catch (err) {
            console.error("❌ 게시글 불러오기 실패:", err.message);
        }
    };









    const handleLikeClick = async (postId) => {
        try {
            const token = sessionStorage.getItem("token");
            const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};

            const res = await axios.post(`${springBackendUrl}/api/board/${postId}/like`, {}, { headers });
            const { liked, likeCount } = res.data;

            setBoardList(prevList =>
                prevList.map(p =>
                    p.id === postId ? { ...p, isLiked: liked, likeCount } : p
                )
            );

            return { id: postId, isLiked: liked, likeCount };
        } catch (err) {
            console.error("❌ 좋아요 실패:", err.message);
            return null;
        }
    };

    const handleSaveClick = async (postId) => {
        try {
            const token = sessionStorage.getItem("token");
            const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};

            const res = await axios.post(`${springBackendUrl}/api/board/${postId}/save`, {}, { headers });
            const { saved } = res.data;

            // 🔁 boardList 갱신
            setBoardList(prevList =>
                prevList.map(post =>
                    post.id === postId ? { ...post, isSaved: saved } : post
                )
            );

            return saved;
        } catch (err) {
            console.error("❌ 저장 실패:", err.message);
            return null;
        }
    };


    return (
        <BoardContext.Provider value={{ boardList, setBoardList, handleLikeClick, handleSaveClick, fetchBoardList, fetchMainBoardList }}>
            {children}
        </BoardContext.Provider>
    );
};

export default BoardProvider;

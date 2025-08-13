import React, { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import BoardCardItem from './BoardCardItem';

const getAppId = () => typeof __app_id !== 'undefined' ? __app_id : 'local-dev-app-id';

const BoardCardItemWithNickname = ({ post }) => {
    const [nickname, setNickname] = useState(post.nickName); // 초기값 fallback

    useEffect(() => {
        const fetchNickname = async () => {
            if (!post.email) return;
            try {
                const db = getFirestore(getApp());
                const docRef = doc(db, `artifacts/${getAppId()}/users/${post.email}/user_profile/data`);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.nickname) setNickname(data.nickname);
                }
            } catch (err) {
                console.error("닉네임 불러오기 실패:", err);
            }
        };

        fetchNickname();
    }, [post.email]);

    return (
        <BoardCardItem
            imageUrl={post.imageUrls?.[0] || ""}
            title={post.title}
            author={nickname}
            writeTime={post.writingTime}
            likeCount={post.likeCount}
            summary={post.content}
            cookingTime={post.cookingTime}
            difficulty={post.difficulty}
            category={post.category}
            commentCount={post.commentCount}
            isSaved={post.isSaved}
        />
    );
};

export default BoardCardItemWithNickname;

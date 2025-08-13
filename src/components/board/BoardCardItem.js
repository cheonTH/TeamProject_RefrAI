import React from 'react';
import './BoardCardItem.css';

function BoardCardItem({
    imageUrl,
    title,
    author,
    writeTime,
    likeCount,
    difficulty,
    cookingTime,
    category,
    commentCount,
    isSaved,
    }) {
    const defaultQuestionImage = 'https://t3.ftcdn.net/jpg/02/14/40/92/360_F_214409262_ZJh28hhHGY8fkPfY3UpxKKZBjup9kRkA.jpg';
    const noticeImage = "https://img.freepik.com/premium-vector/notice-free-vector_734448-5.jpg";
    const displayImageUrl = category === '질문' ? defaultQuestionImage : category === 'notice' ? noticeImage : imageUrl;


    return (
        <div className="recipe-card-board clickable">
            <img className="card-image" src={displayImageUrl} alt={title} />
            <div className="card-content">
                <p className="category-text">{category}</p>
                <h3>{title}</h3>
                <p className="board-author">{author} · {writeTime}</p>
                <div className="card-meta">
                {!['질문', 'notice'].includes(category) && <span>🔥 {difficulty} | ⏱ {cookingTime}분</span>}
                <div>
                    {Number(likeCount) > 0 && <span> 💗 {likeCount} </span>}
                    {commentCount > 0 && <span> 💬 {commentCount} </span>}
                    {isSaved && <span> ⭐ </span>}
                </div>
                
                </div>
            </div>
        </div>
    );
}

export default BoardCardItem;
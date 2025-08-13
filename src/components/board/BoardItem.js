import './BoardItem.css';

//게시글 목록 아이템
function BoardItem({ imageUrl, title, author, writeTime, likeCount, difficulty, cookingTime, category, commentCount}) {
    return (
            <div className="board-item">
                {imageUrl && imageUrl.startsWith('data:image') && (
                    <div className="image-container">
                        <img src={imageUrl} alt={title} />
                    </div>
                )}
                <div className="text-container">
                    <p className='category-tag'>{category}</p>
                    <h3 className="board-title">{title}</h3>
                    <div className='board-sub'>
                        <p className="board-author">{author} {writeTime} 🔥 난이도: {difficulty} ⏱ {cookingTime}분</p>
                        <div className='board-meta'>
                            {likeCount > 0 && <p className="board-likes">💗 {likeCount}</p>}
                            {commentCount > 0 && <p className='board-comment-count'>💬 {commentCount}</p>}
                        </div>
                    </div>
                    
                </div>
            </div>
    );
}

export default BoardItem;
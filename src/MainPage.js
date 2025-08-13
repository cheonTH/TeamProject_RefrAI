import { useContext, useEffect, useMemo, useState } from "react";
import { BoardContext } from "./components/board/context/BoardContext";
import BoardCardItem from "./components/board/BoardCardItem";
import { Link } from "react-router-dom";
import RecipeForm from "./components/RecipeForm";
import RecommendationSection from "./components/RecommendationSection";


const MainPage = ({ ingredientsInput, setIngredientsInput, servingSize, setServingSize, handleSubmit, loading, error, userId, db, isLoggined, recipeType, setRecipeType, handleSelectRecommendedRecipe }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [recommendationTab, setRecommendationTab] = useState('forEveryone'); // 추천 탭
  const [categories, setCategories] = useState(['all', '한식', '중식', '일식', '양식', '디저트'])
  

  const { boardList, fetchMainBoardList } = useContext(BoardContext);

  const filteredPosts = useMemo(() => {
    return [...boardList]
      .filter(post => post.category !== '질문')
      .filter(post => post.category !== 'notice')
      .filter(post => {
        if (activeTab === 'all' || activeTab === '(아기)전체') {
          return recipeType === 'babyfood'
            ? ['(아기)이유식', '(아기)밥'].includes(post.category)
            : !['(아기)이유식', '(아기)밥'].includes(post.category);
        } else {
          return post.category === activeTab;
        }
      })
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
  }, [boardList, activeTab, recipeType]);

   useEffect(() => {
    fetchMainBoardList(); // ✅ MainPage 들어올 때마다 최신 게시글 가져오기
  }, []);


  const adultTab = () => {
    setRecipeType('adult')
    setCategories(['all', '한식', '중식', '일식', '양식', '디저트'])
    setActiveTab('all');
  }

  const babyTab = () => {
    setRecipeType('babyfood')
    setCategories(['(아기)전체', '(아기)이유식', '(아기)밥'])
    setActiveTab('(아기)전체');
  }
  return (
    <>
      <section className="main-section-header">
        <h2>요리연구소</h2>
        <div className="tabs">
          <button 
            className={`tab-button ${recipeType === 'adult' ? 'active' : ''}`}
            onClick={() => adultTab()}
          >
            레시피
          </button>
          <button 
            className={`tab-button ${recipeType === 'babyfood' ? 'active' : ''}`}
            onClick={() => babyTab()}
          >
            이유식
          </button>
        </div>
      </section>

      <RecipeForm
        ingredientsInput={ingredientsInput}
        setIngredientsInput={setIngredientsInput}
        servingSize={servingSize}
        setServingSize={setServingSize}
        handleSubmit={handleSubmit}
        loading={loading}
        error={error}
        recipeType={recipeType}
        setRecipeType={setRecipeType} // ⭐ 이 부분을 추가해야 합니다.
        isLoggined={isLoggined}
      />

      {/* <section className="keywords-section">
        <h3>쿡이의 추천 키워드</h3>
        <div className="keyword-tags">
          {categories.map((category) => (
            <button
              key={category}
              className={`tag ${activeTab === category ? 'active' : ''}`}
              onClick={() => setActiveTab(category)}
            >
              {category === 'all' ? '전체' : category}
            </button>
          ))}
        </div>
      </section> */}

      <section className="recipe-cards-section">
        <div className="cards-header">
          <h2>추천 레시피</h2>
          <div className="sort-options">
            <button 
                className={`sort-button ${recommendationTab === 'forEveryone' ? 'active' : ''}`}
                onClick={() => setRecommendationTab('forEveryone')}
            >
                모두를 위한 레시피
            </button>
            {userId && (
                <button 
                    className={`sort-button ${recommendationTab === 'forMe' ? 'active' : ''}`}
                    onClick={() => setRecommendationTab('forMe')}
                >
                    나를 위한 레시피
                </button>
            )}
          </div>
        </div>
        
        {recommendationTab === 'forMe' && userId ? (
          <RecommendationSection userId={userId} db={db} onSelectRecommendedRecipe={handleSelectRecommendedRecipe} />
        ) : (

          <div>
            {/* <h3 style={{marginBottom: 10, color: '#ff8c00', fontWeight: 'bold'}}>쿡이의 추천 키워드</h3> */}
            <div className="keyword-tags">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`tag ${activeTab === category ? 'active' : ''}`}
                  onClick={() => setActiveTab(category)}
                >
                  {category === 'all' ? '전체' : category}
                </button>
              ))}
            </div>
            <div className="board-items card-view">
              {filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
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
                ))
              ) : (
                <p className="no-result">해당 카테고리에 추천 게시글이 없습니다.</p>
              )}
            </div>
          </div>
          
        )}
      </section>
    </>
  );
};

export default MainPage;

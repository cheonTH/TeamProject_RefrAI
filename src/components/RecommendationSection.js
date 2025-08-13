import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const RecommendationSection = ({ userId, db, onSelectRecommendedRecipe }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [recommending, setRecommending] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'local-dev-app-id';
    const backendUrl = process.env.REACT_APP_BACKEND_URL;

    const imageUrlCache = useRef({});

    // ✅ 형용사 제거 함수
    const removeAdjective = (title) => {
        const adjectives = ['매콤', '새콤', '달콤', '고소', '짭짤', '촉촉', '바삭', '구수', '감칠맛', '얼큰', '부드럽', '진한'];
        for (let adj of adjectives) {
            if (title.startsWith(adj)) {
                return title.replace(adj, '').trim();
            }
        }
        return title.trim();
    };

    // ✅ 이미지 가져오는 함수 (표시 제목과 검색 키워드 분리)
    const fetchRecipeImage = async (recipeTitle) => {
  const displayTitle = recipeTitle.trim(); // 사용자에게 보여줄 제목
  const defaultPlaceholderUrl = `https://placehold.co/300x200/E0E0E0/333333?text=${encodeURIComponent(displayTitle.slice(0, 8))}`;

  // 실제 이미지 요청 함수
  const tryFetchImage = async (keyword) => {
    if (!keyword) return null;
    if (imageUrlCache.current[keyword]) return imageUrlCache.current[keyword];

    try {
      const response = await fetch(`${backendUrl}/get-recipe-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeTitle: keyword })
      });

      const data = await response.json();

      if (response.ok && data.imageUrl?.startsWith('http')) {
        imageUrlCache.current[keyword] = data.imageUrl;
        return data.imageUrl;
      }
    } catch (e) {
      console.warn(`이미지 검색 실패 (${keyword})`, e);
    }

    return null;
  };

  // 1단계: 전체 제목으로 시도
  const fullImage = await tryFetchImage(displayTitle);
  if (fullImage) return { imageUrl: fullImage, displayTitle };

  // 2단계: 마지막 단어만으로 시도 (ex. "닭볶음탕")
  const words = displayTitle.split(' ').filter(Boolean);
  const lastWord = words[words.length - 1];
  if (lastWord && lastWord !== displayTitle) {
    const fallbackImage = await tryFetchImage(lastWord);
    if (fallbackImage) return { imageUrl: fallbackImage, displayTitle };
  }

  // 3단계: 기본 이미지
  return { imageUrl: defaultPlaceholderUrl, displayTitle };
};


    // ✅ 개인화 추천 레시피 불러오기
    const fetchPersonalizedRecommendations = async () => {
        if (!userId || !db) {
            setFetchError("사용자 정보가 없어 개인 맞춤 추천을 불러올 수 없습니다.");
            return;
        }

        setRecommending(true);
        setFetchError(null);
        setRecommendations([]);

        try {
            const userActivityRef = collection(db, `artifacts/${appId}/users/${userId}/user_activity_logs`);
            const q = query(userActivityRef, orderBy("timestamp", "desc"), limit(50));
            const querySnapshot = await getDocs(q);

            let preferredRecipesSet = new Set();
            let favoriteRecipesSet = new Set();

            querySnapshot.forEach(doc => {
                const data = doc.data();
                const recipeTitle = data.recipeTitle;
                const actionType = data.actionType;

                if (recipeTitle && typeof recipeTitle === 'string' && recipeTitle.trim() !== '') {
                    if (actionType === 'view') {
                        preferredRecipesSet.add(recipeTitle);
                    } else if (actionType === 'favorite') {
                        preferredRecipesSet.add(recipeTitle);
                        favoriteRecipesSet.add(recipeTitle);
                    }
                }
            });

            const preferredRecipesList = Array.from(preferredRecipesSet);
            const favoriteRecipesList = Array.from(favoriteRecipesSet);

            const response = await fetch(`${backendUrl}/recommend-personalized-recipes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    preferredIngredients: preferredRecipesList,
                    favoriteRecipesSummary: favoriteRecipesList
                })
            });

            const data = await response.json();

            if (response.ok) {
                const recommendedNames = data.recommendations || [];

                const recipesWithImages = await Promise.all(
                    recommendedNames.map(async (name) => {
                        if (name && typeof name === 'string' && name.trim() !== '') {
                            const { imageUrl, displayTitle } = await fetchRecipeImage(name);
                            return { name: displayTitle, imageUrl };
                        }
                        return null;
                    })
                );

                setRecommendations(recipesWithImages.filter(item => item !== null));
            } else {
                setFetchError(data.error || '개인 맞춤 추천을 가져오는 데 실패했습니다.');
            }
        } catch (err) {
            console.error("개인 맞춤 추천 API 호출 실패:", err);
            setFetchError("개인 맞춤 추천을 불러오는 데 네트워크 오류가 발생했습니다.");
        } finally {
            setRecommending(false);
        }
    };

    useEffect(() => {
        if (userId && db) {
            fetchPersonalizedRecommendations();
        }
    }, [userId, db]);

    if (recommending) return <p className="loading-message">개인 맞춤 레시피를 추천 중...</p>;
    if (fetchError) return <p className="error-message">{fetchError}</p>;
    if (recommendations.length === 0) return <p className="no-recipes-message">추천 레시피가 아직 없습니다. 활동을 기록해주세요!</p>;

    return (
        <div className="recommended-recipes-box">
            <h4 className="recommended-recipes-headline">✨ 당신을 위한 맞춤 레시피 ✨</h4>
            <div className="recipe-cards-grid">
                {recommendations.map((recipe, idx) => (
                    recipe && recipe.name && (
                        <div 
                            className="recipe-card clickable"
                            key={idx} 
                            onClick={() => onSelectRecommendedRecipe(recipe.name)}
                        >
                            <img 
                                src={recipe.imageUrl || `https://placehold.co/300x200/E0E0E0/333333?text=URL+없음`}
                                alt={recipe.name} 
                                className="card-image"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://placehold.co/300x200/E0E0E0/333333?text=로딩+실패`;
                                }}
                            />
                            <div className="card-content">
                                <h3>{recipe.name}</h3>
                                <p>AI가 당신의 취향을 분석하여 추천했습니다.</p>
                                <div className="card-meta">
                                    <span>AI 추천</span>
                                </div>
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

export default RecommendationSection;

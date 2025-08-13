// src/components/MyRecipesPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, getDocs, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import WeeklyMealPlanner from './WeeklyMealPlanner'; // 새로운 컴포넌트 임포트
// ✅ getAppId 함수 임포트 (App.js와 동일한 경로 사용)
import { getAppId } from '../components/fridge/utils/firebaseUtils'; 


const MyRecipesPage = ({ handleGoBackToMainPage, db, auth, userId, setViewMode, handleViewSavedRecipeDetail, handleToggleFavorite, handleDeleteRecipe }) => {
    const [savedRecipes, setSavedRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // 새로운 상태: 현재 선택된 탭 ('myRecipes' 또는 'mealPlanner')
    const [currentTab, setCurrentTab] = useState('myRecipes'); 

    // ✅ appId를 getAppId() 함수를 통해 가져오도록 수정
    const currentAppId = getAppId(); 

    // 저장된 레시피를 Firestore에서 실시간으로 불러오는 useEffect
    useEffect(() => {
        if (!db || !userId) {
            // Firebase 설정이 완료되지 않았을 때의 오류 메시지를 더 명확히 합니다.
            // __firebase_config는 MyRecipesPage.js에서 직접 접근하기 어렵고, db prop을 통해 확인하는 것이 좋습니다.
            if (!db) {
                setError("Firebase 데이터베이스 연결이 완료되지 않았습니다.");
            } else {
                setError("사용자 인증이 완료되지 않아 레시피를 불러올 수 없습니다.");
            }
            setLoading(false);
            return;
        }

        // ✅ 수정된 currentAppId 변수 사용
        const collectionPath = `artifacts/${currentAppId}/users/${userId}/saved_recipes`;
        const recipesRef = collection(db, collectionPath);
        const q = query(recipesRef, orderBy('createdAt', 'desc')); // 최신순 정렬

        const unsubscribe = onSnapshot(q, (snapshot) => {
            try {
                const recipesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setSavedRecipes(recipesData);
                setLoading(false);
                setError(null); // 에러 초기화
            } catch (e) {
                console.error("Error fetching documents from Firestore:", e);
                setError("저장된 레시피를 불러오는 중 오류가 발생했습니다: " + e.message);
                setLoading(false);
            }
        }, (err) => {
            console.error("Error with Firestore snapshot listener:", err);
            setError("실시간 업데이트 구독 중 오류가 발생했습니다: " + err.message);
            setLoading(false);
        });

        // 컴포넌트 언마운트 시 구독 해제
        return () => {
            unsubscribe();
        };
    }, [db, userId, currentAppId]); // db, userId, currentAppId가 변경될 때만 effect 재실행

    if (loading) {
        return <div className="my-recipes-container"><p>레시피를 불러오는 중...</p></div>;
    }

    if (error) {
        return <div className="my-recipes-container"><p className="error-message">오류: {error}</p></div>;
    }

    return (
        <div className="my-recipes-container">
            <h2>내 레시피 보관함</h2>

            {/* 탭 버튼 */}
            <div className="tabs recipe-archive-tabs">
                <button 
                    className={`tab-button ${currentTab === 'myRecipes' ? 'active' : ''}`}
                    onClick={() => setCurrentTab('myRecipes')}
                >
                    내 레시피
                </button>
                <button 
                    className={`tab-button ${currentTab === 'mealPlanner' ? 'active' : ''}`}
                    onClick={() => setCurrentTab('mealPlanner')}
                >
                    주간 식단 계획
                </button>
            </div>

            {/* 탭 내용 */}
            {currentTab === 'myRecipes' ? (
                // 기존 내 레시피 목록
                <>
                    {savedRecipes.length === 0 ? (
                        <p className="no-recipes-message">아직 저장된 레시피가 없습니다. 요리 연구소에서 레시피를 생성하여 저장해 보세요!</p>
                    ) : (
                        <ul className="recipe-list">
                            {savedRecipes.map(recipe => (
                                <li key={recipe.id} className="recipe-item">
                                    <div className="recipe-header">
                                        {/* 제목 클릭 시 상세 보기 */}
                                        <h3 className="recipe-title-clickable" onClick={() => handleViewSavedRecipeDetail(recipe)}>
                                            {recipe.title}
                                        </h3>
                                        <div className="recipe-actions">
                                            <button 
                                                className={`favorite-button ${recipe.isFavorite ? 'favorited' : ''}`}
                                                onClick={() => handleToggleFavorite(recipe.id, recipe.isFavorite)}
                                                title={recipe.isFavorite ? "즐겨찾기 해제" : "즐겨찾기에 추가"}
                                            >
                                                {recipe.isFavorite ? '❤️' : '🤍'}
                                            </button>
                                            <button 
                                                className="delete-button"
                                                onClick={() => handleDeleteRecipe(recipe.id)}
                                                title="레시피 삭제"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                    <p className="recipe-meta">저장일: {recipe.createdAt ? new Date(recipe.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                                    {/* <pre>{recipe.content.substring(0, 100)}...</pre> 미리보기 내용 (선택 사항) */}
                                </li>
                            ))}
                        </ul>
                    )}
                    <button onClick={handleGoBackToMainPage} className="go-back-button">메인으로 돌아가기</button>
                </>
            ) : (
                // 주간 식단 계획 컴포넌트 렌더링
                <WeeklyMealPlanner 
                    userId={userId} 
                    db={db} 
                    savedRecipes={savedRecipes} // 저장된 레시피 목록 전달
                />
            )}
        </div>
    );
};

export default MyRecipesPage;

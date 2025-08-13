// src/components/WeeklyMealPlanner.js
import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';

// Debounce 함수 (lodash.debounce와 유사하게 동작하도록 직접 구현)
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

const WeeklyMealPlanner = ({ userId, db, savedRecipes }) => {
    // 요일별 식단 상태. 초기값은 빈 배열
    const [mealPlan, setMealPlan] = useState({
        '월': [], '화': [], '수': [], '목': [], '금': [], '토': [], '일': []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRecipeToAdd, setSelectedRecipeToAdd] = useState(''); // 식단에 추가할 레시피 선택
    const [selectedDayToAdd, setSelectedDayToAdd] = useState(''); // 레시피를 추가할 요일 선택
    const [isAddingRecipe, setIsAddingRecipe] = useState(false); // 레시피 추가 모달 표시 여부

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'local-dev-app-id';

    // Firestore에서 식단 계획을 불러오는 함수
    useEffect(() => {
        const fetchMealPlan = async () => {
            if (!userId || !db) {
                setError("사용자 정보 또는 데이터베이스 연결이 없습니다.");
                setLoading(false);
                return;
            }

            try {
                const mealPlanDocRef = doc(db, `artifacts/${appId}/users/${userId}/meal_plans`, 'current_week_plan');
                const docSnap = await getDoc(mealPlanDocRef);

                if (docSnap.exists()) {
                    // Firestore에서 불러온 데이터를 기반으로 mealPlan 상태 업데이트
                    // 각 레시피 객체가 { id, title } 형태를 유지하도록 보장
                    const loadedPlan = docSnap.data();
                    const cleanPlan = {};
                    for (const day of Object.keys(mealPlan)) { // 초기 mealPlan의 요일 키를 사용하여 순서 보장
                        cleanPlan[day] = (loadedPlan[day] || []).map(recipe => ({
                            id: recipe.id,
                            title: recipe.title
                        }));
                    }
                    setMealPlan(cleanPlan);
                } else {
                    console.log("No existing meal plan found, starting with empty plan.");
                    setMealPlan({ // 데이터가 없을 경우 기본 빈 식단으로 초기화
                        '월': [], '화': [], '수': [], '목': [], '금': [], '토': [], '일': []
                    });
                }
            } catch (err) {
                console.error("Error fetching meal plan:", err);
                setError("식단 계획을 불러오는 데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchMealPlan();
    }, [userId, db, appId]); // userId나 db가 변경될 때마다 다시 불러옴

    // Firestore에 식단 계획을 저장하는 debounce 함수
    // useCallback을 사용하여 함수가 불필요하게 재생성되지 않도록 함
    const saveMealPlanToFirestore = useCallback(debounce(async (currentPlan) => {
        if (!userId || !db || loading) { // 로딩 중에는 저장하지 않음
            console.warn("Firestore not ready or still loading, skipping save.");
            return;
        }
        try {
            const mealPlanDocRef = doc(db, `artifacts/${appId}/users/${userId}/meal_plans`, 'current_week_plan');
            await setDoc(mealPlanDocRef, { ...currentPlan, lastUpdated: new Date() });
        } catch (err) {
            console.error("Error saving meal plan:", err);
            setError("식단 계획 저장 중 오류가 발생했습니다.");
        }
    }, 1000), [userId, db, appId, loading]); // debounce 의존성

    // mealPlan 상태가 변경될 때마다 Firestore에 저장 요청
    useEffect(() => {
        if (!loading) { // 초기 로딩이 완료된 후에만 저장 로직 실행
            saveMealPlanToFirestore(mealPlan);
        }
    }, [mealPlan, loading, saveMealPlanToFirestore]); // mealPlan이 변경될 때마다 저장

    // 특정 요일에 레시피 추가
    const handleAddRecipeToDay = (day) => {
        if (selectedRecipeToAdd) {
            const recipeInfo = savedRecipes.find(r => r.id === selectedRecipeToAdd);
            if (recipeInfo) {
                setMealPlan(prevPlan => ({
                    ...prevPlan,
                    [day]: [...prevPlan[day], { id: recipeInfo.id, title: recipeInfo.title }]
                }));
                setSelectedRecipeToAdd(''); // 선택 초기화
                setIsAddingRecipe(false); // 모달 닫기
            }
        }
    };

    // 특정 요일의 레시피 삭제
    const handleDeleteRecipeFromDay = (day, recipeId) => {
        setMealPlan(prevPlan => ({
            ...prevPlan,
            [day]: prevPlan[day].filter(recipe => recipe.id !== recipeId)
        }));
    };

    // "레시피 추가" 버튼 클릭 시 모달 열기
    const openAddRecipeModal = (day) => {
        setSelectedDayToAdd(day);
        setIsAddingRecipe(true);
    };

    if (loading) {
        return <p className="loading-message">식단 계획을 불러오는 중...</p>;
    }

    if (error) {
        return <p className="error-message">오류: {error}</p>;
    }

    // savedRecipes가 배열이 아니거나 비어있을 경우 처리
    const availableRecipes = Array.isArray(savedRecipes) ? savedRecipes : [];
    const hasSavedRecipes = availableRecipes.length > 0;

    return (
        <div className="meal-planner-container">
            <h2>주간 식단 계획</h2>
            <p className="planner-description">
                저장된 레시피들을 요일별로 배치하여 주간 식단표를 관리하세요. 
                식단에 레시피를 추가하려면, 먼저 '내 레시피' 보관함에 레시피가 저장되어 있어야 합니다.
            </p>

            <div className="meal-plan-grid">
                {Object.keys(mealPlan).map(day => (
                    <div key={day} className="meal-plan-day-column">
                        <h3>{day}</h3>
                        <div className="recipes-for-day">
                            {mealPlan[day].length === 0 ? (
                                <p className="no-recipe-msg">레시피 없음</p>
                            ) : (
                                mealPlan[day].map((recipe, index) => (
                                    <div key={recipe.id || index} className="meal-plan-recipe-item">
                                        <span>{recipe.title}</span>
                                        <button 
                                            className="delete-recipe-btn" 
                                            onClick={() => handleDeleteRecipeFromDay(day, recipe.id)}
                                            title="레시피 삭제"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                        <button 
                            className="add-recipe-btn" 
                            onClick={() => openAddRecipeModal(day)}
                            disabled={!hasSavedRecipes} // 저장된 레시피가 없으면 버튼 비활성화
                            title={!hasSavedRecipes ? "레시피 보관함에 먼저 레시피를 저장하세요." : "이 요일에 레시피 추가"}
                        >
                            + 레시피 추가
                        </button>
                    </div>
                ))}
            </div>

            {/* 레시피 추가 모달 */}
            {isAddingRecipe && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>'{selectedDayToAdd}' 요일에 레시피 추가</h3>
                        {!hasSavedRecipes ? (
                            <p className="no-recipes-message">저장된 레시피가 없습니다. '내 레시피' 탭에서 먼저 레시피를 저장해주세요.</p>
                        ) : (
                            <div className="modal-body">
                                <select 
                                    value={selectedRecipeToAdd} 
                                    onChange={(e) => setSelectedRecipeToAdd(e.target.value)}
                                    className="recipe-select"
                                >
                                    <option value="">레시피 선택</option>
                                    {availableRecipes.map(recipe => (
                                        <option key={recipe.id} value={recipe.id}>{recipe.title}</option>
                                    ))}
                                </select>
                                <button 
                                    className="modal-add-btn" 
                                    onClick={() => handleAddRecipeToDay(selectedDayToAdd)}
                                    disabled={!selectedRecipeToAdd}
                                >
                                    추가
                                </button>
                            </div>
                        )}
                        <button className="modal-close-btn" onClick={() => setIsAddingRecipe(false)}>닫기</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeeklyMealPlanner;

// src/context/RefrigeratorContext.js
import { createContext, useEffect, useState } from "react";

const RefrigeratorContext = createContext();

const backendUrl = process.env.REACT_APP_BACKEND_URL // 백엔드 재료 API 엔드포인트
const CHECK_INGREDIENT_URL = `${backendUrl}/check-ingredient`; // 백엔드 재료 확인 API 엔드포인트

const RefrigeratorProvider = ({ children, userId }) => {
    const [ingredients, setIngredients] = useState([]); // 냉장고 재료 목록
    const [loading, setLoading] = useState(false); // 재료 로딩 상태
    const [error, setError] = useState(null); // 오류 메시지
    const [selectedIngredientIds, setSelectedIngredientIds] = useState([]); // 선택된 재료 ID 목록
    const [recommendedRecipes, setRecommendedRecipes] = useState([]); // 추천 레시피 목록
    const [recommending, setRecommending] = useState(false); // 레시피 추천 중 상태
    const [checkingIngredient, setCheckingIngredient] = useState(false); // 재료 확인 중 상태

    // 재료 불러오기 (백엔드 API 호출)
    const fetchIngredients = async () => {
        if (!userId) { // userId가 없으면 불러올 수 없음
            setError("사용자 ID가 없어 재료를 불러올 수 없습니다.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${backendUrl}/user/${userId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setIngredients(data);
        } catch (err) {
            console.error("재료 불러오기 실패:", err);
            setError("재료를 불러오는 데 실패했습니다.");
            setIngredients([]); // 실패 시 목록 초기화
        } finally {
            setLoading(false);
        }
    };

    // Gemini API를 사용하여 입력값이 재료인지 확인하는 함수 (백엔드를 통해 호출)
    const checkIfIngredient = async (name) => {
        setCheckingIngredient(true);
        setError(null);
        try {
            const response = await fetch(CHECK_INGREDIENT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("백엔드 재료 확인 API 오류:", errorData);
                setError(errorData.error || "재료 확인 중 오류가 발생했습니다.");
                return false;
            }

            const result = await response.json();
            return result.is_ingredient; // 백엔드에서 불리언 값으로 반환됨
        } catch (err) {
            console.error("Error checking ingredient via backend:", err);
            setError("재료 확인 중 네트워크 오류가 발생했습니다.");
            return false;
        } finally {
            setCheckingIngredient(false);
        }
    };

    // 재료 추가 (백엔드로 데이터 전송)
    const addIngredient = async (ingredientName) => {
        if (!userId) {
            setError("사용자 ID가 없어 재료를 추가할 수 없습니다.");
            return false;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: ingredientName, userId: userId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const newIngredient = await response.json();
            setIngredients((prev) => [...prev, newIngredient]);
            return newIngredient;
        } catch (err) {
            console.error("재료 추가 실패:", err);
            setError(err.message || "재료 추가에 실패했습니다.");
            return false;
        } finally {
            setLoading(false);
        }
    };

    // 재료 수정 (백엔드로 데이터 전송)
    const updateIngredient = async (ingredientId, newName) => {
        if (!userId) {
            setError("사용자 ID가 없어 재료를 수정할 수 없습니다.");
            return false;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${backendUrl}/${ingredientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: ingredientId, name: newName, userId: userId }) // ID도 body에 포함
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const updatedIngredient = await response.json();
            setIngredients((prev) =>
                prev.map((ing) => (ing.id === ingredientId ? updatedIngredient : ing))
            );
            return updatedIngredient;
        } catch (err) {
            console.error("재료 수정 실패:", err);
            setError(err.message || "재료 수정에 실패했습니다.");
            return false;
        } finally {
            setLoading(false);
        }
    };

    // 재료 삭제 (백엔드로 요청 전송)
    const deleteIngredient = async (ingredientId) => {
        if (!userId) {
            setError("사용자 ID가 없어 재료를 삭제할 수 없습니다.");
            return false;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${backendUrl}/${ingredientId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: userId }) // DELETE 요청도 body에 userId 포함
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            setIngredients((prev) => prev.filter((ing) => ing.id !== ingredientId));
            setRecommendedRecipes([]); // 삭제 후 추천 레시피 초기화
            return true;
        } catch (err) {
            console.error("재료 삭제 실패:", err);
            setError(err.message || "재료 삭제에 실패했습니다.");
            return false;
        } finally {
            setLoading(false);
        }
    };

    // 레시피 추천 함수 (Gemini API 호출 - App.js의 /generate-recipe와 유사)
    const getRecipeRecommendations = async (ingredientsString) => {
        if (!ingredientsString.trim()) {
            setError("레시피 추천을 위한 재료가 없습니다.");
            return [];
        }
        setRecommending(true);
        setError(null);
        try {
            // 백엔드의 /generate-recipe 엔드포인트를 재활용하여 AI 추천 받기
            const response = await fetch(`${backendUrl}/generate-recipe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ingredients: ingredientsString.split(',').map(s => s.trim()), serving_size: 1 }), // 인분은 임시로 1로 설정
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("레시피 추천 API 오류:", errorData);
                setError(errorData.error || "레시피 추천 중 오류가 발생했습니다.");
                return ["추천 실패"];
            }

            const data = await response.json();
            const recipeText = data.recipe;

            // 받아온 레시피 텍스트에서 제목만 파싱 (간단하게 첫 줄을 제목으로)
            const recipeLines = recipeText.split('\n').filter(line => line.trim() !== '');
            const title = recipeLines.length > 0 ? recipeLines[0].trim() : "새로운 레시피";
            
            return [title];

        } catch (err) {
            console.error("Error getting recipe recommendations:", err);
            setError("레시피 추천 중 네트워크 오류가 발생했습니다.");
            return ["네트워크 오류"];
        } finally {
            setRecommending(false);
        }
    };

    // 컴포넌트 마운트 시 및 userId 변경 시 초기 재료 로드
    useEffect(() => {
        if (userId) { // userId가 유효할 때만 fetchIngredients 호출
            fetchIngredients();
        }
    }, [userId]); // userId가 변경될 때마다 재료 다시 불러오기

    // Provider를 통해 하위 컴포넌트에 상태와 함수 제공
    return (
        <RefrigeratorContext.Provider
            value={{
                ingredients,
                loading,
                error,
                addIngredient,
                updateIngredient,
                deleteIngredient,
                fetchIngredients, // 재료 새로고침용
                getRecipeRecommendations,
                selectedIngredientIds,
                setSelectedIngredientIds,
                recommendedRecipes,
                setRecommendedRecipes,
                recommending,
                checkingIngredient,
                checkIfIngredient,
            }}
        >
            {children}
        </RefrigeratorContext.Provider>
    );
};

export { RefrigeratorProvider, RefrigeratorContext };

// src/components/RecipeResult.js
import React, { useState, useEffect, useMemo } from 'react';
import '../App.css'; // App.css 스타일을 사용

const RecipeResult = ({ recipe, error, handleGoBackToMainPage, onClose, onSaveRecipe, isSaving, returnPage,recipeType }) => { // <--- returnPage prop 추가
    const [isSaved, setIsSaved] = useState(false);
    const [structuredRecipe, setStructuredRecipe] = useState(null); // 구조화된 레시피 데이터
    const [currentPageIndex, setCurrentPageIndex] = useState(0); // 현재 페이지 인덱스
    const [pageAnimation, setPageAnimation] = useState(''); // 페이지 전환 애니메이션 클래스

    // 레시피가 변경될 때마다 isSaved 상태를 초기화하고 structuredRecipe를 설정합니다.
    useEffect(() => {
        setIsSaved(false); // 새로운 레시피가 로드될 때마다 저장 상태 초기화
        if (recipe) {
            setStructuredRecipe(recipe);
            setCurrentPageIndex(0); // 새 레시피 로드 시 첫 페이지로 이동
            setPageAnimation(''); // 새로운 레시피 로드 시 애니메이션 상태 초기화
        } else {
            setStructuredRecipe(null);
        }
    }, [recipe]);


    // 레시피 데이터를 페이지 배열로 변환하는 함수 (useMemo로 감싸서 최적화)
    const pages = useMemo(() => {
        if (!structuredRecipe) {
            return [];
        }

        const newPages = [];

        // --- 페이지 0: 제목, 소개, 시간 ---
        newPages.push({
            type: 'intro',
            title: structuredRecipe.title || "제목 없음",
            introduction: structuredRecipe.introduction || "",
            prep_time: structuredRecipe.prep_time || "정보 없음",
            cook_time: structuredRecipe.cook_time || "정보 없음",
            recommended_month: structuredRecipe.recommended_month || "정보 없음",
            recipe_type: structuredRecipe.recipe_type || recipeType
        });

        // --- 페이지 1: 재료 목록 ---
        if (structuredRecipe.ingredients && structuredRecipe.ingredients.length > 0) {
            newPages.push({
                type: 'ingredients',
                ingredients: structuredRecipe.ingredients
            });
        } else {
        }

        // --- 페이지 2 이후: 조리 과정 (단계별) ---
        if (structuredRecipe.steps && structuredRecipe.steps.length > 0) {
            structuredRecipe.steps.forEach((step, index) => {
                newPages.push({
                    type: 'step',
                    stepNumber: index + 1,
                    title: step.title || `단계 ${index + 1}`,
                    content: step.content || "",
                    tips: step.tips || []
                });
            });
        } else {
            console.log("RecipeResult generatePages (useMemo): No steps found.");
        }

        // --- 마지막 페이지: 팁 및 주의사항 ---
        if ((structuredRecipe.tips && structuredRecipe.tips.length > 0) ||
            (structuredRecipe.warnings && structuredRecipe.warnings.length > 0)) {
            newPages.push({
                type: 'final',
                tips: structuredRecipe.tips || [],
                warnings: structuredRecipe.warnings || []
            });
        } else {
            console.log("RecipeResult generatePages (useMemo): No final tips or warnings found.");
        }

        return newPages;
    }, [structuredRecipe]);

    const currentPageData = pages[currentPageIndex];

    const isFirstPage = currentPageIndex === 0;
    const isLastPage = currentPageIndex === pages.length - 1;

    const goToNextPage = () => {
        if (currentPageIndex < pages.length - 1) {
            setPageAnimation('fade-out');
            setTimeout(() => {
                setCurrentPageIndex(prev => prev + 1);
                setPageAnimation('fade-in');
            }, 300);
        }
    };

    const goToPreviousPage = () => {
        if (currentPageIndex > 0) {
            setPageAnimation('fade-out');
            setTimeout(() => {
                setCurrentPageIndex(prev => prev - 1);
                setPageAnimation('fade-in');
            }, 300);
        }
    };

    const handleAnimationEnd = (e) => {
        if (e.animationName === 'fade-out-anim' || e.animationName === 'fade-in-anim') {
            setPageAnimation('');
        }
    };


    const handleSaveClick = async () => {
        await onSaveRecipe(structuredRecipe);
        setIsSaved(true);
    };

    if (error) {
        console.error("RecipeResult Render: Displaying error message:", error);
        return (
            <section className="recipe-result-container">
                <button className="close-recipe-result" onClick={onClose} title="닫기">&times;</button>
                <p className="form-error-message">오류: {error}</p>
                <div className="recipe-actions">
                    <button onClick={handleGoBackToMainPage} className="go-back-button">다시 재료 입력하기</button>
                </div>
            </section>
        );
    }

    if (!structuredRecipe || pages.length === 0 || !currentPageData) {
        return (
            <section className="recipe-result-container">
                <button className="close-recipe-result" onClick={onClose} title="닫기">&times;</button>
                <p>생성된 레시피가 없거나 레시피를 불러오는 중 오류가 발생했습니다. 재료를 입력하고 레시피를 생성해 보세요!</p>
                <div className="recipe-actions">
                    <button onClick={handleGoBackToMainPage} className="go-back-button">다시 재료 입력하기</button>
                </div>
            </section>
        );
    }

    return (
        <section className="recipe-result-container cookbook-view">
            <button className="close-recipe-result" onClick={onClose} title="닫기">&times;</button>

            {/* 페이지 콘텐츠 */}
            <div className={`recipe-page-content ${pageAnimation}`} onAnimationEnd={handleAnimationEnd}>
                {currentPageData.type === 'intro' && (
                    <div className="intro-page-layout">
                        <div className="intro-text-area">
                            <h2 className="recipe-page-title">{currentPageData.title || ''}</h2>
                            <p className="recipe-intro-text">{currentPageData.introduction || ''}</p>
                            <div className="recipe-meta-info">
                                <span>⏰ **준비 시간**: {currentPageData.prep_time || '정보 없음'}</span>
                                <span>🍳 **조리 시간**: {currentPageData.cook_time || '정보 없음'}</span>
                                {currentPageData.recipe_type === 'babyfood' && currentPageData.recommended_month && (
                                    <span>👶 **권장 월령**: {currentPageData.recommended_month}</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {currentPageData.type === 'ingredients' && (
                    <div className="ingredients-page-layout">
                        <h3 className="recipe-page-heading">🥣 재료 목록</h3>
                        <div className="ingredients-list">
                            {currentPageData.ingredients && Array.isArray(currentPageData.ingredients) && currentPageData.ingredients.map((categoryObj, catIndex) => (
                                <div key={catIndex} className="ingredient-category">
                                    <h4>{categoryObj.category || '기타 재료'}</h4>
                                    <ul>
                                        {categoryObj.items && Array.isArray(categoryObj.items) && categoryObj.items.map((item, itemIndex) => (
                                            <li key={itemIndex}>{item || ''}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {currentPageData.type === 'step' && (
                    <div className="step-page-layout">
                        <h3 className="recipe-page-heading">🔪 조리 과정 {currentPageData.stepNumber}</h3>
                        <h4 className="step-title">{currentPageData.title || ''}</h4>
                        <p className="step-content-text">{currentPageData.content || ''}</p>
                        {currentPageData.tips && currentPageData.tips.length > 0 && (
                            <div className="step-tips">
                                <h5>💡 팁</h5>
                                <ul>
                                    {Array.isArray(currentPageData.tips) && currentPageData.tips.map((tip, index) => (
                                        <li key={index}>{tip || ''}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {currentPageData.type === 'final' && (
                    <div className="final-page-layout">
                        {currentPageData.tips && currentPageData.tips.length > 0 && (
                            <div className="final-section">
                                <h3 className="recipe-page-heading">🍽️ 맛있게 먹는 팁</h3>
                                <ul>
                                    {Array.isArray(currentPageData.tips) && currentPageData.tips.map((tip, index) => (
                                        <li key={index}>{tip || ''}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {currentPageData.warnings && currentPageData.warnings.length > 0 && (
                            <div className="final-section">
                                <h3 className="recipe-page-heading">⚠️ 주의사항</h3>
                                <ul>
                                    {Array.isArray(currentPageData.warnings) && currentPageData.warnings.map((warning, index) => (
                                        <li key={index}>{warning || ''}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <p className="enjoy-message">**즐거운 요리 시간 되세요!**</p>
                    </div>
                )}
            </div>

            {/* 페이지네이션 버튼 */}
            <div className="pagination-controls">
                <button
                    onClick={goToPreviousPage}
                    disabled={isFirstPage}
                    className="nav-page-button prev"
                >
                    &larr; 이전
                </button>
                <span className="page-number">{currentPageIndex + 1} / {pages.length}</span>
                <button
                    onClick={goToNextPage}
                    disabled={isLastPage}
                    className="nav-page-button next"
                >
                    다음 &rarr;
                </button>
            </div>

            {/* 하단 액션 버튼 */}
            <div className="recipe-actions">
                {/* returnPage가 'myRecipesPage'가 아닐 때만 저장 버튼을 렌더링 */}
                {returnPage !== 'myRecipesPage' && (
                    <button
                        onClick={handleSaveClick}
                        className="save-recipe-button"
                        disabled={isSaving || isSaved}
                    >
                        {isSaving ? '저장 중...' : (isSaved ? '저장 완료!' : '내 레시피 보관함에 저장하기')}
                    </button>
                )}
                <button onClick={handleGoBackToMainPage} className="go-back-button">새 레시피 만들기</button>
            </div>
        </section>
    );
};

export default RecipeResult;

// src/components/RecipeForm.js
import { useContext, useState } from 'react';
import '../App.css'; // App.css 스타일을 사용
import CartModal from './CartModal';
import { FridgeContext } from './fridge/contexts/FridgeContext';

const RecipeForm = ({ ingredientsInput, setIngredientsInput, servingSize, setServingSize, handleSubmit, loading, error, recipeType, isLoggined }) => {

    const [isCartVisible, setIsCartVisible] = useState(false);

    const { cartItems, isLoading: isCartLoading, handleRemoveItemFromCart, fetchInitialData: fetchCartData } = useContext(FridgeContext);

    const handleCartDisplay = () => {
        if (!isCartVisible && typeof fetchCartData === 'function') {
            fetchCartData();
        }
        setIsCartVisible(!isCartVisible);
    };

    const handleLoadCartItemsToInput = () => {
        const itemNames = cartItems.map(item => item.name);
        setIngredientsInput(prev => prev ? `${prev}, ${itemNames.join(', ')}` : itemNames.join(', '));
        setIsCartVisible(false);
    };

    return (
        <section className="recipe-form-container">    
            <div className="title-wrapper">
                <h2>나만의 레시피 만들기</h2>
                <form>
                    <div className='recipe-cart'>
                        <button type="button" className='recipe-cart-button' onClick={handleCartDisplay}>나의 장바구니</button>
                    </div>
                </form>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="form-group"> {/* 재료 입력 그룹 */}
                    <label htmlFor="ingredients">가지고 있는 재료 (쉼표로 구분):</label>
                    <input
                        className="form-input" /* form-input 클래스 적용 */
                        type="text"
                        id="ingredients"
                        value={ingredientsInput}
                        onChange={(e) => setIngredientsInput(e.target.value)}
                        placeholder="예: 돼지고기, 양파, 김치, 두부, 파"
                        disabled={loading}
                    />
                </div>
                <div className="form-group"> {/* 인분 입력 그룹 */}
                    <label htmlFor="servingSize">몇 인분:</label>
                    <input
                        className="form-input-short" /* form-input-short 클래스 적용 */
                        type="number"
                        id="servingSize"
                        value={servingSize}
                        onChange={(e) => setServingSize(Math.max(1, parseInt(e.target.value, 10) || 1))} // parseInt에 10진수 지정, NaN 방지
                        min="1"
                        disabled={loading}
                    />
                </div>
                {error && <p className="form-error-message">오류: {error}</p>}
                <button type="submit" className="form-submit-button" disabled={loading}>
                    {loading ? '레시피 생성 중...' : '레시피 생성하기'}
                </button>
            </form>
                <CartModal
                    isVisible={isCartVisible}
                    onClose={handleCartDisplay}
                    cartItems={cartItems}
                    onLoadItems={handleLoadCartItemsToInput}
                    isLoading={isCartLoading}
                    isLoggined={isLoggined}
                    onRemoveItem={handleRemoveItemFromCart}
                />
        </section>
    );
};

export default RecipeForm;

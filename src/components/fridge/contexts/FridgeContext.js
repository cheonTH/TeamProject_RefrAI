import { createContext, useCallback, useEffect, useState } from "react";
import FridgeApiClient from "../utils/FridgeApiClient"
import { getCategoryEmoji, titleForDisplay } from "../utils/Constants";

const FridgeContext = createContext();

const FridgeProvider = ({ children, onSetModalMessage, isLoggedIn }) => {
    const [isFridgeOpen, setIsFridgeOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [cartItems, setCartItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeHoverItem, setActiveHoverItem] = useState(null);
    const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        if (isLoggedIn) {
            try {
                const response = await FridgeApiClient.get('/api/workspace');
                const { ingredients, cartItems } = response.data;
                
                setItems(ingredients || []);
                setCartItems(cartItems || []);
            } catch (error) {
                console.error("초기 데이터 로드 실패 (서버가 꺼져있을 수 있습니다):", error);
                setItems([]);
                setCartItems([]);
            } finally {
                setIsLoading(false);
            }
        } else {
            setItems([]);
            setCartItems([]);
            setIsLoading(false);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        fetchInitialData();

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchInitialData();
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return() => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
    }, [fetchInitialData]);

    const toggleFridge = () => setIsFridgeOpen(!isFridgeOpen);

    const handleAddItem = async (name, quantity, category, icon) => {
        const newItemData = { name, quantity: Number(quantity), category, icon };
        const tempItem = { ...newItemData, id: `temp-${Date.now()}` };
        setItems((prev) => [...prev, tempItem]);
        if (isLoggedIn) {
            try {
                const response = await FridgeApiClient.post('/api/ingredients', newItemData);
                setItems((prev) => prev.map(item => item.id === tempItem.id ? response.data : item));
            } catch (error) {
                console.error("재료 추가 API 실패. 로컬 변경을 유지합니다.", error);
            }
        }
    };

    const handleRemoveItemFromFridge = async (itemId) => {
        setItems((prev) => prev.filter(item => item.id !== itemId));
        if (isLoggedIn && !(String(itemId).startsWith('temp-'))) {
            try {
                await FridgeApiClient.delete(`/api/ingredients/${itemId}`);
            } catch (error) {
                console.error("재료 삭제 API 실패. 로컬 변경을 유지합니다.", error);
            }
        }
    };
    
    const handleRemoveItemFromCart = async (cartItemId) => {
        setCartItems((prev) => prev.filter(item => item.id !== cartItemId));
        if (isLoggedIn && !(String(cartItemId).startsWith('temp-'))) {
            try {
                await FridgeApiClient.delete(`/api/cart/${cartItemId}`);
            } catch (error) {
                console.error("장바구니 재료 삭제 API 실패. 로컬 변경을 유지합니다.", error);
            }
        }
    };

    const handleDropItem = async (draggedItemId, newCategory, sourceType) => {
        if (sourceType === 'cart') {
            const itemToMove = cartItems.find(item => item.id === draggedItemId);

            if (!itemToMove) return;
            const newIngredient = { 
                ...itemToMove, 
                category: newCategory, 
                icon: getCategoryEmoji(newCategory),
                id: `temp-fridge-${Date.now()}` 
            };
            setCartItems((prev) => prev.filter(item => item.id !== draggedItemId));
            setItems((prev) => [...prev, newIngredient]);

            if (isLoggedIn && !(String(draggedItemId).startsWith('temp-'))) {
                try {
                    const response = await FridgeApiClient.post(`/api/cart/${draggedItemId}/move-to-fridge`, { category: newCategory });
                    setItems((prev) => prev.map(item => item.id === newIngredient.id ? response.data : item));
                } catch(error) { console.error("API 실패", error); }
            }
        } else if (sourceType === 'fridge' && newCategory === 'cart') { // 냉장고 -> 장바구니
            const itemToMove = items.find(item => item.id === draggedItemId);
            if (!itemToMove) return;

            const newCartItem = { ...itemToMove, id: `temp-cart-${Date.now()}` };
            setItems((prev) => prev.filter(item => item.id !== draggedItemId));
            setCartItems((prev) => [...prev, newCartItem]);
            
            if (typeof onSetModalMessage === 'function') {
                onSetModalMessage(`'${itemToMove.name}'이(가) 장바구니로 이동되었습니다.`);
            }

            if (isLoggedIn && !(String(draggedItemId).startsWith('temp-'))) {
                try {
                    const response = await FridgeApiClient.post(`/api/ingredients/${draggedItemId}/move-to-cart`);
                    setCartItems((prev) => prev.map(item => item.id === newCartItem.id ? response.data : item));
                } catch(error) { console.error("API 실패", error); }
            }
        } else if (sourceType === 'fridge') { // 냉장고 내 이동
            const originalItems = [...items];
            const itemToMove = originalItems.find(item => item.id === draggedItemId);
            
            if (!itemToMove) return;
            setItems((prev) => prev.map(item => 
                item.id === draggedItemId ? { ...item, category: newCategory, icon: getCategoryEmoji(newCategory) } : item
            ));

            if (isLoggedIn && !(String(draggedItemId).startsWith('temp-'))) {
                try {
                    await FridgeApiClient.patch(`/api/ingredients/${draggedItemId}/category`, { category: newCategory });
                    if (typeof onSetModalMessage === 'function') {
                        onSetModalMessage(`'${itemToMove.name}'이(가) '${titleForDisplay(newCategory)}' 칸으로 이동되었습니다.`);
                    }
                } catch(error) {
                    const errorMessage = error.respoㅌnse?.data?.message || `'${titleForDisplay(newCategory)}'(으)로 이동할 수 없습니다.`;
                    if (typeof onSetModalMessage === 'function') {
                        onSetModalMessage(errorMessage);
                    }
                    setItems(originalItems); 
                }
            }
        }
    };

    const handleMouseEnterItem = (item, event) => {
        setActiveHoverItem(item);
        setHoverPosition({ x: event.clientX, y: event.clientY });
    };

    const handleMouseLeaveItem = () => {
        setActiveHoverItem(null);
    };

    const contextValue = {
        isFridgeOpen, items, cartItems, isLoading, activeHoverItem, hoverPosition,
        toggleFridge, handleAddItem, handleRemoveItemFromFridge, handleRemoveItemFromCart, handleDropItem,
        handleMouseEnterItem, handleMouseLeaveItem, fetchInitialData,
    };

    return (
        <FridgeContext.Provider value={contextValue}>
            {children}
        </FridgeContext.Provider>
    );
};

export { FridgeContext, FridgeProvider };
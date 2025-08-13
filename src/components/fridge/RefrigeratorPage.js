import React, { useContext, useEffect, useState } from 'react';
import ItemDetail from './ItemDetail';
import Sidebar from './Sidebar';
import Fridge from './Fridge';
import CustomModal from './CustomModal';
import { FridgeContext } from './contexts/FridgeContext';
import { useLocation } from 'react-router-dom';

const RefrigeratorPage = ({ loggedInUserId, loggedInNickName }) => { // isLoading prop 제거

    const [modalMessage, setModalMessage] = useState(''); // 모달 메시지 상태

    // FridgeContext에서 필요한 상태와 함수들을 가져옵니다.
    // ⭐ isLoading 상태를 FridgeContext에서 가져오도록 수정
    const {
        isFridgeOpen, items, cartItems, activeHoverItem, hoverPosition, isLoading, // isLoading 추가
        toggleFridge, handleAddItem, handleRemoveItemFromFridge, handleRemoveItemFromCart, handleDropItem,
        handleMouseEnterItem, handleMouseLeaveItem, fetchInitialData
    } = useContext(FridgeContext);

    const location = useLocation();

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData, location]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center p-4">
                <div className="flex items-center justify-center bg-white p-8 rounded-lg shadow-xl text-lg font-semibold text-gray-700">
                    데이터를 로딩 중입니다...
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-100 flex items-center justify-center p-4" style={{border: "1px, solid, eee", borderRadius: "8px"}}>
            
            <div className="flex w-full max-w-7xl h-[800px] bg-white rounded-2xl shadow-2xl overflow-hidden">
                <Sidebar
                    items={items}
                    cartItems={cartItems}
                    onAddItem={handleAddItem}
                    onDropItem={handleDropItem}
                    onSetModalMessage={setModalMessage}
                    onRemoveItemFromCart={handleRemoveItemFromCart}
                    loggedInUserId={loggedInUserId} // Sidebar에 loggedInUserId prop으로 전달
                    loggedInNickName={loggedInNickName} // Sidebar에 loggedInNickName prop으로 전달
                />
                <main className="flex-1 p-8 flex items-center justify-center">
                    <Fridge
                        isOpen={isFridgeOpen}
                        toggleFridge={toggleFridge}
                        items={items}
                        onDropItem={handleDropItem}
                        onMouseEnter={handleMouseEnterItem}
                        onMouseLeave={handleMouseLeaveItem}
                        onDeleteItem={handleRemoveItemFromFridge}
                    />
                </main>
            </div>
            {/* ItemDetail과 CustomModal은 FridgeContext 외부에서 관리되는 상태를 사용하므로 문제 없음 */}
            <ItemDetail item={activeHoverItem} position={hoverPosition} />
            <CustomModal message={modalMessage} onClose={() => setModalMessage('')} />
        </div>
    );
};

export default RefrigeratorPage;
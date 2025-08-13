import { getCategoryEmoji } from "./fridge/utils/Constants";

const CartModal = ({ isVisible, onClose, cartItems, onLoadItems, isLoading, isLoggined, onRemoveItem }) => {

    if (!isVisible) {
        return null;
    }
    

    return (
        // 모달 배경 (어둡게 처리)
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onClose} // 배경 클릭 시 닫기
        >
            {/* 모달 컨텐츠 */}
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in-down"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">나의 장바구니</h2>
                </div>
                {/* 장바구니 아이템 목록 */}
                <div className="max-h-80 overflow-y-auto min-h-[10rem]">
                    {!isLoggined ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">로그인 후에 사용할 수 있습니다.</p>
                        </div>
                    ) : isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">장바구니를 불러오는 중입니다.</p>
                        </div>
                    ) : cartItems.length > 0 ? (
                        <ul className="space-y-3">
                            {cartItems.map(item => (
                                <li key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <span className="mr-3 text-xl">{ getCategoryEmoji(item.category)}</span>
                                        <div>
                                            <p className="font-semibold text-gray-700">{ item.name }</p>
                                            <p className="text-xs text-gray-500">수량: { item.quantity }</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onRemoveItem(item.id)}
                                        className="px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full hover:bg-red-200 hover:text-red-800 transition-colors"
                                        aria-label={ `${ item.name } 삭제` }
                                    >
                                        삭제
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-center py-10">장바구니가 비어있습니다.</p>
                    )}
                </div>
                <div className="flex justify-end mt-6">
                    { cartItems.length > 0 && (
                        <button
                            onClick={ onLoadItems }
                            className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 mr-2"
                        >
                            재료 넣기
                        </button>
                    )}
                    <button
                        onClick={ onClose }
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartModal;
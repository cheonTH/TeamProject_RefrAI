import { useDrag } from "react-dnd";
import { getCategoryEmoji, ItemTypes, titleForDisplay } from "./utils/Constants";

// 장바구니 아이템을 리스트 형태로 표시하고 드래그 가능하게 하는 컴포넌트
const CartItemDisplay = ({ item, onRemove }) => {
    
    // ✅ 1. 드래그 로직 리팩토링: 드래그 시 전달하는 데이터를 간소화합니다.
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.INGREDIENT, // 드롭 가능한 타입은 동일합니다.
        item: { 
            id: item.id,
            category: item.category,
            sourceType: 'cart' // 이 아이템의 출처가 '장바구니'임을 명시합니다.
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    const handleDeleteClick = () => {
        if (typeof onRemove === 'function') {
            onRemove(item.id);
        }
    };

    // ✅ 2. 데이터 표준화: 표시되는 날짜를 'createdAt' 기준으로 변경합니다.
    const formattedDate = item.createdAt 
        ? new Date(item.createdAt).toLocaleDateString('ko-KR') 
        : '날짜 정보 없음';

    return (
        <li
            ref={drag}
            className={`flex flex-col bg-[#d38c37] p-2 rounded-md mb-2 cursor-grab ${isDragging ? 'opacity-50 border-2 border-orange-400' : 'opacity-100'}`}
            style={{ zIndex: isDragging ? 100 : 'auto' }}
        >
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold">{getCategoryEmoji(item.category)} {item.name}</span>
                <span className="text-xs text-gray-100">수량: {item.quantity}</span>
            </div>
            <div className="text-xs text-gray-200 mb-1">
                <p>카테고리: {titleForDisplay(item.category)}</p>
                <p>담은 날짜: {formattedDate}</p>
            </div>
            <div className="flex justify-end space-x-2">
                <button
                    onClick={handleDeleteClick}
                    className="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors duration-200"
                >
                    삭제
                </button>
            </div>
        </li>
    );
};

export default CartItemDisplay;

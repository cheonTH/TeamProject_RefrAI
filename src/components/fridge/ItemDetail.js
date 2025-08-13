import { titleForDisplay } from "./utils/Constants";

const ItemDetail = ({ item, position }) => {
    if (!item) return null;

    // ✅ 5. 데이터 표준화: 'createdTime'을 기준으로 날짜를 표시합니다.
    const formattedDate = item.createdTime 
        ? new Date(item.createdTime).toLocaleDateString('ko-KR') 
        : '날짜 정보 없음';

    return (
        <div
            className="absolute bg-gray-800 text-white text-xs p-2 rounded-lg shadow-lg z-50 transition-opacity duration-300 ease-in-out"
            style={{ left: position.x + 15, top: position.y + 15, pointerEvents: 'none' }}
        >
            <p className="font-semibold">{item.name}</p>
            <p>수량: {item.quantity}</p>
            <p>카테고리: {titleForDisplay(item.category)}</p>
            <p>등록일: {formattedDate}</p>
        </div>
    );
};

export default ItemDetail;
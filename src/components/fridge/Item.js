import { useDrag } from "react-dnd";
import { getCategoryEmoji, ItemTypes } from "./utils/Constants";

const Item = ({ item, onMouseEnter, onMouseLeave, onDelete }) => {
    
    // ✅ [핵심 수정 1] 드래그 시, 자신의 'category' 정보를 함께 전달합니다.
    // 이렇게 해야 드롭 존(Section)이 이 아이템의 현재 위치를 알 수 있습니다.
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.INGREDIENT,
        item: { 
            id: item.id, 
            sourceType: 'fridge',
            category: item.category, // 자신의 현재 카테고리 정보 추가
            name: item.name,
            icon: item.icon
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    const opacity = isDragging ? 0 : 1;

    return (
        <div
            ref={drag}
            className={`relative w-20 h-20 bg-white rounded-lg flex flex-col items-center justify-center p-1 m-1 cursor-grab shadow-md ${isDragging ? 'opacity-50 border-2 border-blue-500' : 'opacity-100'} transform transition-transform duration-150 ease-in-out hover:scale-105`}
            onMouseEnter={(e) => onMouseEnter(item, e)}
            onMouseLeave={onMouseLeave}
            style={{ zIndex: isDragging ? 100 : 'auto', opacity }}
        >
            <button
                onClick={() => onDelete(item.id)}
                className="absolute top-0 right-0 -mt-2 -mr-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors duration-200 z-10"
                aria-label="Delete item"
            >
                &times;
            </button>
            <span className="text-3xl mb-1" role="img" aria-label={item.name}>
                {item.icon || getCategoryEmoji(item.category)}
            </span>
            <p className="text-xs text-gray-800 truncate w-full text-center">{item.name}</p>
        </div>
    );
};

export default Item;
import { useDrop } from "react-dnd";
import Item from "./Item";
import { ItemTypes } from "./utils/Constants";

const Section = ({ sectionId, title, items, onDropItem, onDeleteItem, onMouseEnter, onMouseLeave }) => {
    
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: ItemTypes.INGREDIENT,
        
        // ✅ [최종 수정안] 모든 규칙을 통합하고 단순화한 canDrop 로직
        canDrop: (draggedItem) => {
            const currentCategory = draggedItem.category; // 드래그된 아이템의 원래 카테고리
            const targetCategory = sectionId;             // 드롭하려는 칸의 카테고리

            if (!draggedItem || typeof draggedItem.category === 'undefined') {
                console.warn("드래그된 아이템에 카테고리 정보가 없습니다.", draggedItem);
                return false;
            }

            // 규칙 1: '냉동' 아이템은 어디든 갈 수 있습니다.
            if (currentCategory === 'freezer') {
                return true;
            }

            // 규칙 2: 모든 아이템은 '냉동칸'으로 갈 수 있습니다.
            if (targetCategory === 'freezer') {
                return true;
            }

            // 규칙 3: 그 외의 경우, 아이템은 오직 자신의 원래 카테고리로만 갈 수 있습니다.
            if (currentCategory === targetCategory) {
                return true;
            }

            // 위의 모든 규칙에 해당하지 않으면 드롭을 허용하지 않습니다.
            return false;
        },

        drop: (draggedItem) => {
            // canDrop이 true일 때만 이 함수가 실행됩니다.
            onDropItem(draggedItem.id, sectionId, draggedItem.sourceType);
        },

        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }), [onDropItem, sectionId]);

    // UI 피드백: 드롭 가능한 곳은 파란색, 불가능한 곳은 빨간색으로 표시
    const isActive = isOver && canDrop;
    let backgroundColor = 'bg-blue-50';
    if (isActive) {
        backgroundColor = 'bg-blue-100 border-2 border-blue-400';
    } else if (isOver && !canDrop) {
        backgroundColor = 'bg-red-100 border-2 border-red-400';
    }

    return (
        <div
            ref={drop}
            onMouseLeave={onMouseLeave}
            className={`flex-1 min-h-[200px] border border-blue-300 rounded-lg p-2 m-2 transition-colors duration-200 ${backgroundColor} flex flex-wrap content-start items-start justify-center`}
        >
            <h3 className="w-full text-center text-sm font-semibold text-blue-800 mb-2">
                {title}
            </h3>
            {items.map((item) => (
                <Item
                    key={item.id}
                    item={item}
                    onMouseEnter={onMouseEnter}
                    onDelete={onDeleteItem}
                />
            ))}
        </div>
    );
};

export default Section;
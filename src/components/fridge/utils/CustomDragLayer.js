import React from 'react';
import { useDragLayer } from 'react-dnd';
import { getCategoryEmoji, ItemTypes } from './Constants';

// 드래그 레이어의 스타일
const layerStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 100,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
};

// 드래그하는 아이템의 미리보기를 렌더링하는 함수
const getItemStyles = (currentOffset) => {
    if (!currentOffset) {
        return { display: 'none' };
    }
    const { x, y } = currentOffset;
    const transform = `translate(${x}px, ${y}px)`;
    return {
        transform,
        WebkitTransform: transform,
    };
};

/**
 * 드래그하는 동안 마우스를 따라다니는 커스텀 미리보기를 렌더링하는 컴포넌트
 */
const CustomDragLayer = () => {
    const {
        itemType,       // 드래그 중인 아이템의 타입 ('ingredient')
        isDragging,     // 현재 드래그 중인지 여부 (boolean)
        item,           // 드래그 중인 아이템의 정보 (useDrag에서 전달한 객체)
        currentOffset,  // 마우스 커서의 현재 위치
    } = useDragLayer((monitor) => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        isDragging: monitor.isDragging(),
        currentOffset: monitor.getSourceClientOffset(),
    }));

    // 드래그 중이 아니거나, 아이템 타입이 맞지 않으면 아무것도 보여주지 않음
    if (!isDragging || itemType !== ItemTypes.INGREDIENT) {
        return null;
    }

    // 미리보기 렌더링
    return (
        <div style={layerStyles}>
        <div style={getItemStyles(currentOffset)}>
            {/* Item.js와 유사한 모양으로 미리보기를 만듭니다. */}
            <div className="relative w-20 h-20 bg-white rounded-lg flex flex-col items-center justify-center p-1 m-1 shadow-lg border-2 border-blue-400">
            <span className="text-3xl mb-1" role="img" aria-label={item.name}>
                {item.icon || getCategoryEmoji(item.category)}
            </span>
            <p className="text-xs text-gray-800 truncate w-full text-center">{item.name}</p>
            </div>
        </div>
        </div>
    );
};

export default CustomDragLayer;
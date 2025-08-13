const ItemTypes = {
  INGREDIENT: 'ingredient',
};

// 백엔드와 약속된 표준 영문 key를 기반으로 이모티콘을 반환
const getCategoryEmoji = (categoryKey) => {
    switch (categoryKey) {
        case 'vegetable':
        return '🥕';
        case 'meat':
        return '🥩';
        case 'freezer':
        return '🧊';
        case 'other':
        return '🧀';
        default:
        return '📦'; 
    }
};

// 백엔드와 약속된 표준 영문 key를 기반으로 한글 표시명을 반환
const titleForDisplay = (categoryKey) => {
    switch(categoryKey) {
        case 'vegetable': return '야채';
        case 'meat': return '육류';
        case 'other': return '기타';
        case 'freezer': return '냉동';
        default: return '알 수 없는';
    }
};

export { ItemTypes, getCategoryEmoji, titleForDisplay };
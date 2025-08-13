import Section from "./Section";

const Freezer = ({ items, onDropItem, onDeleteItem, onMouseEnter, onMouseLeave }) => {

    // ✅ 1. 데이터 표준화: 'category' 필드와 영문 key를 기준으로 필터링합니다.
    const freezerItems = items.filter((item) => item.category === 'freezer');

    return (
        <div className="flex flex-col bg-blue-200 p-4 rounded-lg shadow-inner">
            <h2 className="text-xl font-bold text-indigo-800 mb-4 text-center">냉동실</h2>
            <div className="flex-1 flex">
                <Section
                    sectionId="freezer"
                    items={freezerItems}
                    onDropItem={onDropItem}
                    onDeleteItem={onDeleteItem}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    // ✅ 2. 불필요한 props 제거: showValidationMessage를 제거했습니다.
                />
            </div>
        </div>
    );
};

export default Freezer;
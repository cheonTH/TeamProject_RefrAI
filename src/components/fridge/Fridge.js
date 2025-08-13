import Freezer from "./Freezer";
import Refrigerator from "./Refrigerator";

const Fridge = ({ isOpen, toggleFridge, items, onDropItem, showValidationMessage, onMouseEnter, onMouseLeave, onDeleteItem }) => {
    return (
        <div className="relative w-full max-w-4xl h-[700px] bg-amber-200 rounded-2xl overflow-hidden">
            {/* 냉장고 문 (닫힌 상태) */}
            <div
                className={`absolute inset-0 bg-amber-800 rounded-2xl z-20 transform transition-transform duration-700 ease-in-out
                    ${isOpen ? '-translate-x-full' : 'translate-x-0'}
                    flex items-center justify-center cursor-pointer border-r-8 border-amber-900`}
                onClick={ toggleFridge }
            >
                <span className="text-white text-4xl font-bold">클릭해서 열어주세요</span>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-20 bg-amber-600 rounded-full shadow-inner"></div>
            </div>
            {/* 냉장고 내부 (열린 상태) */}
            <div className="absolute h-full inset-0 bg-blue-50 p-6 flex flex-col justify-between transition-opacity duration-700 ease-in-out">
                {isOpen && (
                    <div className="w-full h-full flex flex-col justify-between">
                        <div className="flex-1 overflow-y-auto pb-4">
                            <Refrigerator
                                items={ items }
                                onDropItem={ onDropItem }
                                showValidationMessage={ showValidationMessage }
                                onDeleteItem={ onDeleteItem }
                                onMouseEnter={ onMouseEnter }
                                onMouseLeave={ onMouseLeave }
                            />
                            <Freezer
                                items={ items }
                                onDropItem={ onDropItem }
                                showValidationMessage={ showValidationMessage }
                                onDeleteItem={ onDeleteItem }
                                onMouseEnter={ onMouseEnter }
                                onMouseLeave={ onMouseLeave }
                            />
                        </div>
                        {/* 닫기 버튼 */}
                        <button
                            onClick={ toggleFridge }
                            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-300"
                        >
                            냉장고 닫기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Fridge;
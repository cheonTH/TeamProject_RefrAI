import { useState } from "react";
import { useDrop } from "react-dnd";
import { getCategoryEmoji, ItemTypes } from "./utils/Constants";
import CartItemDisplay from "./CartItemDisplay";

const Sidebar = ({ cartItems, onAddItem, onRemoveItemFromCart, onDropItem, onSetModalMessage }) => {
    
    const [newItemName, setNewItemName] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState(1);
    const [newItemCategory, setNewItemCategory] = useState('vegetable');

    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: ItemTypes.INGREDIENT,
        drop: (item) => onDropItem(item.id, 'cart', 'fridge'),
        collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
    }), [onDropItem]);

    const handleAddItemToFridgeDirectly = () => {
        if (newItemName.trim() === '') {
            if (typeof onSetModalMessage === 'function') {
                onSetModalMessage('재료 이름을 입력해주세요!');
            }
            return;
        }

        if (typeof onAddItem === 'function') {
            const icon = getCategoryEmoji(newItemCategory);
            onAddItem(newItemName.trim(), newItemQuantity, newItemCategory, icon);
        }

        setNewItemName('');
        setNewItemQuantity(1);
        setNewItemCategory('vegetable');
    };

    // 장바구니 아이템을 카테고리별로 그룹화하는 로직
    const groupedCartItems = cartItems.reduce((acc, item) => {
        const categoryKey = item.category || 'other';
        (acc[categoryKey] = acc[categoryKey] || []).push(item);
        return acc;
    }, {});

    return (
        <div className="w-80 bg-[#FF8C00] text-white p-6 flex flex-col rounded-l-2xl">
            <h2 className="text-2xl font-bold mb-6 text-center">재료 관리</h2>
            <div className="mb-8 p-4 bg-[#d17300] rounded-lg">
                <h3 className="text-lg font-semibold mb-3">새 재료 추가</h3>
                <input
                    type="text"
                    placeholder="재료 이름"
                    className="w-full p-2 mb-3 rounded-md bg-[#d38c37] border border-[#bb7622] text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                />
                {/* 수량 입력 UI */}
                <input
                    type="number"
                    placeholder="수량"
                    className="w-full p-2 mb-3 rounded-md bg-[#d38c37] border border-[#bb7622] text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
                />
                <select
                    className="w-full p-2 mb-3 rounded-md bg-[#d38c37] border border-[#bb7622] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                >
                    <option value="vegetable">야채</option>
                    <option value="meat">육류</option>
                    <option value="other">기타</option>
                    <option value="freezer">냉동</option>
                </select>
                <button
                    onClick={handleAddItemToFridgeDirectly}
                    className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors duration-300"
                >
                    냉장고에 추가
                </button>
            </div>
            <div
                ref={drop}
                className={`flex-1 p-4 bg-[#d17300] rounded-lg overflow-y-auto transition-colors duration-200 ${isOver && canDrop ? 'bg-blue-600 border-2 border-blue-400' : ''}`}
            >
                <h3 className="text-lg font-semibold mb-3">장바구니</h3>
                <ul className="space-y-2">
                    {cartItems.length === 0 && <li className="text-sm text-gray-200">장바구니가 비어있습니다.</li>}
                    {Object.keys(groupedCartItems).map(category => (
                        <div key={category} className="mb-3">
                            {groupedCartItems[category].map((item) => (
                                <CartItemDisplay
                                    key={item.id}
                                    item={item}
                                    onRemove={onRemoveItemFromCart}
                                />
                            ))}
                        </div>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Sidebar;
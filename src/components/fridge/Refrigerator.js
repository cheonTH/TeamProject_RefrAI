import Section from "./Section";

const Refrigerator = ({ items, onDropItem, onDeleteItem, onMouseEnter, onMouseLeave }) => {
    
    const vegetableItems = items.filter((item) => item.category === 'vegetable');
    const meatItems = items.filter((item) => item.category === 'meat');
    const otherItems = items.filter((item) => item.category === 'other');

    return (
        <div className="flex flex-col bg-blue-100 p-4 rounded-lg shadow-inner mb-4">
            <h2 className="text-xl font-bold text-blue-800 mb-4 text-center">냉장실</h2>
            <div className="flex-1 flex flex-col md:flex-row">
                <Section
                    sectionId="vegetable"
                    title="야채"
                    items={ vegetableItems }
                    onDropItem={ onDropItem }
                    onDeleteItem={ onDeleteItem }
                    onMouseEnter={ onMouseEnter }
                    onMouseLeave={ onMouseLeave }
                />
                <Section
                    sectionId="meat"
                    title="육류"
                    items={ meatItems }
                    onDropItem={ onDropItem }
                    onDeleteItem={ onDeleteItem }
                    onMouseEnter={ onMouseEnter }
                    onMouseLeave={ onMouseLeave }
                />
                <Section
                    sectionId="other"
                    title="기타"
                    items={ otherItems }
                    onDropItem={ onDropItem }
                    onDeleteItem={ onDeleteItem }
                    onMouseEnter={ onMouseEnter }
                    onMouseLeave={ onMouseLeave }
                />
            </div>
        </div>
    );
};

export default Refrigerator;
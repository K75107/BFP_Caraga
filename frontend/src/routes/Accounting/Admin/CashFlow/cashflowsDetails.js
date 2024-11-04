import React, { Fragment, useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { db } from "../../../../config/firebase-config";
import { collection, doc, onSnapshot, addDoc, writeBatch } from "firebase/firestore";
import { DndContext, closestCorners, useDroppable, useDraggable, PointerSensor } from '@dnd-kit/core';
import Modal from '../../../../components/Modal';
import SuccessUnsuccessfulAlert from "../../../../components/Alerts/SuccessUnsuccessfulALert";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities"
import { createSnapModifier } from '@dnd-kit/modifiers';
import { arrayMove } from '@dnd-kit/sortable';
import { position } from "@chakra-ui/react";

export default function CashflowsDetails() {
    const [showModal, setShowModal] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const { cashflowId } = useParams();
    const [cashflowCategoriesData, setCashflowCategoriesData] = useState([]);
    const [selectedRowData, setSelectedRowData] = useState(null);
    const [showRightClickModal, setShowRightClickModal] = useState(false);
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });


    useEffect(() => {
        const cashflowsCollectionRef = collection(db, 'cashflow', cashflowId, 'categories');

        const unsubscribe = onSnapshot(cashflowsCollectionRef, (querySnapshot) => {
            try {
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                const sortedData = sortCategoriesRecursively(data);
                console.log("sorted data", sortedData);
                setCashflowCategoriesData(sortedData);
            } catch (error) {
                console.error('Error fetching and sorting categories:', error);
                setIsError(true);
            }
        });

        return () => unsubscribe();
    }, [cashflowId]);


    const sortCategoriesRecursively = (categories, parentID = null, level = 0) => {
        const filteredCategories = categories
            .filter(category => category.parentID === parentID)
            .sort((a, b) => a.position - b.position);

        return filteredCategories.flatMap(category => [
            { ...category, level },
            ...sortCategoriesRecursively(categories, category.id, level + 1)
        ]);
    };




    const [expandedCategories, setExpandedCategories] = useState({});

    const toggleCategory = (categoryId) => {
        setExpandedCategories((prev) => {
            const newExpandedState = {
                ...prev,
                [categoryId]: !prev[categoryId],
            };

            // Log the updated expanded state
            console.log("Toggled expandedCategories:", newExpandedState);

            return newExpandedState;
        });

    };




    // Function to get visible categories based on the expanded state
    const getVisibleCategories = () => {
        return cashflowCategoriesData.filter((category) => {
            // Check if the category is a main category or if it is expanded
            if (category.parentID === null) return true;

            // If the category has a parent, check if the parent is expanded
            let currentCategory = category;
            while (currentCategory.parentID) {
                if (!expandedCategories[currentCategory.parentID]) {
                    return false; // Parent is not expanded
                }
                currentCategory = cashflowCategoriesData.find(cat => cat.id === currentCategory.parentID);
            }
            return true; // This category and its parents are expanded
        });
    };

    // Use getVisibleCategories in your rendering logic
    const visibleCategories = getVisibleCategories();

    const addNewCategory = async () => {
        try {
            const cashflowDocRef = doc(db, 'cashflow', cashflowId);
            const categoriesCollectionRef = collection(cashflowDocRef, 'categories');

            const sortedAccounts = [...cashflowCategoriesData].filter(cat => cat.parentID === null);
            const newRowPosition = sortedAccounts.length > 0
                ? sortedAccounts[sortedAccounts.length - 1].position + 1
                : 1;

            const docRef = await addDoc(categoriesCollectionRef, {
                categoryName: newCategory,
                parentID: null,
                created_at: new Date(),
                position: parseFloat(newRowPosition.toFixed(10)), // Ensure it's a float

            });

            const newCategoryCreated = {
                id: docRef.id,
                categoryName: newCategory,
                parentID: null,
                created_at: new Date(),
                position: parseFloat(newRowPosition.toFixed(10)), // Ensure it's a float

            };

            setCashflowCategoriesData((prevData) => [...prevData, newCategoryCreated]);
            setIsSuccess(true);
        } catch (error) {
            console.error('Error adding new category:', error);
            setIsError(true);
        }
    };

    const addNewSubcategory = async () => {
        if (!selectedRowData) return;
        try {
            const cashflowDocRef = doc(db, 'cashflow', cashflowId);
            const categoriesCollectionRef = collection(cashflowDocRef, 'categories');

            const siblings = cashflowCategoriesData.filter(cat => cat.parentID === selectedRowData.id);
            const newRowPosition = siblings.length > 0
                ? siblings[siblings.length - 1].position + 1
                : 1;

            const docRef = await addDoc(categoriesCollectionRef, {
                categoryName: 'New Subcategory',
                parentID: selectedRowData.id,
                created_at: new Date(),
                position: parseFloat(newRowPosition.toFixed(10)), // Ensure it's a float

            });

            const newSubcategoryCreated = {
                id: docRef.id,
                categoryName: 'New Subcategory',
                parentID: selectedRowData.id,
                created_at: new Date(),
                position: parseFloat(newRowPosition.toFixed(10)), // Ensure it's a float
            };

            setCashflowCategoriesData((prevData) => [...prevData, newSubcategoryCreated]);
            setIsSuccess(true);
        } catch (error) {
            console.error('Error adding new subcategory:', error);
            setIsError(true);
        }
    };

    const handleRightClick = (event, category) => {
        event.preventDefault();
        setSelectedRowData(category);
        setModalPosition({ x: event.clientX, y: event.clientY - 50 });
        setShowRightClickModal(true);
    };

    const closeModalOnOutsideClick = (e) => {
        if (e.target.id === "user-modal-overlay") {
            setShowRightClickModal(false);
        }
    };

    function SortableRow({ category, handleRightClick }) {
        const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id });
        const style = {
            transition,
            transform: CSS.Transform.toString(transform),
        };

        return (
            <tr
                ref={setNodeRef}
                {...attributes}
                style={style}
                className="border-b"
                onContextMenu={(e) => handleRightClick(e, category)}
            >
                <td
                    className="px-2 py-3 bg-white dark:bg-gray-800 flex items-center"
                    style={{ paddingLeft: `${45 * category.level}px` }}
                >
                    {/* Drag Icon */}
                    <span {...listeners} className="cursor-grab mr-2 text-gray-500">
                        ☰
                    </span>

                    {/* Category Name */}
                    <span>{category.categoryName}</span>

                    {/* Toggle Button at the end */}
                    {(category.level >= 0 && cashflowCategoriesData.some(subCat => subCat.parentID === category.id)) && (
                        <button
                            onClick={() => toggleCategory(category.id)}
                            className="mr-2 text-blue-500"
                        >
                            {expandedCategories[category.id] ? "▾" : "▸"}
                        </button>
                    )}

                </td>
                <td className="px-2 py-3 text-center">{/* Period data if any */}</td>
                <td className="px-2 py-3 text-center">{/* Any actions */}</td>
            </tr>
        );
    }


    // Memoize handleDragEnd to prevent it from changing on each render
    const handleDragEnd = useCallback(
        async (event) => {
            const { active, over, delta } = event;
            if (!over || active.id === over.id) return;
    
            const activeIndex = cashflowCategoriesData.findIndex(item => item.id === active.id);
            const activeItem = cashflowCategoriesData[activeIndex];
            const overIndex = cashflowCategoriesData.findIndex(item => item.id === over.id);
            
            // Determine if the dragged item is at the top
            let newRowPosition;
            if (overIndex === 0 && delta.y < 0) {
                // If the item is dragged to the top with no over data, make it the first row
                newRowPosition = 1;
            } else if (overIndex < visibleCategories.length - 1) {
                const nextItem = visibleCategories[overIndex + 1];
                newRowPosition = (over.position + nextItem.position) / 2; // Midpoint between overItem and nextItem
            } else {
                newRowPosition = over.position + 1; // Place it after the last item
            }
    
            // Calculate the new level based on grid movement
            const gridSize = 45;
            const gridMovement = Math.round(delta.x / gridSize);
            let newLevel = activeItem.level + gridMovement;
            newLevel = Math.max(0, newLevel);
    
            let newParentID = null;
            if (newLevel > 0) {
                for (let i = overIndex; i >= 0; i--) {
                    if (cashflowCategoriesData[i].level === newLevel - 1) {
                        newParentID = cashflowCategoriesData[i].id;
                        break;
                    }
                }
            }
    
            const updatedCategories = cashflowCategoriesData.map((item) =>
                item.id === active.id
                    ? { ...item, position: newRowPosition, level: newLevel, parentID: newParentID }
                    : item
            );
    
            const finalUpdatedCategories = arrayMove(updatedCategories, activeIndex, overIndex);
    
            // Reset positions sequentially after each change
            const resetCategories = finalUpdatedCategories.map((item, index) => ({
                ...item,
                position: index + 1, // Sequential positions
            }));
    
            setCashflowCategoriesData(resetCategories);
    
            const batch = writeBatch(db);
            resetCategories.forEach((category) => {
                const categoryDocRef = doc(db, 'cashflow', cashflowId, 'categories', category.id);
                batch.update(categoryDocRef, {
                    parentID: category.parentID ?? null,
                    level: category.level,
                    position: category.position,
                });
            });
    
            try {
                await batch.commit();
                setIsSuccess(true);
            } catch (error) {
                console.error('Error updating positions in Firestore:', error);
                setIsError(true);
            }
        },
        [cashflowCategoriesData, cashflowId]
    );
    



    const gridSize = 45;

    function snapToGrid(args) {
        const { transform } = args;

        return {
            ...transform,
            x: Math.ceil(transform.x / gridSize) * gridSize,
            y: Math.ceil(transform.y / gridSize) * gridSize,
        };
    }

    const handleDragStart = useCallback((event) => {
        const categoryId = event.active.id;
        const category = cashflowCategoriesData.find(cat => cat.id === categoryId);

        if (category) {
            toggleCategory(category.id); // Expands or collapses subcategories as expected
        } else {
            console.log("Category not found on drag start");
        }
    }, [cashflowCategoriesData, toggleCategory]);


    return (
        <Fragment>

            {isSuccess && (
                <div className="absolute top-4 right-4">
                    <SuccessUnsuccessfulAlert isSuccess={isSuccess} message={'New Cashflow Statement Created'} icon={'check'} />
                </div>
            )}
            {isError && (
                <div className="absolute top-4 right-4">
                    <SuccessUnsuccessfulAlert isError={isError} message={'Error occurred'} icon={'wrong'} />
                </div>
            )}

            <div className="bg-white h-full py-6 px-8 w-full rounded-lg">
                <div className="flex justify-between w-full">
                    <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">Cashflow Statement</h1>
                </div>
                <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                    <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" role="tablist">
                        <li className="ml-auto">
                            <button
                                onClick={() => setShowModal(true)}
                                className="mb-2 bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-3 text-[11px] font-medium"
                            >
                                + ADD CATEGORY
                            </button>
                        </li>
                    </ul>
                </div>
                <DndContext onDragEnd={handleDragEnd} modifiers={[snapToGrid]} collisionDetection={closestCorners} onDragStart={handleDragStart}>
                    <div className="w-full overflow-y-scroll h-[calc(96vh-240px)]">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-[12px] text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-2 py-3 w-[160px]">Account Description</th>
                                    <th scope="col" className="px-2 py-3 w-[288px] text-center">Period</th>
                                    <th scope="col" className="w-[20px]"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <SortableContext items={visibleCategories} strategy={verticalListSortingStrategy}>
                                    {visibleCategories.map((category) => (
                                        <SortableRow
                                            key={category.id}
                                            category={category}
                                            handleRightClick={handleRightClick}
                                        />
                                    ))}
                                </SortableContext>
                            </tbody>
                        </table>
                    </div>
                </DndContext>
            </div>

            <Modal isVisible={showModal}>
                <div className="bg-white w-[600px] h-60 rounded py-2 px-4">
                    <div className="flex justify-between">
                        <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">Add New Category</h1>
                        <button className="font-poppins text-[27px] text-[#1E1E1E]" onClick={() => setShowModal(false)}>×</button>
                    </div>
                    <hr className="border-t border-[#7694D4] my-3" />
                    <div className="relative">
                        <input
                            type="text"
                            id="default_outlined1"
                            className="block px-2.5 pb-2.5 pt-4 w-80 text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 focus:outline-none focus:border-blue-600 peer"
                            placeholder=" "
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <label
                            htmlFor="default_outlined1"
                            className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-0 bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 left-1"
                        >
                            Category Name
                        </label>
                        <button onClick={addNewCategory} className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-3 text-[11px] font-medium ml-2">
                            + ADD CATEGORY
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Right-click context modal */}
            {showRightClickModal && (
                <div
                    id="user-modal-overlay"
                    className="fixed inset-0 flex justify-center items-center"
                    onClick={closeModalOnOutsideClick}
                    onContextMenu={(event) => closeModalOnOutsideClick(event)}
                >
                    <div
                        style={{ top: modalPosition.y, left: modalPosition.x }}
                        className="absolute z-10 bg-white shadow-lg rounded-lg p-2"
                    >
                        <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={addNewSubcategory}
                        >
                            Add Subcategory
                        </button>

                        <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        // onClick={handleDeleteRow}
                        >
                            Delete Row
                        </button>
                    </div>
                </div>
            )}

        </Fragment>
    );
}

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

    const navigate = useNavigate();

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
                mainCategory: true,
                position: newRowPosition
            });

            const newCategoryCreated = {
                id: docRef.id,
                categoryName: newCategory,
                parentID: null,
                created_at: new Date(),
                mainCategory: true,
                position: newRowPosition
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
                mainCategory: false,
                position: newRowPosition
            });

            const newSubcategoryCreated = {
                id: docRef.id,
                categoryName: 'New Subcategory',
                parentID: selectedRowData.id,
                created_at: new Date(),
                mainCategory: false,
                position: newRowPosition
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
        const { attributes, listeners, setNodeRef, transform, transition, over } = useSortable({ id: category.id });

        const style = {

            transition,
            transform: CSS.Transform.toString(transform),
        };

        return (
            <tr
                ref={setNodeRef}
                {...attributes}
                {...listeners}
                id={category.id}
                key={category.id}
                style={style}
                className="border-b"
                onContextMenu={(e) => handleRightClick(e, category)}
            >
                <td
                    style={{ paddingLeft: `${20 * category.level}px` }}
                    className="px-2 py-3 bg-white dark:bg-gray-800"
                >
                    {category.categoryName}
                </td>
                <td className="px-2 py-3 text-center">{/* Period data if any */}</td>
                <td className="px-2 py-3 text-center">{/* Any actions */}</td>
            </tr>
        );
    }


    // Memoize handleDragEnd to prevent it from changing on each render
    const handleDragEnd = useCallback(
        async (event) => {
            const { active, over } = event;
            if (!over || active.id === over.id)return;

            const targetItem = over.id;
            // Get the midpoints of the over element
            const overLeftBoundary = over.rect.left;
            const overCenterX = overLeftBoundary;

            // Get the center position of the dragged item
            const activeCenterX = active.rect.current.translated.left;

            let isLeftDrop = null;

            // Check if it was dropped on the left or right of over
            if (activeCenterX <= overCenterX) {
                console.log('Dropped on the left side');
                isLeftDrop = true;
                // Perform left drop action
            } else {
                console.log('Dropped on the right side');
                isLeftDrop = false;
                // Perform right drop action
            }
            let updatedCategories;
            if (isLeftDrop) {
                // Left drop - same level as other subcategories of the target item's parent
                const siblings = cashflowCategoriesData.filter(cat => cat.parentID === targetItem.parentID);
                const newPosition = siblings.length > 0
                    ? siblings[siblings.length - 1].position + 1
                    : 1;

                updatedCategories = cashflowCategoriesData.map(item => {
                    if (item.id === active.id) {
                        return { ...item, position: newPosition, parentID: targetItem.parentID };
                    }
                    return item;
                });
            } else {
                // Right drop - becomes a subcategory of the target item if the target item has no parent or is already a main category
                const subcategories = cashflowCategoriesData.filter(cat => cat.parentID === over.id);
            
                // Determine the new position within the subcategory list
                const newPosition = subcategories.length > 0
                    ? subcategories[subcategories.length - 1].position + 1
                    : 1;
            
                // Create updated category list with active item as subcategory if `targetItem` is main or has no parent
                updatedCategories = cashflowCategoriesData.map(item => {
                    if (item.id === active.id) {
                        return {
                            ...item,
                            position: newPosition,
                            parentID: over.id,
                        };
                    }
                    return item;
                });
                
                console.log("Dropped as subcategory on the right side:", updatedCategories);
            }
            

            // Sort by position for UI update
            updatedCategories.sort((a, b) => a.position - b.position);
            setCashflowCategoriesData(updatedCategories);

            // Commit the updates to Firestore
            const batch = writeBatch(db);
            updatedCategories.forEach(category => {
                const categoryDocRef = doc(db, 'cashflow', cashflowId, 'categories', category.id);
                const updatedCategoryData = {
                    position: category.position,
                    parentID: category.parentID ?? null,  // Set parentID to null if undefined
                };
                batch.update(categoryDocRef, updatedCategoryData);
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

    const gridSize = 50; // pixels
    const snapToGridModifier = createSnapModifier(gridSize);
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
                <DndContext onDragEnd={handleDragEnd} modifiers={[snapToGridModifier]} collisionDetection={closestCorners}>
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
                                <SortableContext items={cashflowCategoriesData} strategy={verticalListSortingStrategy}>
                                    {cashflowCategoriesData.map((category) => (
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

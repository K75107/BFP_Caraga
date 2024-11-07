import React, { Fragment, useState, useEffect, useCallback,useRef } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { db } from "../../../../config/firebase-config";
import { collection, doc, onSnapshot, addDoc, writeBatch, updateDoc, deleteDoc } from "firebase/firestore";
import { DndContext, closestCorners, useDroppable, useDraggable, PointerSensor } from '@dnd-kit/core';
import Modal from '../../../../components/Modal';
import SuccessUnsuccessfulAlert from "../../../../components/Alerts/SuccessUnsuccessfulALert";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities"
import { arrayMove } from '@dnd-kit/sortable';
import { debounce } from 'lodash'; // Import debounce


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
    const [overIdLevel, setOverIdLevel] = useState();

    //For input
    const [editingCell, setEditingCell] = useState(null); // To track which cell is being edited
    const [editValue, setEditValue] = useState({ field: '', value: '' });

    // Fetch categories data only once initially to reduce continuous reads
    useEffect(() => {
        const cashflowsCollectionRef = collection(db, "cashflow", cashflowId, "categories");

        // Only read data once, then manually update state when needed
        const unsubscribe = onSnapshot(cashflowsCollectionRef, (querySnapshot) => {
            try {
                const data = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setCashflowCategoriesData(sortCategoriesRecursively(data));
            } catch (error) {
                console.error("Error fetching and sorting categories:", error);
                setIsError(true);
            }
        });

        return () => unsubscribe();
    }, [cashflowId]);


    const sortCategoriesRecursively = (categories, parentID = null, level = 0) => {
        const filteredCategories = categories
            .filter((category) => category.parentID === parentID)
            .sort((a, b) => a.position - b.position);

        return filteredCategories.flatMap((category) => [
            { ...category, level },
            ...sortCategoriesRecursively(categories, category.id, level + 1),
        ]);
    };



    const [expandedCategories, setExpandedCategories] = useState({});

    const toggleCategory = (categoryId) => {
        setExpandedCategories((prev) => {
            const newExpandedState = {
                ...prev,
                [categoryId]: !prev[categoryId],
            };

            return newExpandedState;
        });

    };

    const expandCategory = (categoryId) => {
        setExpandedCategories((prev) => {
            return {
                ...prev,
                [categoryId]: true, // Set the category to expanded
            };
        });
    };

    const collapseCategory = (categoryId) => {
        setExpandedCategories((prev) => {
            return {
                ...prev,
                [categoryId]: false, // Set the category to collapsed
            };
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
            await addDoc(categoriesCollectionRef, {
                categoryName: newCategory,
                parentID: null, // No parent for main category
                created_at: new Date(),
            });

            // No need to update `cashflowCategoriesData` manually here
            setShowModal(false); // Close modal after adding the category
        } catch (error) {
            console.error('Error adding new category:', error);
        }
    };


    // Function to add a new subcategory
    const addNewSubcategory = async () => {
        try {
            if (!selectedRowData) {
                console.error('No category selected to add subcategory.');
                return;
            }

            const cashflowDocRef = doc(db, 'cashflow', cashflowId);
            const categoriesCollectionRef = collection(cashflowDocRef, 'categories');
            await addDoc(categoriesCollectionRef, {
                categoryName: '',
                parentID: selectedRowData.id, // Assign the selected category's ID as the parent
                created_at: new Date(),
            });

            setShowModal(false); // Close modal after adding subcategory
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


    function getTotalAmountForCategory(categoryId, data) {
        // Start with the amount of the current category
        const currentCategory = data.find(cat => cat.id === categoryId);
        let totalAmount = currentCategory ? currentCategory.amount || 0 : 0;

        // Find all subcategories with the parentID matching the current category's id
        const subcategories = data.filter(subCat => subCat.parentID === categoryId);

        // Recursively add up the amount for each subcategory
        subcategories.forEach(subCat => {
            totalAmount += getTotalAmountForCategory(subCat.id, data);
        });

        return totalAmount;
    }

    function getLeafCategoryAmountTotal(categoryId, data) {
        // Find all subcategories with the parentID matching the given categoryId
        const subcategories = data.filter(subCat => subCat.parentID === categoryId);

        // Initialize the total amount
        let totalAmount = 0;

        subcategories.forEach(subCat => {
            // Check if the subcategory has any further subcategories
            const hasChildren = data.some(cat => cat.parentID === subCat.id);

            if (!hasChildren) {
                // If no children, add its amount to the total
                totalAmount += subCat.amount || 0;
            } else {
                // If it has children, recursively calculate the total for those children
                totalAmount += getLeafCategoryAmountTotal(subCat.id, data);
            }
        });

        return totalAmount;
    }

    const [inputWidth, setInputWidth] = useState('auto');
    const spanRef = useRef(null);
    
    useEffect(() => {
        if (spanRef.current) {
            const width = spanRef.current.offsetWidth;
            setInputWidth(`${width + 20}px`); // Add a little padding for comfort
        }
    }, [editValue.value]); // Re-run effect when editValue changes

    function SortableRow({ category, handleRightClick }) {
        const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id });
        const style = {
            transition,
            transform: CSS.Transform.toString(transform),
        };

        const hasSubcategories = category.level >= 0 && cashflowCategoriesData.some(subCat => subCat.parentID === category.id);

        const totalLeafAmount = getLeafCategoryAmountTotal(category.id, cashflowCategoriesData);



        return (
            <tr
                ref={setNodeRef}
                {...attributes}
                style={style}
                className="border-b"
                onContextMenu={(e) => handleRightClick(e, category)}
            >
                <td
                    className="px-2 w-full py-3 bg-white dark:bg-gray-800 flex items-center "
                    style={{ paddingLeft: `${45 * category.level}px` }}
                >
                    {/* Drag Icon */}
                    <span {...listeners} className="cursor-grab mr-2 text-gray-500">
                        ☰
                    </span>

                    {/* Category Name */}
                    <span>
                        {editingCell === category.id && editValue.field === 'categoryName' ? (
                            <>
                                {/* Hidden span to measure the text width */}
                                <span
                                    ref={spanRef}
                                    className="invisible absolute"
                                    style={{ whiteSpace: 'pre' }}
                                >
                                    {editValue.value}
                                </span>
                                <input
                                    type="text"
                                    className="border w-auto text-[14px] focus:outline-none px-2 py-1"
                                    value={editValue.value}
                                    style={{ width: inputWidth }}
                                    onChange={(e) => setEditValue({ field: 'categoryName', value: e.target.value })}
                                    onBlur={() => handleCellChange(category.id, 'categoryName', editValue.value)}
                                    autoFocus
                                />
                            </>
                        ) : (
                            <span
                                onClick={() => {
                                    setEditingCell(category.id);
                                    setEditValue({ field: 'categoryName', value: category.categoryName || '' });
                                }}
                                className="block hover:bg-gray-100 px-1 py-1 "
                            >
                                {category.categoryName || '-'}
                            </span>
                        )}
                    </span>

                    {/* Toggle Button at the end */}
                    {(category.level >= 0 && cashflowCategoriesData.some(subCat => subCat.parentID === category.id)) && (
                        <button
                            onClick={() => toggleCategory(category.id)}
                            className="mr-2 text-blue-500 px-5"
                        >
                            {expandedCategories[category.id] ? "▾" : "▸"}
                        </button>
                    )}

                </td>

                <td className="px-2 py-2 w-56 h-6">
                    {hasSubcategories ? (
                        <span className="font-bold">{formatNumber(totalLeafAmount) || '-'}</span>
                    ) : (
                        editingCell === category.id && editValue.field === 'amount' ? (
                            <input
                                type="number"
                                className="border focus:outline-none w-56 h-8 px-2 py-1 text-start"
                                value={editValue.value}
                                onChange={(e) => setEditValue({ field: 'amount', value: e.target.value })}
                                onBlur={() => handleCellChange(category.id, 'amount', editValue.value)}
                                autoFocus
                            />
                        ) : (
                            <span
                                onClick={() => {
                                    setEditingCell(category.id);
                                    setEditValue({ field: 'amount', value: category.amount || '' });
                                }}
                                className="block hover:bg-gray-100 w-full h-8 px-2 py-1 text-end"
                            >
                                {formatNumber(category.amount) || '-'}
                            </span>
                        )
                    )}
                </td>
                <td className="px-2 py-3 text-center">{/* Any actions */}</td>
            </tr>
        );
    }


    // Memoize handleDragEnd to prevent it from changing on each render
    const handleDragEnd = useCallback(
        async (event) => {
            const { active, over, delta } = event;

            const activeIndex = cashflowCategoriesData.findIndex(item => item.id === active.id);
            const activeItem = cashflowCategoriesData[activeIndex];

            let overIndex = cashflowCategoriesData.findIndex(item => item.id === over.id);
            let overItem = cashflowCategoriesData[overIndex];

            if (!over || active.id === over.id) {
                // Moving to the right
                if (delta.x > 0 && activeIndex > 0) {
                    const aboveItem = cashflowCategoriesData[activeIndex - 1];
                    const newParentID = aboveItem.id;
                    const newLevel = activeItem.level + 1;

                    // Find the last subcategory in the parent's subcategory chain
                    let targetIndex = activeIndex;
                    for (let i = activeIndex - 1; i < cashflowCategoriesData.length; i++) {
                        if (cashflowCategoriesData[i].parentID === newParentID) {
                            targetIndex = i + 1;
                        } else if (cashflowCategoriesData[i].level <= aboveItem.level) {
                            break;
                        }
                    }

                    const updatedCategories = cashflowCategoriesData.map((item) =>
                        item.id === active.id
                            ? { ...item, parentID: newParentID, level: newLevel }
                            : item
                    );

                    const finalCategories = arrayMove(updatedCategories, activeIndex, targetIndex);

                    setCashflowCategoriesData(finalCategories);

                    const categoryDocRef = doc(db, 'cashflow', cashflowId, 'categories', active.id);
                    await updateDoc(categoryDocRef, {
                        parentID: newParentID,
                        level: newLevel,
                    });

                    return;
                }

                // Moving to the left
                if (delta.x < 0 && activeItem.level > 0) {
                    const gridSize = 45;
                    const gridMovementLeft = Math.abs(Math.round(delta.x / gridSize));
                    let newLevel = activeItem.level - gridMovementLeft;

                    // Find the ancestor's parentID and the end of its subcategory chain
                    let newParentID = null;
                    let currentAncestor = activeItem;
                    for (let i = 0; i < gridMovementLeft; i++) {
                        const parentIndex = cashflowCategoriesData.findIndex(
                            item => item.id === currentAncestor.parentID
                        );
                        if (parentIndex === -1) break; // No more ancestors
                        currentAncestor = cashflowCategoriesData[parentIndex];
                    }
                    newParentID = currentAncestor.parentID;

                    // Find the last subcategory under the new ancestor
                    let targetIndex = activeIndex;
                    for (let i = activeIndex - 1; i < cashflowCategoriesData.length; i++) {
                        if (cashflowCategoriesData[i].parentID === newParentID) {
                            targetIndex = i + 1;
                        } else if (cashflowCategoriesData[i].level <= newLevel) {
                            break;
                        }
                    }

                    const updatedCategories = cashflowCategoriesData.map((item) =>
                        item.id === active.id
                            ? { ...item, parentID: newParentID, level: newLevel }
                            : item
                    );

                    const finalCategories = arrayMove(updatedCategories, activeIndex, targetIndex);

                    setCashflowCategoriesData(finalCategories);

                    const categoryDocRef = doc(db, 'cashflow', cashflowId, 'categories', active.id);
                    await updateDoc(categoryDocRef, {
                        parentID: newParentID,
                        level: newLevel,
                    });

                    return;
                }

                return;
            }



            // Always use the upper row as the target
            if ((activeIndex > overIndex) && (overItem.level != activeItem.level || delta.x > 0)) {
                // If moving up, set `overItem` to the item above `over`, if it exists
                overIndex = overIndex > 0 ? overIndex - 1 : overIndex; // Use the item above if available
            }


            // Determine new row position
            let newRowPosition;
            if (overIndex === 0 && delta.y < 0) {
                // If dragged to the top with no over data, make it the first row
                newRowPosition = 1;
            } else if (overIndex < visibleCategories.length - 1) {
                const nextItem = visibleCategories[overIndex + 1];
                newRowPosition = (overItem.position + nextItem.position) / 2; // Midpoint between overItem and nextItem

            } else {
                newRowPosition = overItem.position + 1; // Place it after the last item
            }

            // Calculate new level based on grid movement
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

            // Expand or collapse category if the item is a category
            const category = cashflowCategoriesData.find(cat => cat.id === activeItem.id);
            if (category) {
                expandCategory(category.id);
                // console.log(`Category ${category.id} toggled.`);
            } else {
                console.log("Category not found on drag start");
            }


        },
        [cashflowCategoriesData, cashflowId]
    );



    const [newMaxLevel, setNewMaxLevel] = useState();

    const gridSize = 45;

    function snapToGrid(args) {
        const { transform } = args;

        let newX = Math.ceil(transform.x / gridSize) * gridSize;

        // Calculate maximum left and right positions based on the level
        const maxLeft = -overIdLevel * gridSize;
        const maxRight = ((newMaxLevel - overIdLevel) + 1) * gridSize;

        // Apply the calculated boundaries
        newX = Math.max(maxLeft, newX);   // Allow moving up to `overIdLevel` grids to the left
        newX = Math.min(newX, maxRight);  // Restrict right movement to `newMaxLevel - overIdLevel`

        return {
            ...transform,
            x: newX,
            y: Math.ceil(transform.y / gridSize) * gridSize,
        };
    }




    const handleDragStart = useCallback(async (event) => {
        const { id: activeId } = event.active;  // Get the active item's ID

        // Find the item in cashflowCategoriesData using the active ID
        const activeIndex = cashflowCategoriesData.findIndex(item => item.id === activeId);
        const activeItem = cashflowCategoriesData[activeIndex];

        // Check if the item exists and set level if found
        if (activeItem) {
            setOverIdLevel(activeItem.level);
        } else {
            console.warn("Item not found for level setting on drag start");
            return;  // Exit if item is not found
        }


        //Set the maxlevel
        const maxLevel = Math.max(...Object.values(cashflowCategoriesData).map(item => item.level));
        setNewMaxLevel(maxLevel);

        // Expand or collapse category if the item is a category
        const category = cashflowCategoriesData.find(cat => cat.id === activeId);
        if (category) {
            collapseCategory(category.id);
            // console.log(`Category ${category.id} toggled.`);
        } else {
            console.log("Category not found on drag start");
        }
    }, [cashflowCategoriesData, toggleCategory]);


    //For the input
    // Function to format numbers with commas and handle empty/null cases
    const formatNumber = (num) => {
        if (num === null || num === undefined || isNaN(num) || num === '') {
            return '-'; // Return '-' if no value
        }
        return parseFloat(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleCellChange = async (categoryId, field, newValue) => {
        try {
            // Ensure newValue is treated as a number, if applicable
            const numericValue = field === "amount" ? parseFloat(newValue) : newValue;

            // Find the target category by ID
            const targetCategory = cashflowCategoriesData.find(cat => cat.id === categoryId);

            if (targetCategory) {

                // Only update if there is a change in value
                if (targetCategory[field] === numericValue) {
                    console.log('No changes detected, skipping update.');
                    return; // Exit early if no changes are made
                }


                // Optimistically update local state immediately
                setCashflowCategoriesData(prevData =>
                    prevData.map(category =>
                        category.id === categoryId ? { ...category, [field]: numericValue } : category
                    )
                );

                // Debounced Firebase update to avoid frequent writes
                debouncedUpdate(categoryId, field, numericValue);


                // Clear editing state after optimistic update
                setEditingCell(null);
                setEditValue({ field: '', value: '' });

            } else {
                console.log("Category not found");
            }
        } catch (error) {
            console.error("Error updating category:", error);
        }
    };

    // Debounced function for Firebase update
    const debouncedUpdate = debounce(async (categoryId, field, newValue) => {
        try {
            // Get the reference to the specific category document in Firestore
            const categoryDocRef = doc(db, 'cashflow', cashflowId, 'categories', categoryId);

            // Update the specific field of the category in Firestore
            await updateDoc(categoryDocRef, { [field]: newValue });
            console.log('Category field updated in Firestore successfully.');

        } catch (error) {
            console.error('Error updating category field in Firestore:', error);
        }
    }, 1000); // Debounce delay set to 1 second


    const handleDeleteRow = async () => {
        if (!selectedRowData) return;
        try {
            const categoryDocRef = doc(db, 'cashflow', cashflowId, 'categories', selectedRowData.id);

            // Delete the account from Firestore
            await deleteDoc(categoryDocRef);
            setShowRightClickModal(false);


        } catch (error) {
            console.log("Error deleting document:", error);
        }




    }

    

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
                                    <th scope="col" className="px-2 py-3 w-[600px]">Account Description</th>
                                    <th scope="col" className="px-2 py-3 w-[80px] text-center">Period</th>
                                    <th scope="col" className="px-2 py-3 w-[80px] text-center"></th>
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
                        <button onClick={(event) => {
                            event.stopPropagation();
                            addNewCategory();
                        }}
                            className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-3 text-[11px] font-medium ml-2">
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
                            onClick={handleDeleteRow}
                        >
                            Delete Row
                        </button>
                    </div>
                </div>
            )}

        </Fragment>
    );
}

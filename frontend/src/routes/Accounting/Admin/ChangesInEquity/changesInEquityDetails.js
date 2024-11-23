import React, { Fragment, useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../../../config/firebase-config";
import { collection, doc, onSnapshot, addDoc, writeBatch, updateDoc, deleteDoc, getDocs, getDoc, query, where } from "firebase/firestore";
import { DndContext, closestCorners, useDroppable, useDraggable, PointerSensor } from '@dnd-kit/core';
import Modal from '../../../../components/Modal';
import SuccessUnsuccessfulAlert from "../../../../components/Alerts/SuccessUnsuccessfulALert";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities"
import { arrayMove } from '@dnd-kit/sortable';
import { debounce } from 'lodash'; // Import debounce
import ExportButton from "../../../../components/exportButton";
import AddButton from "../../../../components/addButton";


export default function ChangesInEquityDetails() {
    const [showModal, setShowModal] = useState(false);
    const [showModalPeriod, setShowModalPeriod] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const { cEquityId } = useParams();
    const [cEquityCategoriesData, setcEquityCategoriesData] = useState([]);
    const [selectedRowData, setSelectedRowData] = useState(null);
    const [showRightClickModal, setShowRightClickModal] = useState(false);
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
    const [overIdLevel, setOverIdLevel] = useState();

    //For input
    const [editingCell, setEditingCell] = useState(null); // To track which cell is being edited
    const [editValue, setEditValue] = useState({ field: '', value: '' });

    //For Period
    const [cEquityList, setcEquityList] = useState([]);
    const [selectedPeriodId, setSelectedPeriodId] = useState();
    const [periodData, setPeriodData] = useState([]);
    const [periodId, setPeriodId] = useState(null);

    const [totalSurplusDeficit, setTotalSurplusDeficit] = useState(null);

    const [periodTotal, setPeriodTotal] = useState(0);

    const [cEquityPeriod, setcEquityPeriod] = useState('');

    //Merge Data
    const [cEquityMergeData, setcEquityMergeData] = useState([]);

    //Current Year
    const [currentcEquity, setCurrentcEquity] = useState();

    //Selected Year
    const [selectedYear, setSelectedYear] = useState();


    // Function to recursively calculate the total for a main category and its subcategories
    const calculateCategoryTotal = (categoryId) => {
        // Find direct subcategories of this category
        const subcategories = cEquityCategoriesData.filter(
            subcategory => subcategory.parentID === categoryId
        );

        // If no subcategories, return this category's amount
        if (subcategories.length === 0) {
            const mainCategory = cEquityCategoriesData.find(category => category.id === categoryId);
            return mainCategory ? mainCategory.amount || 0 : 0;
        }

        // If subcategories exist, sum up their amounts recursively
        return subcategories.reduce((acc, subcategory) => {
            return acc + calculateCategoryTotal(subcategory.id);
        }, 0);
    };

    //Current Year
    useEffect(() => {
        const fetchYear = async () => {
            try {
                const selectedCashflowRef = doc(db, "ChangesInEquity", cEquityId);
                const cEquityDoc = await getDoc(selectedCashflowRef);

                if (cEquityDoc.exists()) {
                    const data = cEquityDoc.data();
                    setCurrentcEquity(data);

                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.log("Error fetching year:", error);
            }
        };

        if (cEquityId) {
            fetchYear();
        }

    }, [cEquityId]);

    //Selected Year
    useEffect(() => {
        const fetchYear = async () => {
            try {
                const selectedCashflowRef = doc(db, "ChangesInEquity", periodId);
                const cEquityDoc = await getDoc(selectedCashflowRef);

                if (cEquityDoc.exists()) {

                    const year = cEquityDoc.data().year;
                    setSelectedYear(year);

                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.log("Error fetching year:", error);
            }
        };

        if (periodId) {
            fetchYear();
        }

    }, [periodId]);


    // Calculate total for all main categories
    useEffect(() => {
        const calculateMainCategoryTotal = () => {
            const mainCategoryTotal = cEquityCategoriesData
                .filter(category => !category.parentID)  // Only main categories
                .reduce((acc, mainCategory) => {
                    // Add either the main category's amount or its calculated total with subcategories
                    return acc + calculateCategoryTotal(mainCategory.id);
                }, 0);

            // Add surplus/deficit to the main category total
            const total = mainCategoryTotal + (totalSurplusDeficit || 0);
            setPeriodTotal(total);
        };

        calculateMainCategoryTotal();
    }, [cEquityCategoriesData, totalSurplusDeficit]);

    useEffect(() => {
        const fetchChangesInEquity = async () => {
            try {
                const cEquityDocRef = doc(db, 'ChangesInEquity', cEquityId);
                const cEquityDoc = await getDoc(cEquityDocRef);

                if (cEquityDoc.exists()) {
                    const data = cEquityDoc.data();

                    // Reference to the incomestatement document using the incomestatementID from cEquityDoc data
                    const incomestatementDocRef = doc(db, "incomestatement", data.incomestatementID);

                    // Fetch totalSurplusDeficit from incomestatement
                    const unsubscribe = onSnapshot(incomestatementDocRef, (docSnapshot) => {
                        if (docSnapshot.exists()) {
                            const incomeData = docSnapshot.data();
                            setTotalSurplusDeficit(incomeData.totalSurplusDeficit); // Ensure totalSurplusDeficit exists in document
                            setcEquityPeriod(data.year);

                        } else {
                            console.warn("No such incomestatement document!");
                        }
                    });

                    return () => unsubscribe(); // Cleanup the listener on unmount
                } else {
                    console.error("ChangesInEquity document does not exist.");
                }
            } catch (error) {
                console.error("Error fetching ChangesInEquity or incomestatement data:", error);
            }
        };

        fetchChangesInEquity();
    }, [cEquityId]);


    // Fetch categories data only once initially to reduce continuous reads
    useEffect(() => {

        // For Changes in Equity data
        const cEquityCollectionsDAtaRef = collection(db, "ChangesInEquity", cEquityId, "categories");
        const unsubscribe = onSnapshot(cEquityCollectionsDAtaRef, async (querySnapshot) => {
            try {
                const data = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setcEquityCategoriesData(sortCategoriesRecursively(data));

            } catch (error) {
                console.error("Error fetching and sorting categories:", error);
                setIsError(true);
            }
        });

        // For list of Changes In Equity
        const cEquityListRef = collection(db, "ChangesInEquity");
        const unsubscribecEquityList = onSnapshot(cEquityListRef, (querySnapshot) => {
            try {
                const data = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setcEquityList(data);

            } catch (error) {
                console.log("Error fetching period list", error);
            }
        });

        // For SelectedPeriodData
        const cEquityRef = doc(db, "ChangesInEquity", cEquityId)
        const unsubscribecEquity = onSnapshot(cEquityRef, async (docSnapshot) => {

            try {
                if (docSnapshot.exists()) {
                    const data = { id: docSnapshot.id, ...docSnapshot.data() };
                    setPeriodId(data.selectedPeriod);

                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.log("Error fetching period data", error);
            }

        })

        return () => {
            unsubscribecEquity();
            unsubscribecEquityList();
            unsubscribe();
        };
    }, [cEquityId]);


    useEffect(() => {
        if (periodId) {
            // For SelectedPeriodData
            // For Changes In Equity data
            const cEquityCollectionsDAtaRef = collection(db, "ChangesInEquity", periodId, "categories");
            const unsubscribe = onSnapshot(cEquityCollectionsDAtaRef, async (querySnapshot) => {
                try {
                    const data = querySnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setPeriodData(sortCategoriesRecursively(data));

                } catch (error) {
                    console.error("Error fetching and sorting categories:", error);
                    setIsError(true);
                }
            })
            return () => unsubscribe();
        }
    }, [periodId])

    useEffect(() => {
        if (Array.isArray(cEquityCategoriesData) && cEquityCategoriesData.length > 0) {
            try {
                const mergedMap = new Map();
                const idMapping = new Map(); // Tracks id mappings between periodData and cEquityCategoriesData

                // Add current categories to the map
                cEquityCategoriesData.forEach((item) => {
                    mergedMap.set(item.id, {
                        ...item,
                        periodAmount: 0, // Initialize periodAmount
                    });
                });

                // Merge period data
                if (Array.isArray(periodData) && periodData.length > 0) {
                    periodData.forEach((item) => {
                        const resolvedParentID =
                            item.parentID === "null" ? null : idMapping.get(item.parentID) || item.parentID;

                        // Detect conflicts by categoryName and resolvedParentID
                        const existingItem = Array.from(mergedMap.values()).find(
                            (existing) =>
                                existing.categoryName === item.categoryName &&
                                existing.parentID === resolvedParentID
                        );

                        if (existingItem) {
                            // Map periodData id to the existing item's id
                            idMapping.set(item.id, existingItem.id);

                            // Update existing item's periodAmount
                            mergedMap.set(existingItem.id, {
                                ...existingItem,
                                periodAmount: existingItem.periodAmount + item.amount,
                            });
                        } else {
                            // Calculate position for the new item
                            const siblingPositions = Array.from(mergedMap.values())
                                .filter((cat) => cat.parentID === resolvedParentID)
                                .map((cat) => cat.position);

                            const newPosition =
                                siblingPositions.length > 0
                                    ? Math.max(...siblingPositions) + 1
                                    : 1; // Default position if no siblings exist

                            // Add new item to the map
                            const newItem = {
                                ...item,
                                id: item.id, // Retain the id from periodData
                                parentID: resolvedParentID, // Use resolved parentID
                                amount: 0, // No current amount
                                periodAmount: item.amount, // Assign period amount
                                position: newPosition, // Set calculated position
                                isFromPeriod: true, // Mark as period data
                            };
                            mergedMap.set(item.id, newItem);

                            // Track id mapping for new item
                            idMapping.set(item.id, item.id);
                        }
                    });
                }

                // Convert map to array
                const mergedData = Array.from(mergedMap.values());

                // Sort and recursively build hierarchy
                setcEquityMergeData(sortCategoriesRecursively(mergedData));
            } catch (error) {
                console.error("Error during merge:", error);
            }
        }
    }, [cEquityCategoriesData, periodData]);


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
        return cEquityMergeData.filter((category) => {
            // Check if the category is a main category or if it is expanded
            if (category.parentID === null) return true;

            // If the category has a parent, check if the parent is expanded
            let currentCategory = category;
            while (currentCategory.parentID) {
                if (!expandedCategories[currentCategory.parentID]) {
                    return false; // Parent is not expanded
                }
                currentCategory = cEquityMergeData.find(cat => cat.id === currentCategory.parentID);
            }
            return true; // This category and its parents are expanded
        });
    };

    // Use getVisibleCategories in your rendering logic
    const visibleCategories = getVisibleCategories();

    const addNewCategory = async () => {
        try {
            const cEquityDocRef = doc(db, 'ChangesInEquity', cEquityId);
            const categoriesCollectionRef = collection(cEquityDocRef, 'categories');

            const sortedAccounts = [...cEquityCategoriesData].filter(cat => cat.parentID === null);
            const newRowPosition = sortedAccounts.length > 0
                ? sortedAccounts[sortedAccounts.length - 1].position + 10
                : 1;

            // Add the main category and get its reference
            const mainCategoryDocRef = await addDoc(categoriesCollectionRef, {
                categoryName: newCategory,
                parentID: null, // No parent for main category
                created_at: new Date(),
                position: newRowPosition
            });

            setShowModal(false); // Close modal after adding the category
        } catch (error) {
            console.error('Error adding new category:', error);
        }
    };


    //Add Category with formula


    // Function to add a new subcategory
    const addNewRow = async () => {
        try {
            if (!selectedRowData) {
                console.error('No category selected to add subcategory.');
                return;
            }
            const siblings = cEquityCategoriesData.filter(cat => cat.parentID === selectedRowData.parentID);
            const newRowPosition = siblings.length > 0
                ? siblings[siblings.length - 1].position + 1
                : 1;

            const cEquityDocRef = doc(db, 'ChangesInEquity', cEquityId);
            const categoriesCollectionRef = collection(cEquityDocRef, 'categories');

            await addDoc(categoriesCollectionRef, {
                categoryName: '',
                parentID: selectedRowData.parentID, // Assign the selected category's IDs parent id sa the parent ID
                created_at: new Date(),
                position: newRowPosition
            });

            setShowModal(false); // Close modal after adding subcategory
        } catch (error) {
            console.error('Error adding new subcategory:', error);
            setIsError(true);
        }
    };


    // Function to add a new subcategory
    const addNewSubcategory = async () => {
        try {
            if (!selectedRowData) {
                console.error('No category selected to add subcategory.');
                return;
            }
            const siblings = cEquityCategoriesData.filter(cat => cat.parentID === selectedRowData.id);
            const newRowPosition = siblings.length > 0
                ? siblings[siblings.length - 1].position + 1
                : 1;

            const cEquityDocRef = doc(db, 'ChangesInEquity', cEquityId);
            const categoriesCollectionRef = collection(cEquityDocRef, 'categories');
            await addDoc(categoriesCollectionRef, {
                categoryName: '',
                parentID: selectedRowData.id, // Assign the selected category's ID as the parent
                created_at: new Date(),
                position: newRowPosition
            });

            setShowModal(false); // Close modal after adding subcategory
        } catch (error) {
            console.error('Error adding new subcategory:', error);
            setIsError(true);
        }
    };


    // Function to add a new parent category and position it next to the original category
    const addNewParentCategory = async () => {
        try {
            if (!selectedRowData) {
                console.error('No category selected to add parent category.');
                return;
            }

            const cEquityDocRef = doc(db, 'ChangesInEquity', cEquityId);
            const categoriesCollectionRef = collection(cEquityDocRef, 'categories');


            const newParentDocRef = await addDoc(categoriesCollectionRef, {
                categoryName: '',
                parentID: null,
                created_at: new Date(),
                position: selectedRowData.position
            });


            await updateDoc(doc(categoriesCollectionRef, selectedRowData.id), {
                parentID: newParentDocRef.id,
                position: 1
            });


            const categoriesToUpdate = cEquityCategoriesData.filter(cat => cat.position >= selectedRowData.position && cat.id !== selectedRowData.id);
            for (const cat of categoriesToUpdate) {
                await updateDoc(doc(categoriesCollectionRef, cat.id), {
                    position: cat.position + 1
                });
            }

            setShowModal(false); // Close modal after adding the parent category
        } catch (error) {
            console.error('Error adding new parent category:', error);
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




    function getLeafCategoryAmountTotal(categoryId, data) {
        // Find all subcategories with the parentID matching the given categoryId
        const subcategories = data.filter(subCat => subCat.parentID === categoryId);

        // Initialize the total amounts
        let totalAmount = 0;
        let totalPeriodAmount = 0;

        subcategories.forEach(subCat => {
            // Check if the subcategory has any further subcategories
            const hasChildren = data.some(cat => cat.parentID === subCat.id);

            if (!hasChildren) {
                // If no children, add its amounts to the totals
                totalAmount += subCat.amount || 0;
                totalPeriodAmount += subCat.periodAmount || 0;
            } else {
                // If it has children, recursively calculate the totals for those children
                const childTotals = getLeafCategoryAmountTotal(subCat.id, data);
                totalAmount += childTotals.totalAmount;
                totalPeriodAmount += childTotals.totalPeriodAmount;
            }
        });

        return { totalAmount, totalPeriodAmount };
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

        const hasSubcategories = category.level >= 0 && cEquityMergeData.some(subCat => subCat.parentID === category.id);

        const { totalAmount, totalPeriodAmount } = getLeafCategoryAmountTotal(category.id, cEquityMergeData);




        return (
            <tr
                ref={setNodeRef}
                {...attributes}
                style={style}
                className={`border-b px-6 ${category.isFromPeriod ? 'bg-red-100' : 'bg-white'}`}
                onContextMenu={(e) => handleRightClick(e, category)}
            >
                <td
                    className="px-2 w-full py-3 flex items-center "
                    style={{ paddingLeft: `${45 * category.level}px` }}
                >
                    <span
                        className={!category.isFromPeriod ? 'cursor-grab mr-2 text-gray-500 pl-4' : 'invisible '}
                        {...(!category.isFromPeriod ? listeners : {})}
                    >
                        ☰
                    </span>


                    {/* Category Name */}
                    <span>
                        {category.isFromPeriod ? (
                            <span className="block px-1 py-1 px-6">
                                {category.categoryName || '-'}
                            </span>
                        ) : editingCell === category.id && editValue.field === 'categoryName' ? (
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
                                className="block px-1 py-1 hover:bg-gray-100"
                            >
                                {category.categoryName || '-'}
                            </span>
                        )}
                    </span>


                    {/* Toggle Button at the end */}
                    {(category.level >= 0 && cEquityMergeData.some(subCat => subCat.parentID === category.id)) && (
                        <button
                            onClick={() => toggleCategory(category.id)}
                            className="mr-2 text-blue-500 px-5"
                        >
                            {expandedCategories[category.id] ? "▾" : "▸"}
                        </button>
                    )}

                </td>

                <td className="px-2 py-2 w-56 h-6 ">
                    {hasSubcategories ? (
                        <span className="font-bold">{formatNumber(totalAmount) || '-'}</span>
                    ) : (
                        editingCell === category.id && editValue.field === 'amount' ? (
                            <input
                                type="number"
                                className="border focus:outline-none w-11/12 h-8 px-2 py-1 text-start"
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
                                className="block hover:bg-gray-100 w-full h-8 px-2 py-1"
                            >
                                {formatNumber(category.amount) || '-'}
                            </span>
                        )
                    )}
                </td>
                <td className="px-2 py-2 w-56 h-6 ">
                    {hasSubcategories ? (
                        <span className="font-bold">{formatNumber(totalPeriodAmount) || '-'}</span>
                    ) : (
                        (
                            <span
                                className="block hover:bg-gray-100 w-full h-8 px-2 py-1"
                            >
                                {formatNumber(category.periodAmount) || '-'}
                            </span>
                        )
                    )}
                </td>
            </tr>
        );
    }


    // Memoize handleDragEnd to prevent it from changing on each render
    const handleDragEnd = useCallback(
        async (event) => {
            const { active, over, delta } = event;

            const activeIndex = cEquityCategoriesData.findIndex(item => item.id === active.id);
            const activeItem = cEquityCategoriesData[activeIndex];

            let overIndex = cEquityCategoriesData.findIndex(item => item.id === over.id);
            let overItem = cEquityCategoriesData[overIndex];

            if (!over || active.id === over.id) {
                // Moving to the right
                if (delta.x > 0 && activeIndex > 0) {
                    const aboveItem = cEquityCategoriesData[activeIndex - 1];
                    const newParentID = aboveItem.id;
                    const newLevel = activeItem.level + 1;

                    // Find the last subcategory in the parent's subcategory chain
                    let targetIndex = activeIndex;
                    for (let i = activeIndex - 1; i < cEquityCategoriesData.length; i++) {
                        if (cEquityCategoriesData[i].parentID === newParentID) {
                            targetIndex = i + 1;
                        } else if (cEquityCategoriesData[i].level <= aboveItem.level) {
                            break;
                        }
                    }

                    const updatedCategories = cEquityCategoriesData.map((item) =>
                        item.id === active.id
                            ? { ...item, parentID: newParentID, level: newLevel }
                            : item
                    );

                    const finalCategories = arrayMove(updatedCategories, activeIndex, targetIndex);

                    setcEquityCategoriesData(finalCategories);

                    const categoryDocRef = doc(db, 'ChangesInEquity', cEquityId, 'categories', active.id);
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
                        const parentIndex = cEquityCategoriesData.findIndex(
                            item => item.id === currentAncestor.parentID
                        );
                        if (parentIndex === -1) break; // No more ancestors
                        currentAncestor = cEquityCategoriesData[parentIndex];
                    }
                    newParentID = currentAncestor.parentID;

                    // Find the last subcategory under the new ancestor
                    let targetIndex = activeIndex;
                    for (let i = activeIndex - 1; i < cEquityCategoriesData.length; i++) {
                        if (cEquityCategoriesData[i].parentID === newParentID) {
                            targetIndex = i + 1;
                        } else if (cEquityCategoriesData[i].level <= newLevel) {
                            break;
                        }
                    }

                    const updatedCategories = cEquityCategoriesData.map((item) =>
                        item.id === active.id
                            ? { ...item, parentID: newParentID, level: newLevel }
                            : item
                    );

                    const finalCategories = arrayMove(updatedCategories, activeIndex, targetIndex);

                    setcEquityCategoriesData(finalCategories);

                    const categoryDocRef = doc(db, 'ChangesInEquity', cEquityId, 'categories', active.id);
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
                    if (cEquityCategoriesData[i].level === newLevel - 1) {
                        newParentID = cEquityCategoriesData[i].id;
                        break;
                    }
                }
            }

            const updatedCategories = cEquityCategoriesData.map((item) =>
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

            setcEquityCategoriesData(resetCategories);

            const batch = writeBatch(db);
            resetCategories.forEach((category) => {
                const categoryDocRef = doc(db, 'ChangesInEquity', cEquityId, 'categories', category.id);
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
            const category = cEquityCategoriesData.find(cat => cat.id === activeItem.id);
            if (category) {
                expandCategory(category.id);
                // console.log(`Category ${category.id} toggled.`);
            } else {
                console.log("Category not found on drag start");
            }


        },
        [cEquityCategoriesData, cEquityId]
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

        // Find the item in cEquityCategoriesData using the active ID
        const activeIndex = cEquityCategoriesData.findIndex(item => item.id === activeId);
        const activeItem = cEquityCategoriesData[activeIndex];

        // Check if the item exists and set level if found
        if (activeItem) {
            setOverIdLevel(activeItem.level);
        } else {
            console.warn("Item not found for level setting on drag start");
            return;  // Exit if item is not found
        }


        //Set the maxlevel
        const maxLevel = Math.max(...Object.values(cEquityCategoriesData).map(item => item.level));
        setNewMaxLevel(maxLevel);

        // Expand or collapse category if the item is a category
        const category = cEquityCategoriesData.find(cat => cat.id === activeId);
        if (category) {
            collapseCategory(category.id);
            // console.log(`Category ${category.id} toggled.`);
        } else {
            console.log("Category not found on drag start");
        }
    }, [cEquityCategoriesData, toggleCategory]);


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
            const targetCategory = cEquityCategoriesData.find(cat => cat.id === categoryId);

            if (targetCategory) {

                // Only update if there is a change in value
                if (targetCategory[field] === numericValue) {
                    console.log('No changes detected, skipping update.');
                    return; // Exit early if no changes are made
                }


                // Optimistically update local state immediately
                setcEquityCategoriesData(prevData =>
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
            const categoryDocRef = doc(db, 'ChangesInEquity', cEquityId, 'categories', categoryId);

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
            const cEquityDocRef = doc(db, 'ChangesInEquity', cEquityId);
            const categoriesCollectionRef = collection(cEquityDocRef, 'categories');

            const getAllSubcategories = async (parentId) => {
                const subcategories = [];
                const subcategoriesQuery = query(categoriesCollectionRef, where('parentID', '==', parentId));
                const subcategoriesSnapshot = await getDocs(subcategoriesQuery);

                for (const subcategoryDoc of subcategoriesSnapshot.docs) {
                    subcategories.push(subcategoryDoc);
                    const nestedSubcategories = await getAllSubcategories(subcategoryDoc.id);
                    subcategories.push(...nestedSubcategories);
                }

                return subcategories;
            };

            const subcategoriesToDelete = await getAllSubcategories(selectedRowData.id);

            const batch = writeBatch(db);

            const categoryDocRef = doc(categoriesCollectionRef, selectedRowData.id);
            batch.delete(categoryDocRef);

            subcategoriesToDelete.forEach((subcategoryDoc) => {
                batch.delete(subcategoryDoc.ref);
            });

            await batch.commit();

            setShowRightClickModal(false);
        } catch (error) {
            console.log("Error deleting document:", error);
        }
    };

    //For Period
    const handleAddPeriod = async () => {
        try {
            const cEquityListRef = doc(db, "ChangesInEquity", cEquityId);

            await updateDoc(cEquityListRef, {
                selectedPeriod: selectedPeriodId
            });

            setSelectedPeriodId('');
            setShowModalPeriod(false);


        } catch (error) {
            console.log("Error updating period:", error);
        }

    }

    return (
        <Fragment>

            {isSuccess && (
                <div className="absolute top-4 right-4">
                    <SuccessUnsuccessfulAlert isSuccess={isSuccess} message={'New Changes In Equity Created'} icon={'check'} />
                </div>
            )}
            {isError && (
                <div className="absolute top-4 right-4">
                    <SuccessUnsuccessfulAlert isError={isError} message={'Error occurred'} icon={'wrong'} />
                </div>
            )}

            <div className="px-6">
                <div className="bg-white h-30 py-6 px-8 rounded-lg">
                    <div className="flex justify-between w-full">
                        <h1 className="text-[25px] font-semibold text-[#1E1E1E] font-poppins">{currentcEquity?.description || ""}</h1>

                        <div class="flex space-x-4">


                            <AddButton
                                onClick={() => setShowModal(true)}
                                label={"ADD CATEGORY"}
                            />

                            <AddButton
                                onClick={() => setShowModalPeriod(true)}
                                label={"ADD PERIOD"}
                            />

                            <ExportButton
                                label="EXPORT"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-8">
                <DndContext onDragEnd={handleDragEnd} modifiers={[snapToGrid]} collisionDetection={closestCorners} onDragStart={handleDragStart}>
                    <div className="relative overflow-y-auto sm:rounded-lg bg-white">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs uppercase bg-gradient-to-r from-cyan-500 to-blue-700 text-white sticky top-0 z-10">
                                <tr>
                                    <th scope="col" className="px-2 py-4 w-[600px]">Account Description</th>
                                    <th scope="col" className="px-2 py-4 w-[80px] text-start">{currentcEquity?.year || ""}</th>
                                    <th scope="col" className="px-2 py-4 w-[80px] text-start">{selectedYear || ''}</th>

                                </tr>
                            </thead>
                            <tbody>
                                {/* Sortable rows for other categories */}
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
                            <tfoot className="font-bold text-gray-700 bg-gray-50 dark:bg-gray-800">
                                {/* Fixed row for Surplus/Deficit */}
                                <tr className="border-b">
                                    <td className="px-2 py-3 font-bold text-gray-700">
                                        Surplus/(Deficit) for the period
                                    </td>
                                    <td className="px-2 py-3 font-bold text-gray-700">
                                        {totalSurplusDeficit?.toLocaleString() || '-'}
                                    </td>

                                </tr>
                                <tr>
                                    <td className="px-2 py-3">Balance</td>
                                    <td className="px-2 py-3 font-bold text-gray-700">{periodTotal.toLocaleString()}</td>

                                </tr>
                            </tfoot>
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
                            setNewCategory('');
                        }}
                            className="bg-[#2196F3] rounded-lg text-white font-poppins py-2 px-3 text-[11px] font-medium ml-2">
                            + ADD CATEGORY
                        </button>
                    </div>
                </div>
            </Modal>

            {/*Period*/}
            <Modal isVisible={showModalPeriod}>
                <div className="bg-white w-[400px] h-60 rounded py-2 px-4">
                    <div className="flex justify-between">
                        <h1 className="font-poppins font-bold text-[27px] text-[#1E1E1E]">Select Ledger Period</h1>
                        <button className="font-poppins text-[27px] text-[#1E1E1E]" onClick={() => { setShowModalPeriod(false) }}>×</button>
                    </div>

                    <hr className="border-t border-[#7694D4] my-3" />
                    <div className="relative">


                        <form className="max-w-sm mt-5">
                            <select
                                id="periodselect"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                value={selectedPeriodId}
                                onChange={(e) => setSelectedPeriodId(e.target.value)}
                            >
                                <option value="">Select Period</option>

                                {cEquityList.map((list) => (
                                    <option key={list.id} value={list.id}>
                                        {list.year}
                                    </option>
                                ))}

                            </select>
                            <div className="flex justify-end py-3 px-4">
                                <button
                                    type="button"
                                    onClick={handleAddPeriod}
                                    className={`bg-[#2196F3] rounded text-[11px] text-white font-poppins font-medium py-2.5 px-4 mt-5 ${!selectedPeriodId && "opacity-50 cursor-not-allowed"}`}
                                >Add Period</button>
                            </div>
                        </form>

                    </div>
                </div>
            </Modal>
            {/* Right-click context modal */}
            {
                showRightClickModal && (
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
                                onClick={addNewRow}
                            >
                                Add Row Below
                            </button>
                            <button
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={addNewParentCategory}
                            >
                                Add Parent Category
                            </button>
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
                )
            }

        </Fragment >
    );
}

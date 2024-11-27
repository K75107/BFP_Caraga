import React, { Fragment, useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../../../config/firebase-config";
import { collection, doc, onSnapshot, addDoc, writeBatch, updateDoc, deleteDoc, getDocs, query, where, setDoc, getDoc } from "firebase/firestore";
import { DndContext, closestCorners, useDroppable, useDraggable, PointerSensor } from '@dnd-kit/core';
import Modal from '../../../../components/Modal';
import SuccessUnsuccessfulAlert from "../../../../components/Alerts/SuccessUnsuccessfulALert";
import ExcelJS from 'exceljs';
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities"
import { arrayMove } from '@dnd-kit/sortable';
import { debounce } from 'lodash'; // Import debounce
import AddButton from "../../../../components/addButton";
import ExportButton from "../../../../components/exportButton";
import { MdKeyboardArrowRight } from "react-icons/md";
import { MdKeyboardArrowDown } from "react-icons/md";
import { FaLongArrowAltUp } from "react-icons/fa";
import { FaLongArrowAltDown } from "react-icons/fa";
import SubmitButton from "../../../../components/submitButton";
import YesNoButton from "../../../../components/yesNoButton";

export default function CashflowsDetails() {
    const [showModal, setShowModal] = useState(false);
    const [showModalPeriod, setShowModalPeriod] = useState(false);
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

    //For Period
    const [cashflowList, setCashflowList] = useState([]);
    const [selectedPeriodId, setSelectedPeriodId] = useState();
    const [periodDataCategories, setPeriodDataCategories] = useState([]);
    const [periodId, setPeriodId] = useState(null);

    //Merge Data
    const [cashflowMergeData, setCashflowMergeData] = useState([]);
    const mainCategories = [
        { name: "Operating Activities", isLocked: true },
        { name: "Investing Activities", isLocked: true },
        { name: "Financing Activities", isLocked: true },
        { name: "Net Increase(Decrease) in Cash and Cash Equivalents", isLocked: true },
        { name: "Effects of Exchange Rate Changes on Cash and Cash Equivalents", isLocked: false },
        { name: "Cash and Cash Equivalents at the Beginning of the Period", isLocked: false },
        { name: "Cash and Cash Equivalents at the End of the Period", isLocked: false },
    ];
    const [selectedCategories, setSelectedCategories] = useState([]);

    //Current Year
    const [currentCashflow, setCurrentCashflow] = useState();

    //Selected Year
    const [selectedYear, setSelectedYear] = useState();

    //Empty 
    const [isEmpty, setisEmpty] = useState();

    useEffect(() => {
        const cashflowsCollectionRef = collection(db, "cashflow", cashflowId, "categories");
        const fetchAndInitializeCategories = async () => {
            try {
                const querySnapshot = await getDocs(cashflowsCollectionRef);
                const data = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setCashflowCategoriesData(sortCategoriesRecursively(data));

                // Initialize data if empty
                if (data.length === 0) {

                    setisEmpty(true);


                }
            } catch (error) {
                console.error("Error fetching and sorting categories:", error);
                setIsError(true);
            }
        };

        fetchAndInitializeCategories();
    }, [cashflowId]);


    // Fetch categories data only once initially to reduce continuous reads
    useEffect(() => {

        // For cashflow data
        const cashflowsCollectionsDAtaRef = collection(db, "cashflow", cashflowId, "categories");
        const unsubscribe = onSnapshot(cashflowsCollectionsDAtaRef, async (querySnapshot) => {
            try {

                const data = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                const sortedData = sortCategoriesRecursively(data);
                setCashflowCategoriesData(sortedData);

            } catch (error) {
                console.error("Error fetching and sorting categories:", error);
                setIsError(true);
            }
        });


        // For list of cashflows
        const cashflowListRef = collection(db, "cashflow");
        const unsubscribeCashflowList = onSnapshot(cashflowListRef, (querySnapshot) => {
            try {
                const data = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setCashflowList(data);

            } catch (error) {
                console.log("Error fetching period list", error);
            }
        });

        // For SelectedPeriodData
        const cashflowRef = doc(db, "cashflow", cashflowId)
        const unsubscribeCashflow = onSnapshot(cashflowRef, async (docSnapshot) => {

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
            unsubscribeCashflow();
            unsubscribeCashflowList();
            unsubscribe();
        };
    }, [cashflowId]);


    //Current Year
    useEffect(() => {
        const fetchYear = async () => {
            try {
                const selectedCashflowRef = doc(db, "cashflow", cashflowId);
                const cashflowDoc = await getDoc(selectedCashflowRef);

                if (cashflowDoc.exists()) {
                    const data = cashflowDoc.data();
                    setCurrentCashflow(data);

                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.log("Error fetching year:", error);
            }
        };

        if (cashflowId) {
            fetchYear();
        }

    }, [cashflowId]);

    //Selected Year
    useEffect(() => {
        const fetchYear = async () => {
            try {
                const selectedCashflowRef = doc(db, "cashflow", periodId);
                const cashflowDoc = await getDoc(selectedCashflowRef);

                if (cashflowDoc.exists()) {

                    const year = cashflowDoc.data().year;
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


    //Period Data
    useEffect(() => {
        if (periodId) {

            const cashflowsCollectionsDAtaRef = collection(db, "cashflow", periodId, "categories");
            const unsubscribe = onSnapshot(cashflowsCollectionsDAtaRef, async (querySnapshot) => {
                try {
                    const data = querySnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    console.log("selecedte", data)
                    setPeriodDataCategories(sortCategoriesRecursively(data));

                } catch (error) {
                    console.error("Error fetching and sorting categories:", error);
                    setIsError(true);
                }
            })
            return () => unsubscribe();
        }
    }, [periodId]);

    useEffect(() => {
        if (Array.isArray(cashflowCategoriesData) && cashflowCategoriesData.length > 0) {
            try {
                const mergedMap = new Map();
                const idMapping = new Map(); // Map to track ID resolution

                // Add current categories to the map
                cashflowCategoriesData.forEach((item) => {
                    mergedMap.set(item.id, {
                        ...item,
                        periodAmount: 0, // Initialize periodAmount
                    });
                });

                // Merge period data
                if (Array.isArray(periodDataCategories) && periodDataCategories.length > 0) {
                    periodDataCategories.forEach((item) => {
                        const resolvedParentID =
                            item.parentID === "null" ? null : idMapping.get(item.parentID) || item.parentID;

                        // Find a matching item based on resolvedParentID and categoryName
                        const existingItem = Array.from(mergedMap.values()).find(
                            (existing) =>
                                existing.categoryName === item.categoryName &&
                                existing.parentID === resolvedParentID
                        );

                        if (existingItem) {
                            // Update the idMapping and periodAmount of the existing item
                            idMapping.set(item.id, existingItem.id);
                            mergedMap.set(existingItem.id, {
                                ...existingItem,
                                periodAmount: existingItem.periodAmount + item.amount,
                            });
                        } else if (item.categoryName) {
                            // Calculate position for new items
                            const siblingPositions = Array.from(mergedMap.values())
                                .filter((cat) => cat.parentID === resolvedParentID)
                                .map((cat) => cat.position);

                            const newPosition =
                                siblingPositions.length > 0
                                    ? Math.max(...siblingPositions) + 1
                                    : 1; // Default position if no siblings exist

                            // Add the new item to the map
                            const newItem = {
                                ...item,
                                parentID: resolvedParentID, // Use resolvedParentID
                                amount: 0, // Initialize amount
                                periodAmount: item.amount, // Assign period amount
                                position: newPosition, // Set calculated position
                                isFromPeriod: true, // Mark as period data
                            };
                            mergedMap.set(item.id, newItem);

                            // Update the idMapping with the new item's id
                            idMapping.set(item.id, item.id);
                        }
                    });
                }

                // Convert mergedMap to an array
                const mergedData = Array.from(mergedMap.values());

                // Sort and recursively build hierarchy
                setCashflowMergeData(sortCategoriesRecursively(mergedData));
            } catch (error) {
                console.error("Error during merge:", error);
            }
        }
    }, [cashflowCategoriesData, periodDataCategories]);


    const handleNoClick = () => {
        setisEmpty(false); // Just set isEmpty to false

    };

    const handleYesClick = async () => {
        const cashflowsCollectionRef = collection(db, "cashflow", cashflowId, "categories");
        const batch = writeBatch(cashflowsCollectionRef.firestore);
        let position = 1;

        // Create a stable id for main categories
        const createCategoryId = (name) => {
            return name.toLowerCase().replace(/\s+/g, "_");
        };

        // Function to add a main category
        const addMainCategory = (name) => {
            const categoryId = createCategoryId(name);
            const ref = doc(cashflowsCollectionRef, categoryId); // Use categoryId as the document ID
            batch.set(ref, {
                categoryName: name,
                parentID: null,
                created_at: new Date(),
                position: position++,
                amount: 0,
                isLocked: true,
            });
            return categoryId;
        };

        // Function to add a main category without lock
        const addMainCategoryNotLock = (name) => {
            const categoryId = createCategoryId(name);
            const ref = doc(cashflowsCollectionRef, categoryId); // Use categoryId as the document ID
            batch.set(ref, {
                categoryName: name,
                parentID: null,
                created_at: new Date(),
                position: position++,
                amount: 0,
            });
            return categoryId;
        };

        // Cash Inflows and Cash Outflows
        const createSubcategoryId = (name, parentId) => {
            return `${name.toLowerCase().replace(/\s+/g, "_")}_${parentId}`;
        };

        // Blank Rows
        const addSubcategoryWithBlanks = (name, parentId) => {
            const subcategoryId = createSubcategoryId(name, parentId);
            const ref = doc(cashflowsCollectionRef, subcategoryId);
            batch.set(ref, {
                categoryName: name,
                parentID: parentId,
                created_at: new Date(),
                position: position++,
                amount: 0,
                isLocked: true,
            });

            // Add two blank rows
            batch.set(doc(cashflowsCollectionRef), {
                categoryName: "",
                parentID: ref.id,
                created_at: new Date(),
                position: position++,
                amount: 0,
            });
            batch.set(doc(cashflowsCollectionRef), {
                categoryName: "",
                parentID: ref.id,
                created_at: new Date(),
                position: position++,
                amount: 0,
            });
        };

        // Add categories and subcategories
        const operatingId = addMainCategory("Operating Activities");
        addSubcategoryWithBlanks("Cash Inflows", operatingId);
        addSubcategoryWithBlanks("Cash Outflows", operatingId);

        const investingId = addMainCategory("Investing Activities");
        addSubcategoryWithBlanks("Cash Inflows", investingId);
        addSubcategoryWithBlanks("Cash Outflows", investingId);

        const financingId = addMainCategory("Financing Activities");
        addSubcategoryWithBlanks("Cash Inflows", financingId);
        addSubcategoryWithBlanks("Cash Outflows", financingId);

        // Additional standalone categories
        addMainCategory("Net Increase(Decrease) in Cash and Cash Equivalents");
        addMainCategoryNotLock("Effects of Exchange Rate Changes on Cash and Cash Equivalents");
        addMainCategoryNotLock("Cash and Cash Equivalents at the Beginning of the Period");
        addMainCategoryNotLock("Cash and Cash Equivalents at the End of the Period");

        // Commit batch
        await batch.commit();

        setisEmpty(false);
    };



    const sortCategoriesRecursively = (categories, parentID = null, level = 0) => {
        const filteredCategories = categories
            .filter((category) => category.parentID === parentID)
            .sort((a, b) => a.position - b.position);

        return filteredCategories.flatMap((category) => [
            { ...category, level },
            ...sortCategoriesRecursively(categories, category.id, level + 1),
        ]);
    };

    const toggleCheckbox = (categoryName) => {
        setSelectedCategories((prevSelected) => {
            if (prevSelected.includes(categoryName)) {
                return prevSelected.filter((name) => name !== categoryName); // Remove if already selected
            } else {
                return [...prevSelected, categoryName]; // Add if not already selected
            }
        });
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
        return cashflowMergeData.filter((category) => {
            // Check if the category is a main category or if it is expanded
            if (category.parentID === null) return true;

            // If the category has a parent, check if the parent is expanded
            let currentCategory = category;
            while (currentCategory.parentID) {
                if (!expandedCategories[currentCategory.parentID]) {
                    return false; // Parent is not expanded
                }
                currentCategory = cashflowMergeData.find(cat => cat.id === currentCategory.parentID);
            }
            return true; // This category and its parents are expanded
        });
    };

    const visibleCategories = getVisibleCategories();

    const addNewCategory = async () => {
        const cashflowsCollectionRef = collection(db, "cashflow", cashflowId, "categories");

        try {
            const batch = writeBatch(db);
            const querySnapshot = await getDocs(cashflowsCollectionRef);
            const existingCategories = querySnapshot.docs.map((doc) => doc.id);

            let position = querySnapshot.docs.length + 1;

            // Function to generate a unique ID
            const createCategoryId = (name) => name.toLowerCase().replace(/\s+/g, "_");

            // Function to add subcategories with blank rows
            const addSubcategoryWithBlanks = (name, parentId) => {
                const subcategoryId = `${createCategoryId(name)}_${parentId}`;
                const ref = doc(cashflowsCollectionRef, subcategoryId);

                batch.set(ref, {
                    categoryName: name,
                    parentID: parentId,
                    created_at: new Date(),
                    position: position++,
                    amount: 0,
                    isLocked: true,
                });

                // Add two blank rows
                batch.set(doc(cashflowsCollectionRef), {
                    categoryName: "",
                    parentID: ref.id,
                    created_at: new Date(),
                    position: position++,
                    amount: 0,
                });
                batch.set(doc(cashflowsCollectionRef), {
                    categoryName: "",
                    parentID: ref.id,
                    created_at: new Date(),
                    position: position++,
                    amount: 0,
                });
            };

            // Add new custom category if provided
            if (newCategory.trim()) {
                const categoryId = createCategoryId(newCategory);
                if (!existingCategories.includes(categoryId)) {
                    const ref = doc(cashflowsCollectionRef, categoryId);
                    batch.set(ref, {
                        categoryName: newCategory,
                        parentID: null,
                        created_at: new Date(),
                        position: position++,
                        amount: 0,
                        isLocked: false, // Custom categories are not locked
                    });
                }
            }

            // Add selected main categories
            selectedCategories.forEach((categoryName) => {
                const category = mainCategories.find((cat) => cat.name === categoryName);
                const categoryId = createCategoryId(categoryName);

                if (category && !existingCategories.includes(categoryId)) {
                    const ref = doc(cashflowsCollectionRef, categoryId);
                    batch.set(ref, {
                        categoryName,
                        parentID: null,
                        created_at: new Date(),
                        position: position++,
                        amount: 0,
                        isLocked: category.isLocked,
                    });

                    // Add subcategories and blank rows for specific categories
                    if (categoryName === "Operating Activities" ||
                        categoryName === "Investing Activities" ||
                        categoryName === "Financing Activities") {
                        addSubcategoryWithBlanks("Cash Inflows", categoryId);
                        addSubcategoryWithBlanks("Cash Outflows", categoryId);
                    }
                }
            });

            if (!batch._mutations.length) {
                alert("No new categories to add.");
                return;
            }

            await batch.commit();

            setShowModal(false);
            setNewCategory("");
            setSelectedCategories([]);
        } catch (error) {
            console.error("Error adding categories:", error);
        }
    };

    // Function to add a new subcategory
    const addNewRow = async () => {
        try {
            if (!selectedRowData) {
                console.error('No category selected to add subcategory.');
                return;
            }
            const siblings = cashflowCategoriesData.filter(cat => cat.parentID === selectedRowData.parentID);
            const newRowPosition = siblings.length > 0
                ? siblings[siblings.length - 1].position + 1
                : 1;

            const cashflowDocRef = doc(db, 'cashflow', cashflowId);
            const categoriesCollectionRef = collection(cashflowDocRef, 'categories');

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
            const siblings = cashflowCategoriesData.filter(cat => cat.parentID === selectedRowData.id);
            const newRowPosition = siblings.length > 0
                ? siblings[siblings.length - 1].position + 1
                : 1;

            const cashflowDocRef = doc(db, 'cashflow', cashflowId);
            const categoriesCollectionRef = collection(cashflowDocRef, 'categories');
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

            const cashflowDocRef = doc(db, 'cashflow', cashflowId);
            const categoriesCollectionRef = collection(cashflowDocRef, 'categories');


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


            const categoriesToUpdate = cashflowCategoriesData.filter(cat => cat.position >= selectedRowData.position && cat.id !== selectedRowData.id);
            for (const cat of categoriesToUpdate) {
                await updateDoc(doc(categoriesCollectionRef, cat.id), {
                    position: cat.position + 1
                });
            }

            setShowModal(false);
        } catch (error) {
            console.error('Error adding new parent category:', error);
            setIsError(true);
        }
    };


    const handleRightClick = (event, category) => {

        if (category.isFromPeriod) return;

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

    const getNetTotalByMainCategory = (cashflowMergeData) => {
        // Initialize result object
        const netTotals = {};

        // Filter main categories
        const mainCategories = cashflowMergeData.filter(category => category.level === 0);

        mainCategories.forEach(mainCategory => {
            // Calculate totals for Cash Inflows
            const inflows = cashflowMergeData.find(subCat =>
                subCat.parentID === mainCategory.id && subCat.categoryName === 'Cash Inflows'
            );
            const inflowsTotal = inflows
                ? getLeafCategoryAmountTotal(inflows.id, cashflowMergeData)
                : { totalAmount: 0, totalPeriodAmount: 0 };

            // Calculate totals for Cash Outflows
            const outflows = cashflowMergeData.find(subCat =>
                subCat.parentID === mainCategory.id && subCat.categoryName === 'Cash Outflows'
            );
            const outflowsTotal = outflows
                ? getLeafCategoryAmountTotal(outflows.id, cashflowMergeData)
                : { totalAmount: 0, totalPeriodAmount: 0 };

            // Calculate net total for the current main category (both for amount and periodAmount)
            const netTotalAmount = inflowsTotal.totalAmount - outflowsTotal.totalAmount;
            const netTotalPeriodAmount = inflowsTotal.totalPeriodAmount - outflowsTotal.totalPeriodAmount;

            // Add to result object with main category name as key
            netTotals[mainCategory.categoryName] = {
                netTotalAmount,
                netTotalPeriodAmount
            };
        });

        return netTotals;
    };


    const getNetCashChange = (cashflowMergeData, db, cashflowId) => {
        // Initialize total inflows and outflows for both amounts
        let totalInflows = 0;
        let totalPeriodInflows = 0;
        let totalOutflows = 0;
        let totalPeriodOutflows = 0;

        // Iterate through all data to calculate inflows and outflows
        cashflowMergeData.forEach(category => {
            if (category.categoryName === 'Cash Inflows') {
                const totals = getLeafCategoryAmountTotal(category.id, cashflowMergeData);
                totalInflows += totals.totalAmount;
                totalPeriodInflows += totals.totalPeriodAmount;
            } else if (category.categoryName === 'Cash Outflows') {
                const totals = getLeafCategoryAmountTotal(category.id, cashflowMergeData);
                totalOutflows += totals.totalAmount;
                totalPeriodOutflows += totals.totalPeriodAmount;
            }
        });

        // Calculate net changes
        const netChange = totalInflows - totalOutflows;
        const netPeriodChange = totalPeriodInflows - totalPeriodOutflows;


        // Return both results
        return {
            netChange,
            netPeriodChange,
        };
    };


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

        const hasSubcategories = category.level >= 0 && cashflowMergeData.some(subCat => subCat.parentID === category.id);
        const { totalAmount, totalPeriodAmount } = getLeafCategoryAmountTotal(category.id, cashflowMergeData);

        const netTotals = getNetTotalByMainCategory(cashflowMergeData);

        const { netChange, netPeriodChange } = getNetCashChange(cashflowMergeData);

        return (
            <tr
                ref={setNodeRef}
                {...attributes}
                style={style}
                className={`border-b w-full px-6 ${category.isFromPeriod ? 'bg-red-100' : 'bg-white'}`}
                onContextMenu={(e) => handleRightClick(e, category)}
            >
                <td
                    className="py-3 px-6 flex items-center"
                    style={{ paddingLeft: `${45 * category.level}px` }}
                >

                    <span
                        className={`mr-2 text-gray-500 pl-4 ${category.categoryName !== 'Cash Inflows' &&
                            category.categoryName !== 'Cash Outflows' &&
                            !category.isLocked &&
                            !category.isFromPeriod
                            ? 'cursor-grab'
                            : 'invisible'
                            }`}
                        {...(category.categoryName !== 'Cash Inflows' &&
                            category.categoryName !== 'Cash Outflows' &&
                            !category.isLocked &&
                            !category.isFromPeriod
                            ? listeners
                            : {})}
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
                                    className="border w-auto text-[14px] focus:outline-none px-1 py-1"
                                    value={editValue.value}
                                    style={{ width: inputWidth }}
                                    onChange={(e) =>
                                        setEditValue({ field: 'categoryName', value: e.target.value })
                                    }
                                    onBlur={() =>
                                        handleCellChange(category.id, 'categoryName', editValue.value)
                                    }
                                    autoFocus
                                />
                            </>
                        ) : (
                            <span
                                onClick={() => {
                                    if (
                                        category.id !== "cash_inflows" &&
                                        category.id !== "cash_outflows" &&
                                        category.id !== "operating_activities" &&
                                        category.id !== "investing_activities" &&
                                        category.id !== "financing_activities" &&
                                        category.id !== "net_increase(decrease)_in_cash_and_cash_equivalents"
                                    ) {
                                        // Make only other categories clickable
                                        setEditingCell(category.id);
                                        setEditValue({
                                            field: 'categoryName',
                                            value: category.categoryName || '',
                                        });
                                    }
                                }}
                                className={`block  py-1  ${category.categoryName === 'Cash Inflows' ||
                                    category.categoryName === 'Cash Outflows'
                                    ? ''
                                    : 'hover:bg-gray-100'
                                    }`}
                            >
                                {category.categoryName || '-'}
                            </span>
                        )}

                    </span>

                    {(category.level >= 0 && cashflowMergeData.some(subCat => subCat.parentID === category.id)) && (
                        <button
                            onClick={() => toggleCategory(category.id)}

                        >
                            {expandedCategories[category.id] ? <MdKeyboardArrowDown size={18} style={{ display: "inline" }} /> : <MdKeyboardArrowRight size={18} style={{ display: "inline" }} />}
                        </button>
                    )}

                </td>

                <td className="px-2 py-2 w-56 h-6 ">
                    {category.level === 0 && hasSubcategories ? (
                        // Main category: Display net total for the category
                        <span className="font-bold text-black">
                            {formatNumber(netTotals[category.categoryName]?.netTotalAmount) || ''}
                        </span>
                    ) : (
                        // Non-main categories: Keep the original logic
                        category.id === "net_increase(decrease)_in_cash_and_cash_equivalents" ?
                            <span className="font-bold"> {formatNumber(netChange)}</span> :
                            category.isFromPeriod ? (
                                <span>{formatNumber(totalAmount) || ''}</span>
                            ) : (
                                hasSubcategories ? (
                                    <span
                                        className={`font-bold flex items-center gap-1 ${category.categoryName === 'Cash Inflows' ? 'text-green-600' :
                                            category.categoryName === 'Cash Outflows' ? 'text-red-600' : ''}`}>
                                        {formatNumber(totalAmount) || ''}
                                        {category.categoryName === 'Cash Inflows' && (
                                            <FaLongArrowAltUp />
                                        )}
                                        {category.categoryName === 'Cash Outflows' && (
                                            <FaLongArrowAltDown />
                                        )}

                                    </span>

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
                                            {formatNumber(category.amount) || ''}
                                        </span>
                                    )
                                )
                            )
                    )}

                </td>

                <td className="px-2 py-2 w-56 h-6 ">
                    {category.level === 0 & hasSubcategories ? (
                        // Main category: Display net total for the category
                        <span className="font-bold text-black">
                            {formatNumber(netTotals[category.categoryName]?.netTotalPeriodAmount) || ''}
                        </span>
                    ) : (
                        category.id === "net_increase(decrease)_in_cash_and_cash_equivalents" ?
                            <span className="font-bold"> {formatNumber(netPeriodChange)}</span> :
                            category.isFromPeriod ? (
                                <span>{formatNumber(category.periodAmount) || ''}</span>
                            ) : hasSubcategories ?
                                <span
                                    className={`font-bold flex items-center gap-1 ${category.categoryName === 'Cash Inflows' ? 'text-green-600' :
                                        category.categoryName === 'Cash Outflows' ? 'text-red-600' : ''}`}>
                                    {formatNumber(totalPeriodAmount) || ''}
                                    {category.categoryName === 'Cash Inflows' && (
                                        <FaLongArrowAltUp />
                                    )}
                                    {category.categoryName === 'Cash Outflows' && (
                                        <FaLongArrowAltDown />
                                    )}

                                </span>

                                : (
                                    <span
                                        onClick={() => {
                                            setEditingCell(category.id);
                                            setEditValue({ field: 'amount', value: category.amount || '' });
                                        }}
                                        className="block hover:bg-gray-100 w-full h-8 px-2 py-1"
                                    >
                                        {formatNumber(category.periodAmount) || ''}
                                    </span>
                                )
                    )}
                </td>
                {/* <td className="px-6">
                    {category.isFromPeriod ? (
                        <div className="flex space-x-4">
                            <YesNoButton type="yes" size="xs" />
                            <YesNoButton type="no" size="xs" />
                        </div>
                    ) : <div></div>
                    }
                </td> */}


            </tr >
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
            // console.log('Category field updated in Firestore successfully.');

        } catch (error) {
            console.error('Error updating category field in Firestore:', error);
        }
    }, 1000); // Debounce delay set to 1 second


    const handleDeleteRow = async () => {
        if (!selectedRowData) return;

        try {
            const cashflowDocRef = doc(db, 'cashflow', cashflowId);
            const categoriesCollectionRef = collection(cashflowDocRef, 'categories');

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
            const cashflowListRef = doc(db, "cashflow", cashflowId);

            await updateDoc(cashflowListRef, {
                selectedPeriod: selectedPeriodId
            });

            setSelectedPeriodId('');
            setShowModalPeriod(false);


        } catch (error) {
            console.log("Error updating period:", error);
        }

    }
    //--------------------------------------------- E X P O R T I N G F U N C T I O N ---------------------------------------------
    const exportToExcel = async () => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Cashflow Data');

            // Add Header Data
            const worksheetData = [
                ["STATEMENT OF CASHFLOWS"],
                ["REGULAR AGENCY FUND"],
                ["FOR THE QUARTER ENDED"],
            ];

            worksheetData.forEach((row) => worksheet.addRow(row));

            // Adjust Header Row Heights and Styles
            worksheet.getRow(1).height = 15.75;
            worksheet.getRow(2).height = 15.75;
            worksheet.getRow(3).height = 15.75;

            // Merge Header Cells
            worksheet.mergeCells('A1:D1');
            worksheet.mergeCells('A2:D2');
            worksheet.mergeCells('A3:D3');

            // Set Column Widths
            worksheet.columns = [
                { width: 45 }, // Column 1: Categories
                { width: 20 }, // Column 2: Amount
                { width: 5 },  // Column 3: Spacer
                { width: 20 }, // Column 4: Period Amount
            ];

            // Styles
            const headerStyle = {
                font: { bold: true, size: 14, name: 'Times New Roman' },
                alignment: { horizontal: 'center', vertical: 'middle' },
            };
            const headerStyle2 = {
                font: { bold: true, size: 14, name: 'Times New Roman' },
                alignment: { horizontal: 'center', vertical: 'middle' },
                border: { bottom: 'thin' },
            };


            const subHeaderStyle = {
                font: { bold: true, size: 12, name: 'Times New Roman' },
                alignment: { horizontal: 'center', vertical: 'middle' },
            };



            const mainCategoryStyle = {
                font: { bold: true, size: 12, name: 'Times New Roman' },
                alignment: { horizontal: 'left', vertical: 'middle' },
            };

            const subCategoryStyle = {
                font: { size: 12, name: 'Times New Roman' },
                alignment: { horizontal: 'left', vertical: 'middle' },
            };

            const mainCategoryAmountStyle = {
                font: { size: 12, name: 'Times New Roman' },
                alignment: { horizontal: 'center', vertical: 'middle' },
                border: { top: 'thin', bottom: 'thin' }
            };

            const subCategoryAmountStyle = {
                font: { size: 12, name: 'Times New Roman' },
                alignment: { horizontal: 'center', vertical: 'middle' },
                border: { bottom: 'thin' }
            };

            const mainCategoryisLockedAmountStyle = {
                font: { size: 12, name: 'Times New Roman' },
                alignment: { horizontal: 'center', vertical: 'middle' },
                border: { bottom: 'double' }
            }

            const dataStyle = {
                font: { size: 12, name: 'Times New Roman' },
                alignment: { horizontal: 'center', vertical: 'middle' },
            };

            // Apply Header Styles
            ['A1', 'A2', 'A3'].forEach((cell) => {
                worksheet.getCell(cell).style = headerStyle;
            });
            // Apply Header Styles
            ['B5', 'D5'].forEach((cell) => {
                worksheet.getCell(cell).style = headerStyle2;
            });

            worksheet.addRow([]); // Add space below header

            const yearRow = worksheet.addRow([]);
            yearRow.getCell(2).value = `${currentCashflow.year}`;
            yearRow.getCell(4).value = `${selectedYear}`;
            [2, 4].forEach((col) => {
                yearRow.getCell(col).border = { bottom: { style: 'thin' } };
                yearRow.getCell(col).style = subHeaderStyle;
            });
            yearRow.height = 36; // Adjust height

            // Helper function for category totals
            const calculateCategoryTotal = (categoryId) => {
                const subcategories = cashflowMergeData.filter(
                    (subcategory) => subcategory.parentID === categoryId
                );

                if (subcategories.length === 0) {
                    const mainCategory = cashflowMergeData.find(
                        (category) => category.id === categoryId
                    );
                    return mainCategory ? mainCategory.amount || 0 : 0;
                }

                return subcategories.reduce(
                    (acc, subcategory) => acc + calculateCategoryTotal(subcategory.id),
                    0
                );
            };

            const calculateCategoryPeriodTotal = (categoryId) => {
                const subcategories = cashflowMergeData.filter(
                    (subcategory) => subcategory.parentID === categoryId
                );

                if (subcategories.length === 0) {
                    const category = cashflowMergeData.find((cat) => cat.id === categoryId);
                    return category ? category.periodAmount || 0 : 0; // Fetch periodAmount
                }

                return subcategories.reduce(
                    (acc, subcategory) => acc + calculateCategoryPeriodTotal(subcategory.id),
                    0
                );
            };

            // Recursive function to add rows
            const addCategoryAndChildrenRows = (category, level = 0, processedCategories = new Set()) => {
                if (processedCategories.has(category.id)) return; // Prevent duplicate processing
                processedCategories.add(category.id);

                const totalAmount = calculateCategoryTotal(category.id);
                const totalPeriodAmount = calculateCategoryPeriodTotal(category.id);

                if (totalAmount === 0 && totalPeriodAmount === 0) return; // Skip empty rows

                const isLocked = mainCategories.some(
                    (mainCategory) =>
                        mainCategory.name === category.categoryName && mainCategory.isLocked
                );

                const row = worksheet.addRow([
                    ' '.repeat(level * 4) + (category.categoryName || '(-)'), // Column 1
                    level === 0 && isLocked ? '' : totalAmount === 0 ? '' : formatNumber(totalAmount), // Column 2
                    '', // Column 3
                    level === 0 && isLocked ? '' : totalPeriodAmount === 0 ? '' : formatNumber(totalPeriodAmount), // Column 4
                ]);

                if (level === 0) {
                    row.getCell(1).style = mainCategoryStyle;
                    worksheet.addRow([]);
                } else if (isLocked) {
                    [2, 4].forEach((col) => row.getCell(col).style = mainCategoryisLockedAmountStyle);
                } else {
                    row.getCell(1).style = subCategoryStyle;
                }
                [2, 4].forEach((col) => row.getCell(col).style = dataStyle);

                const childCategories = cashflowMergeData.filter(
                    (child) => child.parentID === category.id
                );

                childCategories.forEach((child) =>
                    addCategoryAndChildrenRows(child, level + 1, processedCategories)
                );

                if (category.categoryName.includes('Cash Inflows') || category.categoryName.includes('Cash Outflows')) {
                    worksheet.addRow([]);
                    const totalRow = worksheet.addRow([
                        `Total ${category.categoryName}`, // Total row label
                        totalAmount === 0 ? '' : formatNumber(totalAmount), // Total amount
                        '', // Spacer
                        totalPeriodAmount === 0 ? '' : formatNumber(totalPeriodAmount), // Total period amount
                    ]);

                    totalRow.getCell(1).style = mainCategoryStyle;
                    [2, 4].forEach((col) => {
                        totalRow.getCell(col).style = mainCategoryAmountStyle;
                        totalRow.getCell(col).border = { top: { style: 'thin' }, bottom: { style: 'thin' } };
                    });
                    worksheet.addRow([]);
                }
            };

            const processedCategories = new Set();
            cashflowMergeData
                .filter((category) => !category.parentID)
                .forEach((mainCategory) => addCategoryAndChildrenRows(mainCategory, 0, processedCategories));

            // Function to calculate and display totals
            const calculateTotals = (categories) => {
                return categories
                    .filter((category) => !category.parentID)
                    .map((category) => ({
                        name: category.categoryName,
                        amount: calculateCategoryTotal(category.id),
                        periodAmount: calculateCategoryPeriodTotal(category.id),
                    }));
            };

            // Additional logic to handle added periods
            const handleAddPeriod = async () => {
                try {
                    const cashflowListRef = doc(db, "cashflow", cashflowId);
                    await updateDoc(cashflowListRef, { selectedPeriod: selectedPeriodId });
                    setSelectedPeriodId('');
                    setShowModalPeriod(false);
                } catch (error) {
                    console.error("Error updating period:", error);
                }
            };


            // Save Workbook
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/octet-stream' });

            // Trigger Download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Cashflow Data.xlsx';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting data to Excel:', error);
        }
    };


    //--------------------------------------------- E X P O R T I N G F U N C T I O N ---------------------------------------------
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
            <div className="px-6">
                <div className="bg-white h-30 py-6 px-8 rounded-lg">
                    <div className="flex justify-between w-full">
                        <h1 className="text-[25px] font-bold text-[#1E1E1E] font-poppins">{currentCashflow?.description || ""}</h1>
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
                                onClick={exportToExcel}
                                label={"EXPORT"}
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
                                    <th scope="col" className="py-4 px-6 text-start">Account Description</th>
                                    <th scope="col" className="py-4 ml-6 w-56 text-start">{currentCashflow?.year || ''}</th>
                                    <th scope="col" className="py-4 ml-6 w-56  text-start">{selectedYear || ''}</th>

                                </tr>
                            </thead>
                        </table>
                    </div>


                    <div className=' w-full bg-white overflow-y-scroll h-[calc(100vh-280px)]'>
                        {isEmpty ? (
                            <div className="w-full h-full flex flex-col justify-center items-center text-center space-y-4">
                                <p className="text-lg font-poppins font-medium text-gray-800">
                                    Would you like to generate a cashflow Template?
                                </p>
                                <div className="flex space-x-4">
                                    <YesNoButton type="yes" label={"Yes"} onClick={handleYesClick} />
                                    <YesNoButton type="no" label={"No"} onClick={handleNoClick} />
                                </div>
                            </div>


                        ) : null}
                        <table className='w-full text-sm text-left text-gray-800 overflow-x-visible'>
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
                <div className="bg-white w-[600px] h-auto rounded-lg py-4 px-4 shadow-xl flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="font-poppins font-bold text-xl text-gray-700">Add New Category</h1>
                        <button
                            className="text-2xl font-semibold text-gray-500 focus:outline-none"
                            onClick={() => {
                                setSelectedCategories([]); // Reset selected checkboxes
                                setShowModal(false);
                            }}
                        >
                            ×
                        </button>
                    </div>
                    <hr className="border-t border-[#7694D4] -my-1" />

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-grow items-center">
                        {/* Input for category name */}
                        <div className="w-full max-w-[500px] mb-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    id="new_category_input"
                                    className="block px-2.5 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 focus:outline-none focus:border-blue-600 peer"
                                    placeholder=" "
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                />
                                <label
                                    htmlFor="new_category_input"
                                    className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-0 bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 left-1"
                                >
                                    Category Name
                                </label>
                            </div>
                        </div>

                        {/* Checkboxes for main categories */}
                        <div className="w-full max-w-[500px] mb-4">
                            <h2 className="font-semibold text-sm text-gray-700 mb-2">Select Main Categories:</h2>
                            <ul className="h-40 px-3 pb-3 overflow-y-auto text-sm text-gray-700 border rounded-lg">
                                {mainCategories.map((category) => (
                                    <li key={category.name} className="flex items-center p-2 hover:bg-gray-200 active:bg-gray-300">
                                        <label className="flex items-center w-full cursor-pointer">
                                            <span className="flex-grow text-sm text-gray-900">{category.name}</span>
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(category.name)}
                                                onChange={() => toggleCheckbox(category.name)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mb-2 flex justify-center">
                        {/* Cancel Button */}
                        <button
                            type="button"
                            className="w-full max-w-[240px] text-white bg-blue-600 hover:bg-blue-700 font-poppins text-sm font-medium py-2 px-8 rounded-lg mr-2"
                            onClick={() => {
                                setSelectedCategories([]); // Reset selected checkboxes
                                setShowModal(false);
                            }}
                        >
                            Cancel
                        </button>

                        {/* Add Button */}
                        <button
                            type="button"
                            className={`w-full max-w-[240px] text-white bg-blue-600 hover:bg-blue-700 font-poppins text-sm font-medium py-2 px-8 rounded-lg ${!newCategory && selectedCategories.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={!newCategory && selectedCategories.length === 0}
                            onClick={(event) => {
                                event.stopPropagation();
                                addNewCategory();
                            }}
                        >
                            Add
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

                                {cashflowList.map((list) => (
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
                        className="fixed inset-0 flex justify-center items-center z-20"
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
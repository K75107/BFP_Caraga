import React from "react";
import { useParams } from "react-router-dom";
import { Fragment, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../../../config/firebase-config";
import { collection, doc, onSnapshot, addDoc, updateDoc } from "firebase/firestore";
import Modal from '../../../../components/Modal';
import SuccessUnsuccessfulAlert from "../../../../components/Alerts/SuccessUnsuccessfulALert";
import { MdKeyboardArrowRight, MdKeyboardArrowDown } from "react-icons/md";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

export default function CashflowsDetails() {
    const [showModal, setShowModal] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const navigate = useNavigate();
    const { cashflowId } = useParams();
    const [cashflowCategoriesData, setCashflowCategoriesData] = useState([]);


    useEffect(() => {
        try {
            const cashflowsCollectionRef = collection(db, 'cashflow', cashflowId, 'categories');
            const unsubscribe = onSnapshot(cashflowsCollectionRef, (querySnapshot) => {
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCashflowCategoriesData(data);
            });
            return () => unsubscribe();
        } catch (error) {
            console.error('Error fetching real-time cashflows data:', error);
            setIsError(true);
        }
    }, [cashflowId]);

    // Modify existing addNewCategory function for main categories
    const addNewCategory = async () => {
        try {
            const cashflowDocRef = doc(db, 'cashflow', cashflowId);
            const categoriesCollectionRef = collection(cashflowDocRef, 'categories');
            const docRef = await addDoc(categoriesCollectionRef, {
                categoryName: newCategory,
                parentID: null, // No parent for main category
                created_at: new Date(),
            });
            const newCategoryCreated = {
                id: docRef.id,
                categoryName: newCategory,
                parentID: null,
                created_at: new Date(),
            };
            setCashflowCategoriesData((prevData) => [...prevData, newCategoryCreated]);
        } catch (error) {
            console.error('Error adding new category:', error);
        }
    };

    const [expandedCategories, setExpandedCategories] = useState({});

    const toggleCategory = (categoryName) => {
        setExpandedCategories((prevState) => ({
            ...prevState,
            [categoryName]: !prevState[categoryName],
        }));
    };


    //Right Click Functions
    const [selectedRowData, setSelectedRowData] = useState(null);
    const [showRightClickModal, setShowRightClickModal] = useState(false);
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

    const handleRightClick = (event, category) => {
        event.preventDefault();

        const categoryID = category.id; // Account document ID

        setSelectedRowData(category);

        // Set the modal position based on the mouse position
        setModalPosition({ x: event.clientX, y: event.clientY - 50 });
        setShowRightClickModal(true); // Open the modal


        console.log(category)
    };

    const closeModalOnOutsideClick = (e) => {
        if (e.target.id === "user-modal-overlay") {
            setShowRightClickModal(false);
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
            const docRef = await addDoc(categoriesCollectionRef, {
                categoryName: newCategory,
                parentID: selectedRowData.id, // Assign the selected category's ID as the parent
                created_at: new Date(),
            });
            const newSubcategory = {
                id: docRef.id,
                categoryName: newCategory,
                parentID: selectedRowData.id,
                created_at: new Date(),
            };
            setCashflowCategoriesData((prevData) => [...prevData, newSubcategory]);
            setShowModal(false); // Close modal after adding subcategory
        } catch (error) {
            console.error('Error adding new subcategory:', error);
        }
    };

    // State for managing the current category being edited and its new name
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState("");

    // Function to save the new category name
    const handleSaveCategoryName = async (categoryId, name) => {

        const categoryRowRef = doc(db, 'cashflow', cashflowId, 'categories', categoryId)

        const updatedData = {
            categoryName: name
        }

        await updateDoc(categoryRowRef, updatedData)
            .then(() => {
                console.log("Document successfully updated!");
            })
            .catch((error) => {
                console.error("Error updating document: ", error);
            });

        console.log(`Saving category ${categoryId} with name ${name}`);
        setEditingCategory(null);
        setNewCategoryName("");
    };

    // Modify the table to display subcategories based on the parentID field
    const [categoryInputs, setCategoryInputs] = useState({});
    const [editingCategories, setEditingCategories] = useState({});

    const handleInputChange = (id, value) => {
        setCategoryInputs(prevState => ({
            ...prevState,
            [id]: value,
        }));
    };

    const toggleEditing = (id) => {
        setEditingCategories(prevState => ({
            ...prevState,
            [id]: !prevState[id],
        }));
    };

    const [hierarchicalCategories, setHierarchicalCategories] = useState([]);

    useEffect(() => {
        const transformToHierarchy = (data) => {
            const map = {};
            const roots = [];

            data.forEach(category => {
                map[category.id] = { ...category, subcategories: [] };
            });

            data.forEach(category => {
                if (category.parentID === null) {
                    roots.push(map[category.id]);
                } else if (map[category.parentID]) {
                    map[category.parentID].subcategories.push(map[category.id]);
                }
            });

            return roots;
        };

        const hierarchy = transformToHierarchy(cashflowCategoriesData);
        console.log(hierarchy)
        setHierarchicalCategories(hierarchy);
    }, [cashflowCategoriesData]);



    const renderCategories = (categories = hierarchicalCategories, level = 1) => {
        return categories.map(category => (
            <Fragment key={category.id}>
                <tr
                    className="text-[12px] bg-gray-100 h-8 border-b w-full dark:bg-gray-700 dark:border-gray-700 cursor-pointer"
                    onClick={() => toggleCategory(category.categoryName)}
                    onContextMenu={(e) => handleRightClick(e, category)}
                    onDoubleClick={() => toggleEditing(category.id)}
                >
                    <td
                        className={`px-2 py-2 w-40 text-[12px] font-semibold text-gray-700 dark:text-gray-300 relative`}
                        style={{ paddingLeft: `${level * 40}px` }}
                    >
                        {editingCategories[category.id] || category.categoryName === '' ? (
                            <div className="flex items-center">
                                <input
                                    type="text"
                                    className="w-full bg-transparent border-b border-gray-300 focus:outline-none text-[12px] w-28 h-6"
                                    placeholder=""
                                    value={categoryInputs[category.id] || ''}
                                    onChange={(e) => handleInputChange(category.id, e.target.value)}
                                    onBlur={() => {
                                        handleSaveCategoryName(category.id, categoryInputs[category.id] || '');
                                        toggleEditing(category.id); // Exit edit mode on blur
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSaveCategoryName(category.id, categoryInputs[category.id] || '');
                                            toggleEditing(category.id); // Exit edit mode on Enter
                                        }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                {expandedCategories[category.categoryName] ? (
                                    <MdKeyboardArrowDown size={20} className="ml-4 text-gray-500" />
                                ) : (
                                    <MdKeyboardArrowRight size={20} className="ml-4 text-gray-500" />
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <span>{category.categoryName}</span>
                                <span className="ml-20 absolute left-10 top-1/2 transform -translate-y-1/2">
                                    {expandedCategories[category.categoryName] ? (
                                        <MdKeyboardArrowDown size={20} />
                                    ) : (
                                        <MdKeyboardArrowRight size={20} />
                                    )}
                                </span>
                            </div>
                        )}
                    </td>
                    <td className="px-2 py-2"></td>
                    <td className="px-2 py-2"></td>
                </tr>

                {/* Recursively render subcategories */}
                {expandedCategories[category.categoryName] && renderCategories(category.subcategories, level + 1)}
            </Fragment>
        ));
    };





    return (
        <Fragment>
            {isSuccess && (
                <div className="absolute top-4 right-4">
                    <SuccessUnsuccessfulAlert isSuccess={isSuccess} message={'New Cashflow Statement Created'} icon={'check'} />
                </div>
            )}
            {isError && (
                <div className="absolute top-4 right-4">
                    <SuccessUnsuccessfulAlert isError={isError} message={'Cashflow Statement Deleted'} icon={'wrong'} />
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
                            <DragDropContext>
                                {renderCategories(hierarchicalCategories)}
                            </DragDropContext>
                        </tbody>
                    </table>
                </div>
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






        </Fragment>
    );
}

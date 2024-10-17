import React from "react";
import { useParams } from "react-router-dom";
import { Fragment, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../../../config/firebase-config";
import { collection, doc, onSnapshot, addDoc, updateDoc } from "firebase/firestore";
import Modal from '../../../../components/Modal';
import SuccessUnsuccessfulAlert from "../../../../components/Alerts/SuccessUnsuccessfulALert";
import { MdKeyboardArrowRight, MdKeyboardArrowDown } from "react-icons/md";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

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
    const renderCategories = (parentId = null, level = 1) => {
        const filteredCategories = cashflowCategoriesData.filter(category => category.parentID === parentId);

        // Debugging: Log the filtered categories
        console.log('Filtered Categories for parentId:', parentId, filteredCategories);

        return filteredCategories.map((category, index) => {
            const isParent = category.parentID === null; // Check if it's a main category

            return (
                <Fragment key={category.id}>
                    <Draggable key={category.id} draggableId={`category-${category.id}`} index={index}>
                        {(provided) => (
                            <tr
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="text-[12px] bg-gray-100 h-8 border-b w-full dark:bg-gray-700 dark:border-gray-700 cursor-pointer"
                                onClick={() => toggleCategory(category.categoryName)}
                                onContextMenu={(e) => handleRightClick(e, category)}
                                onDoubleClick={() => toggleEditing(category.id)}
                            >
                                <td
                                    className={"px-2 py-2 w-40 text-[12px] font-semibold text-gray-700 dark:text-gray-300 relative"}
                                    style={{ paddingLeft: `${level * 40}px` }}
                                >
                                    {editingCategories[category.id] || category.categoryName === '' ? (
                                        <div className="flex items-center">
                                            <input
                                                type="text"
                                                className="w-full bg-transparent border-b border-gray-300 focus:outline-none text-[12px] w-28 h-6"
                                                value={categoryInputs[category.id] || ''}
                                                onChange={(e) => handleInputChange(category.id, e.target.value)}
                                                onBlur={() => handleSaveCategoryName(category.id, categoryInputs[category.id] || '')}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleSaveCategoryName(category.id, categoryInputs[category.id] || '');
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
                            </tr>
                        )}
                    </Draggable>

                    {expandedCategories[category.categoryName] && (
                        <Droppable droppableId={`subcategory-${category.id}`} type="SUBCATEGORY">
                            {(provided) => (
                                <tbody ref={provided.innerRef} {...provided.droppableProps}>
                                    {renderCategories(category.id, level + 1)}
                                    {provided.placeholder}
                                </tbody>
                            )}
                        </Droppable>
                    )}
                </Fragment>
            );
        });
    };

    const onDragEnd = (result) => {
        const { source, destination, draggableId, type } = result;

        if (!destination) return;

        if (type === 'SUBCATEGORY') {
            // Logic for moving subcategories
            const updatedCategories = Array.from(cashflowCategoriesData);
            const [movedItem] = updatedCategories.splice(source.index, 1);
            updatedCategories.splice(destination.index, 0, movedItem);

            // Update Firestore and state
            setCashflowCategoriesData(updatedCategories);
            updateFirestoreOrder(updatedCategories); // Firestore batch update function
        } else {
            // Logic for moving main categories
            const updatedMainCategories = Array.from(cashflowCategoriesData.filter(cat => cat.parentID === null));
            const [movedItem] = updatedMainCategories.splice(source.index, 1);
            updatedMainCategories.splice(destination.index, 0, movedItem);

            // Update Firestore and state
            setCashflowCategoriesData(updatedMainCategories);
            updateFirestoreOrder(updatedMainCategories); // Firestore batch update function
        }
    };

    // Firestore batch update to handle reordering
    const updateFirestoreOrder = async (categories) => {
        const batch = db.batch();

        categories.forEach((category, index) => {
            const docRef = doc(db, 'cashflow', cashflowId, 'categories', category.id);
            batch.update(docRef, { order: index });
        });

        await batch.commit();
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
                            <DragDropContext onDragEnd={onDragEnd}>
                                {cashflowCategoriesData.map((category) => (
                                    <Droppable key={category.id} droppableId={`category-${category.id}`}>
                                        {(provided) => (
                                            <tbody
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                            >
                                                {renderCategories(null)}
                                                {provided.placeholder}
                                            </tbody>
                                        )}
                                    </Droppable>
                                ))}
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
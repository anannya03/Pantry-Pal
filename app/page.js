'use client'
import React, { useState, useEffect, useRef } from "react";
import { Camera } from 'react-camera-pro';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, updateDoc } from "firebase/firestore"; 
import { db } from "./firebase";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { OpenAI } from 'openai';
require("dotenv").config();
import './spinner.css';

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const classifyImage = async (imageData) => {
  const response = await fetch('/api/classifyImage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageData }),
  });

  if (!response.ok) {
    console.error('Error with API response:', response.statusText);
    return null;
  }

  const result = await response.json();
  return result.label;
};

export default function Home() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [searchItem, setSearchItem] = useState('');
  const [view, setView] = useState('list'); // 'list', 'camera', or 'recipe'
  const cameraRef = useRef(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state

  // Add items to database
  const addItem = async (e) => {
    e.preventDefault();
    if (newItem.name !== '' && newItem.quantity !== '') {
      try {
        await addDoc(collection(db, 'items'), {
          name: newItem.name.trim(),
          quantity: parseInt(newItem.quantity.trim(), 10),
        });
        setNewItem({ name: '', quantity: '' });
        toast.success(`Added ${newItem.name} to pantry.`, {
          autoClose: 5000,
        });
      } catch (error) {
        console.error("Error adding item:", error);
        toast.error("Could not add item to pantry.", {
          autoClose: 5000,
        });
      }
    }
  };

  const addImageItem = async (name) => {
    if (name !== '') {
      try {
        await addDoc(collection(db, 'items'), {
          name: name.trim(),
          quantity: 1,
        });
        toast.success(`Identified ${name} and added it to pantry.`, {
          autoClose: 5000,
        });
      } catch (error) {
        console.error("Error adding image item:", error);
        toast.error("Could not add image item to pantry.", {
          autoClose: 5000,
        });
      }
    }
  };

  // Read data from database
  useEffect(() => {
    const q = query(collection(db, 'items'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let itemsArray = [];
      querySnapshot.forEach((doc) => {
        itemsArray.push({ ...doc.data(), id: doc.id, quantity: parseInt(doc.data().quantity, 10) });
      });
      setItems(itemsArray);
    });
    return () => unsubscribe();
  }, []);

  // Delete data from database
  const deleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, 'items', id));
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Could not delete item from pantry.", {
        autoClose: 5000,
      });
    }
  };

  // Edit data
  const saveQuantity = async (id) => {
    const itemToUpdate = items.find(item => item.id === id);
    try {
      await updateDoc(doc(db, 'items', id), {
        quantity: itemToUpdate.quantity,
      });
      setEditingItem(null);
    } catch (error) {
      console.error("Error updating item quantity:", error);
      toast.error("Could not update item quantity.", {
        autoClose: 5000,
      });
    }
  };

  const updateQuantity = (id, newQuantity) => {
    setItems(items.map(item => item.id === id ? { ...item, quantity: parseInt(newQuantity, 10) } : item));
    setEditingItem(id);
  };

  const handleRecipeClick = () => {
    setLoading(true);
    findRecipes();
    setView('recipe');
  }

  // Helper function to convert Data URL to Blob
  const dataURLToBlob = (dataURL) => {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      const imageSrc = cameraRef.current.takePhoto();
      const imageBlob = dataURLToBlob(imageSrc);

      const reader = new FileReader();
      reader.readAsDataURL(imageBlob);
      reader.onloadend = async () => {
        const base64data = reader.result;
        console.log('Captured image data:', base64data);
        const classifiedText = await classifyImage(base64data);
        if (classifiedText && classifiedText.toLowerCase() !== 'false') {
          await addImageItem(classifiedText);
          setView('list'); // Switch back to list view after capturing and classifying the image
        } else {
          toast.error("Could not classify the image.", {
            autoClose: 5000,
          });
        }
      };
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchItem.toLowerCase())
  );

  // Recipe Finder function
  // const findRecipes = async () => {
  //   const itemNames = items.map(item => item.name).join(', ');
  //   const prompt = `Suggest some recipes that can be made using the following ingredients: ${itemNames}`;

  //   try {
  //     const response = await openai.chat.completions.create({
  //       model: "gpt-4",
  //       messages: [
  //         { role: "system", content: "You are a helpful assistant." },
  //         { role: "user", content: prompt }
  //       ],
  //       max_tokens: 4000,
  //       temperature: 0.7
  //     });

  //     const recipesText = response.choices[0].message.content;
  //     const recipesArray = parseRecipes(recipesText);
  //     setRecipes(recipesArray);
  //   } catch (error) {
  //     console.error('Error fetching recipes:', error);
  //     toast.error("Could not fetch recipes.", {
  //       autoClose: 5000,
  //     });
  //   }
  // };

  // // Function to parse the response content into individual recipes
  // const parseRecipes = (text) => {
  //   const recipeArray = text.split('\n\n').filter(recipe => recipe.trim() !== '');
  //   return recipeArray.map(recipe => {
  //     const [title, ...details] = recipe.split('\n');
  //     return { title, details: details.join('\n') };
  //   });
  // };

    // Recipe Finder function
    const findRecipes = async () => {
      const itemNames = items.map(item => item.name).join(', ');
      const prompt = `Suggest some recipes that can be made using the following ingredients: ${itemNames}`;
  
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt }
          ],
          max_tokens: 4000,
          temperature: 0.7
        });
  
        const recipesText = response.choices[0].message.content;
        const recipesArray = parseRecipes(recipesText);
        setRecipes(recipesArray);
      } catch (error) {
        console.error('Error fetching recipes:', error);
        toast.error("Could not fetch recipes.", {
          autoClose: 5000,
        });
      } finally {
        setLoading(false); // Set loading state to false
      }
    };
  
    // Function to parse the response content into individual recipes
    const parseRecipes = (text) => {
      const recipeArray = text.split('###').filter(recipe => recipe.trim() !== '');
      return recipeArray
        .map(recipe => {
          const nameMatch = recipe.match(/(\d+\.)(.*)/);
          const name = nameMatch ? nameMatch[2].trim() : "";
          const ingredientsMatch = recipe.match(/(?<=\*\*Ingredients:\*\*).+?(?=\*\*Instructions:\*\*)/s);
          const ingredients = ingredientsMatch ? ingredientsMatch[0].trim() : "";
          const instructionsMatch = recipe.match(/(?<=\*\*Instructions:\*\*).+/s);
          const instructions = instructionsMatch ? instructionsMatch[0].trim() : "";
          return { name, ingredients, instructions };
        })
        .filter(recipe => recipe.name && recipe.ingredients && recipe.instructions);
    };

  return (
    <div>
      <ToastContainer/>
      <main className="flex bg-black min-h-screen flex-col items-center justify-between p-14 pt-4 sm:p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-oswald text-sm">
          <h1 className="text-6xl p-4 pt-0 mt-1 mb-4 text-center text-bert">Pantry Pal</h1>
          <p className="text-pink-950 text-center text-lg font-medium mb-6 p-4 pt-0">Welcome to Pantry Pal: your kitchen's new best friend! <br/> Snap, track, and cook with ease—organizing your pantry has never been this fun!</p>
          <div className="flex justify-center mb-4 mt-2">
            <button
              onClick={() => setView('list')}
              className={`text-base p-2 rounded hover:bg- ${view === 'list' ? 'bg-torquiose text-pink-950' : 'bg-bert text-white'} mr-4`}
            >
              Pantry List
            </button>
            <button
              onClick={() => setView('camera')}
              className={`text-base p-2 rounded ${view === 'camera' ? 'bg-torquiose text-pink-950' : 'bg-bert text-white'} mr-4`}
            >
              Click Image
            </button>
            <button
              onClick={() => handleRecipeClick()}
              className={`text-base p-2 rounded ${view === 'recipe' ? 'bg-torquiose text-pink-950' : 'bg-bert text-white'} mr-4`}
            >
              Recipe Finder
            </button>
          </div>

          {view === 'list' && (
            <>
              <div className="flex justify-center mb-4">
                <input
                  className="w-1/2 p-3 mb-4 border-light-grey bg-pinkk text-kohl rounded outline-none"
                  type="text"
                  placeholder="Search Item"
                  value={searchItem}
                  onChange={(event) => setSearchItem(event.target.value)}
                />
              </div>

              <div className="bg-pinkk p-4 rounded">
                <form className="grid grid-cols-6 items-center font-sans" onSubmit={addItem}>
                  <input
                    className="col-span-3 p-3 border-light-grey bg-white text-kohl outline-none"
                    type="text"
                    placeholder="Enter Item"
                    value={newItem.name}
                    onChange={(event) => setNewItem({ ...newItem, name: event.target.value })}
                  />
                  <input
                    className="col-span-2 p-3 border-light-grey bg-white mx-4 text-kohl outline-none"
                    type="number"
                    placeholder="Quantity"
                    value={newItem.quantity}
                    onChange={(event) => setNewItem({ ...newItem, quantity: event.target.value })}
                  />
                  <button
                    className="text-lg bg-bert border-torquiose text-black p-3 rounded hover:bg-torquiose"
                    type="submit"
                  >
                    Add
                  </button>
                </form>

                <ul>
                  {filteredItems.map((item, id) => (
                    <li key={id} className="my-4 w-full bg-black flex justify-between items-center font-outfit text-base">
                      <div className="p-2 w-full flex justify-between items-center md:ml-10">
                        <span className="capitalize text-pink-950 font-semibold">{item.name}</span>
                        <div className="flex items-center space-x-12 md:mr-24">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="text-black bg-bert p-2 rounded-full hover:bg-torquiose"
                          >
                            -
                          </button>
                          <span className="text-pink-950">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="text-black bg-bert p-2 rounded-full hover:bg-torquiose"
                          >
                            +
                          </button>
                          {editingItem === item.id && (
                            <button onClick={() => saveQuantity(item.id)} className="text-2xl">
                              ✅
                            </button>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="ml-8 text-pink-950 p-2 border-l-2 border-pink-950 hover:bg-pink-950 w-16 hover:text-torquiose"
                      >
                        x
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {view === 'camera' && (
            <div className="bg-pinkk p-4 rounded mb-4">
                <Camera style={{ height: '200px', width: '100%' }} ref={cameraRef} aspectRatio={16 / 9} />
              <button
                onClick={capturePhoto}
                className="text-lg bg-bert border-torquiose text-black p-3 rounded hover:bg-torquiose mt-4"
              >
                Capture Photo
              </button>
            </div>
          )}

{view === 'recipe' && (
            <div>
              {loading ? (
                <div className="flex justify-center items-center mt-10">
                  <div className="spinner flex justify-center"></div> {/* Loading spinner */}
                </div>
              ) : recipes.length > 0 ?
                 (
                  <div className="mt-4 bg-pinkk p-4 rounded">
                    <h2 className="text-4xl mb-4 text-center text-bert">Recipe Suggestions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recipes.map((recipe, index) => (
                        <div key={index} className="bg-black p-4 rounded shadow-md">
                          <h3 className="text-xl font-bold mb-2 text-pink-950">{recipe.name}</h3>
                          <p className="text-torquiose"><strong>Ingredients:</strong></p>
                          <p className="text-kohl whitespace-pre-wrap mb-2">{recipe.ingredients}</p>
                          <p className="text-torquiose"><strong>Instructions:</strong></p>
                          <p className="text-kohl whitespace-pre-wrap mb-2">{recipe.instructions}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 bg-pinkk p-4 rounded">
                    <p className="text-xl text-center text-bert">Could not find any recipes in this search. Please try again.</p>
                  </div>
                )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}


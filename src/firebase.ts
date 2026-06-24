import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  query,
  orderBy
} from "firebase/firestore";
import { ShoppingList, AppCategory } from "./types";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID from config
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

export { db };

// --- SHOPPING LISTS FIRESTORE HANDLERS ---

/**
 * Subscribes to real-time updates for shopping lists in Firestore, ordered by creation/launch date.
 * Falls back gracefully to local list if database query fails or is empty.
 */
export function listenShoppingLists(onUpdate: (lists: ShoppingList[]) => void) {
  const listsCollection = collection(db, "lists");
  
  return onSnapshot(listsCollection, (snapshot) => {
    const lists: ShoppingList[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as ShoppingList;
      lists.push(data);
    });
    
    // Sort in-memory to ensure correct chronological sorting if timestamp varies
    // We want lists sorted descending by their id or timestamp (newest first)
    lists.sort((a, b) => b.id.localeCompare(a.id));
    
    onUpdate(lists);
  }, (error) => {
    console.error("Erro ao escutar listas do Firestore:", error);
  });
}

/**
 * Saves or updates a single shopping list in Firestore
 */
export async function saveShoppingList(list: ShoppingList) {
  try {
    const docRef = doc(db, "lists", list.id);
    await setDoc(docRef, list);
  } catch (error) {
    console.error(`Erro ao salvar lista ${list.id} no Firestore:`, error);
    throw error;
  }
}

/**
 * Deletes a single shopping list from Firestore
 */
export async function deleteShoppingList(id: string) {
  try {
    const docRef = doc(db, "lists", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Erro ao excluir lista ${id} do Firestore:`, error);
    throw error;
  }
}

/**
 * Deletes multiple shopping lists in a batch
 */
export async function deleteShoppingLists(ids: string[]) {
  try {
    const batch = writeBatch(db);
    ids.forEach((id) => {
      const docRef = doc(db, "lists", id);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (error) {
    console.error("Erro ao excluir múltiplas listas no Firestore:", error);
    throw error;
  }
}

/**
 * Saves multiple shopping lists in batch (useful for imports)
 */
export async function saveMultipleShoppingLists(lists: ShoppingList[]) {
  try {
    const batch = writeBatch(db);
    lists.forEach((list) => {
      const docRef = doc(db, "lists", list.id);
      batch.set(docRef, list);
    });
    await batch.commit();
  } catch (error) {
    console.error("Erro ao salvar múltiplas listas em lote no Firestore:", error);
    throw error;
  }
}


// --- CATEGORIES FIRESTORE HANDLERS ---

/**
 * Subscribes to real-time updates for app categories in Firestore
 */
export function listenCategories(onUpdate: (categories: AppCategory[]) => void) {
  const categoriesCollection = collection(db, "categories");
  
  return onSnapshot(categoriesCollection, (snapshot) => {
    const categories: AppCategory[] = [];
    snapshot.forEach((doc) => {
      categories.push(doc.data() as AppCategory);
    });
    
    // Sort categories alphabetically or by code
    categories.sort((a, b) => a.code.localeCompare(b.code));
    
    onUpdate(categories);
  }, (error) => {
    console.error("Erro ao escutar categorias do Firestore:", error);
  });
}

/**
 * Saves or updates a category in Firestore
 */
export async function saveCategory(category: AppCategory) {
  try {
    const docRef = doc(db, "categories", category.id);
    await setDoc(docRef, category);
  } catch (error) {
    console.error(`Erro ao salvar categoria ${category.id} no Firestore:`, error);
    throw error;
  }
}

/**
 * Deletes a category from Firestore
 */
export async function deleteCategory(id: string) {
  try {
    const docRef = doc(db, "categories", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Erro ao excluir categoria ${id} do Firestore:`, error);
    throw error;
  }
}

/**
 * Resets or seeds default categories in batch
 */
export async function saveMultipleCategories(categories: AppCategory[]) {
  try {
    const batch = writeBatch(db);
    categories.forEach((category) => {
      const docRef = doc(db, "categories", category.id);
      batch.set(docRef, category);
    });
    await batch.commit();
  } catch (error) {
    console.error("Erro ao salvar categorias em lote no Firestore:", error);
    throw error;
  }
}


// --- SETTINGS FIRESTORE HANDLERS ---

interface BudgetSettings {
  monthlyIncome: number;
  monthlyLimit: number;
}

/**
 * Subscribes to real-time updates for budget/financial settings in Firestore
 */
export function listenSettings(onUpdate: (settings: BudgetSettings) => void) {
  const docRef = doc(db, "settings", "main");
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as BudgetSettings);
    }
  }, (error) => {
    console.error("Erro ao escutar configurações de orçamento do Firestore:", error);
  });
}

/**
 * Saves budget/financial settings to Firestore
 */
export async function saveSettings(settings: BudgetSettings) {
  try {
    const docRef = doc(db, "settings", "main");
    await setDoc(docRef, settings);
  } catch (error) {
    console.error("Erro ao salvar configurações de orçamento no Firestore:", error);
    throw error;
  }
}

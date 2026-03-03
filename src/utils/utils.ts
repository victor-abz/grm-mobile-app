import { ToastAndroid } from 'react-native';

export const citizenTypes = [
    "Une organisation au nom d'un citoyen",
    "Un citoyen au nom d'un autre",
    "Un plaignant",
    "Un plaigant"
]

/**
 * Compares two IDs for equivalence by removing all non-digit characters and checking if the resulting strings are equal.
 *
 * @param {string|number} id1 - The first ID to compare.
 * @param {string|number} id2 - The second ID to compare.
 * @returns {boolean} True if the digit-only representations of both IDs are equal, false otherwise.
 */
export const compareIdsEquivalence = (id1, id2) =>
    String(id1).replace(/[^a-zA-Z0-9-]/g, '') === String(id2).replace(/[^a-zA-Z0-9-]/g, '');

export const showToast = (message) =>
{
  ToastAndroid.show(message, ToastAndroid.SHORT);
};

export const parseJson = (jsonString: string | null): any => {
  try {
    return jsonString ? JSON.parse(jsonString) : null;
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    return jsonString;
  }
};
/**
 * Removes duplicates from two lists and returns a new list with unique items.
 *
 * @param {any[]} listA - The first list to remove duplicates from.
 * @param {any[]} listB - The second list to remove duplicates from.
 * @returns {any[]} A new list with unique items.
 */
export function removeDuplicates(listA, listB) {
  const array = [...listA, ...listB];
  const uniqueArray = array.filter(
    (item, index, self) => index === self.findIndex((t) => String(t.id) === String(item.id))
  );
  return uniqueArray;
}

/**
 * Removes duplicates from two lists and returns a new list with unique items.
 *
 * @param {any[]} listA - The first list to remove duplicates from.
 * @param {any[]} listB - The second list to remove duplicates from.
 * @returns {any[]} A new list with unique items.
 */
export function removeDuplicatesOptimized(listA, listB) {
  const array = [...listA, ...listB];
  const uniqueArray = new Set(array.map((item) => item));
  return Array.from(uniqueArray);
}

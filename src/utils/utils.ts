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

import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

/**
 * Adds a user to firestore
 * @param {*} db 
 * @param {*} user 
 * @param {*} firstName 
 * @param {*} lastName 
 * @return {Promise} user
 */
export const AddUserToDB = (
  db, user, firstName, lastName="", displayName="", authProvider="local",
) => {
  return addDoc(collection(db, 'users'), {
    uid: user.uid,
    firstName,
    lastName,
    authProvider,
    email: user.email,
    displayName,
  });
}

/**
 * Gets a user from the database
 * @param {*} db 
 * @param {*} uid 
 * @returns User
 */
export const GetUserFromDB = async (db, uid) => {
  const q = query(collection(db, 'users'), where('uid', '==', uid));
  const matchingDocs = await getDocs(q);
  const docs = [];
  matchingDocs.forEach((doc) => docs.push(doc));
  return docs[0]?.data();
}
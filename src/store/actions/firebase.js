import app from 'firebase/app';
import * as FIREBASE from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/functions';
import 'firebase/storage';

const SIGNIN_LOADING_BEGIN = 'SIGNIN_LOADING_BEGIN';
const SIGNIN_LOADING_END = 'SIGNIN_LOADING_END';
const SIGNIN_ERROR = 'SIGNIN_ERROR';
const DONE_PASSW_RESET = 'DONE_PASSW_RESET';
const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
const VIEWED_USER_INFO_LOADING = 'VIEWED_USER_INFO_LOADING';
const VIEWED_USER_INFO_LOADED = 'VIEWED_USER_INFO_LOADED';
const NAVBAR_USER_INFO_LOADING = 'NAVBAR_USER_INFO_LOADING';
const NAVBAR_USER_INFO_LOADED = 'NAVBAR_USER_INFO_LOADED';
const CLEAR_VIEWED_USER_INFO = 'CLEAR_VIEWED_USER_INFO';
const UPDATE_USER_INFO_BEGIN = 'UPDATE_USER_INFO_BEGIN';
const USER_INFO_UPDATED = 'USER_INFO_UPDATED';

// ИНИЦИАЛИЗАЦИЯ FIREBASE
export function firebaseInit() {
   return async (dispatch, getState) => {
      const { firebase } = getState();
      app.initializeApp(firebase.firebaseConfig);
      const auth = app.auth();
      const db = app.firestore();
      const functions = app.functions();
      const storage = app.storage();
      const storageRef = storage.ref();
      const usersPhotoRef = storageRef.child('usersPhoto');
      const defaultUserRef = usersPhotoRef.child('default');

      dispatch({
         type: 'INIT',
         payload: { auth, db, functions, storage, storageRef, usersPhotoRef, defaultUserRef }
      });
   };
}

// ПРОВЕРКА ВХОДА В АККАУНТ
export function startAuthStateChangeCheck() {
   return async (dispatch, getState) => {
      const { firebase } = getState();
      firebase.auth.onAuthStateChanged((authUser) => {
         if (authUser !== null) {
            dispatch({ type: 'CHANGE_AUTH_USER', payload: { authUser } });
            dispatch(getNavbarInfo());
         } else dispatch({ type: 'CHANGE_AUTH_USER', payload: { authUser: null } });
      });
   };
}

// РЕГИСТРАЦИЯ НОВОГО ПОЛЬЗОВАТЕЛЯ ПО ПОЧТЕ И ПАРОЛЮ

function searchStringInArray(str, strArray) {
   for (var j = 0; j < strArray.length; j++) {
      if (strArray[j].match(str)) return true;
   }
   return false;
}

export const doCreateUserWithEmailAndPassword = (login, name, surname, email, password) => {
   return async (dispatch, getState) => {
      const { firebase } = getState();
      try {
         dispatch({ type: SIGNIN_LOADING_BEGIN });
         var docRef = firebase.db.collection('loginsList').doc('logins');
         docRef
            .get()
            .then(async function(doc) {
               const loginList = doc.data().loginList;
               if (searchStringInArray(login, loginList)) {
                  dispatch({ type: SIGNIN_LOADING_END });
                  dispatch({
                     type: SIGNIN_ERROR,
                     payload: { text: 'Пользователь с таким логином уже существует' }
                  });
               } else {
                  await firebase.auth.createUserWithEmailAndPassword(email, password);
                  const saveNewLogin = firebase.functions.httpsCallable('saveLogin');
                  const saveResult = await saveNewLogin({ email: email, login: login });
                  dispatch(doSignOut());
                  await firebase.auth.signInWithEmailAndPassword(email, password);
                  console.log(saveResult);
                  const setInitialValues = firebase.functions.httpsCallable('setInitialInfo');
                  const initialResult = await setInitialValues({
                     email,
                     login,
                     name,
                     surname
                  });

                  console.log(initialResult);

                  dispatch({ type: SIGNIN_LOADING_END });
                  dispatch({ type: LOGIN_SUCCESS });
                  var user = firebase.auth.currentUser;

                  user
                     .sendEmailVerification()
                     .then(function() {
                        // Email sent.
                     })
                     .catch(function(error) {
                        // An error happened.
                        console.log(error);
                     });
               }
            })
            .catch(function(error) {
               dispatch({ type: SIGNIN_LOADING_END });
               dispatch({
                  type: SIGNIN_ERROR,
                  payload: {
                     text:
                        error.code === 'auth/email-already-in-use'
                           ? 'Эта почта уже используется другим аккаунтом'
                           : 'Проверьте интернет-соединение'
                  }
               });
            });
      } catch (e) {}
   };
};

// ВХОД ПО ПОЧТЕ И ПАРОЛЮ
export function doSignInWithEmailAndPassword(email, password) {
   return async (dispatch, getState) => {
      dispatch({ type: SIGNIN_LOADING_BEGIN });
      const { firebase } = getState();

      try {
         await firebase.auth.signInWithEmailAndPassword(email, password);

         dispatch({ type: LOGIN_SUCCESS });
         dispatch({ type: SIGNIN_LOADING_END });
      } catch (error) {
         dispatch({ type: SIGNIN_LOADING_END });
         dispatch({
            type: SIGNIN_ERROR,
            payload: {
               text:
                  error.code === 'auth/user-not-found'
                     ? 'Пользователь с этой почтой не найден'
                     : error.code === 'auth/wrong-password'
                     ? 'Введён не верный пароль'
                     : 'Проверьте интернет-соединение'
            }
         });
      }
   };
}

// ВХОД АДМИНА
export function doSignInAdmin(email, password) {
   return async (dispatch, getState) => {
      dispatch({ type: SIGNIN_LOADING_BEGIN });
      try {
         const { firebase } = getState();
         await firebase.auth.signInWithEmailAndPassword(email, password);
         const idTokenResult = await firebase.auth.currentUser.getIdTokenResult();
         if (idTokenResult.claims.admin === true) {
            const getAdminStatus = firebase.functions.httpsCallable('getAdminStatus');
            const getStatusResult = await getAdminStatus({ email });
            console.log(getStatusResult);

            const credential = FIREBASE.auth.EmailAuthProvider.credential(email, password);
            await firebase.auth.currentUser.reauthenticateWithCredential(credential);

            dispatch({ type: LOGIN_SUCCESS });
         } else {
            dispatch(doSignOut());
            dispatch({
               type: SIGNIN_ERROR,
               payload: {
                  text: 'Проверьте вводимые данные'
               }
            });
         }
         dispatch({ type: SIGNIN_LOADING_END });
      } catch (error) {
         console.log(error);
         dispatch({ type: SIGNIN_LOADING_END });
         dispatch({
            type: SIGNIN_ERROR,
            payload: {
               text: 'Проверьте интернет-соединение'
            }
         });
      }
   };
}

// ВЫХОД
export const doSignOut = () => {
   return async (dispatch, getState) => {
      const { firebase } = getState();
      const idTokenResult = await firebase.auth.currentUser.getIdTokenResult();
      if (idTokenResult.claims.loggedAsAdmin === true) {
         const clearAdminStatus = firebase.functions.httpsCallable('clearAdminStatus');
         const clearAdminStatusResults = await clearAdminStatus({
            email: firebase.auth.currentUser.email
         });
         console.log(clearAdminStatusResults);
      }
      await firebase.auth.signOut();

      dispatch({ type: 'SIGN_OUT' });
   };
};

// ОТПРАВКА ЗАЯВКИ НА ПОЧТУ ДЛЯ СМЕНЫ ПАРОЛЯ
export const doPasswordReset = (email) => {
   return (dispatch, getState) => {
      dispatch({ type: SIGNIN_LOADING_BEGIN });
      const { firebase } = getState();
      firebase.auth
         .sendPasswordResetEmail(email)
         .then(function() {
            dispatch({ type: DONE_PASSW_RESET });
            dispatch({ type: SIGNIN_LOADING_END });
         })
         .catch(function(error) {
            dispatch({ type: SIGNIN_LOADING_END });
            dispatch({
               type: SIGNIN_ERROR,
               payload: {
                  text:
                     error.code === 'auth/user-not-found'
                        ? 'Не найден пользователь с введённой почтой'
                        : 'Проверьте интернет-соединение'
               }
            });
         });
   };
};

// ДОБАВЛЕНИЕ НОВОГО АДМИНИСТРАТОРА
export function addNewAdmin(email) {
   return async (dispatch, getState) => {
      const { firebase } = getState();
      try {
         const addNewAdmin = firebase.functions.httpsCallable('addAdmin');
         const result = await addNewAdmin({ email: email });
         console.log(result);
      } catch (e) {
         console.log(e);
      }
   };
}

export function areYouAdmin() {
   return (dispatch, getState) => {
      const { firebase } = getState();

      firebase.auth.currentUser.getIdTokenResult().then((idTokenResult) => {
         console.log(idTokenResult);
         if (idTokenResult.claims.admin === true) return true;
         else return false;
      });
   };
}

export function reAuthenticate(password) {
   return async (dispatch, getState) => {
      const { firebase } = getState();
      try {
         const user = firebase.auth.currentUser;

         const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);

         await user
            .reauthenticateWithCredential(credential)
            .then(function() {
               console.log('User re-authenticated.');
            })
            .catch(function(error) {
               console.log(error);
            });
      } catch (e) {
         console.log(e);
      }
   };
}

// ЗАГРУЗКА ИНФЫ О ПОЛЬЗОВАТЕЛЕ В NAVBAR
export function getNavbarInfo() {
   return (dispatch, getState) => {
      const { firebase } = getState();
      dispatch({ type: NAVBAR_USER_INFO_LOADING });

      firebase.auth.currentUser.getIdTokenResult().then(async (idTokenResult) => {
         const openInfo = await firebase.db
            .collection('usersOpen')
            .doc(idTokenResult.claims.login)
            .get();

         if (openInfo.data().photo.length !== 0) {
            firebase.storageRef
               .child(`usersPhoto/${idTokenResult.claims.login}/thumb@64_photo.jpg`)
               .getDownloadURL()
               .then(function(url) {
                  dispatch({
                     type: NAVBAR_USER_INFO_LOADED,
                     payload: {
                        openInfo: openInfo.data(),
                        userPhoto: url
                     }
                  });
               })
               .catch(function(error) {
                  console.log(error);
               });
         } else {
            dispatch({
               type: NAVBAR_USER_INFO_LOADED,
               payload: {
                  openInfo: openInfo.data(),
                  userPhoto: null
               }
            });
         }
      });
   };
}

// ПОЛУЧИТЬ ДАННЫЕ ДЛЯ ПРОСМАТРИВАЕМОГО ЛИЧНОГО КАБИНЕТА
export function getViewedUserInfo(login) {
   return (dispatch, getState) => {
      const { firebase } = getState();
      dispatch({ type: VIEWED_USER_INFO_LOADING });

      firebase.auth.currentUser.getIdTokenResult().then(async (idTokenResult) => {
         if (idTokenResult.claims.login === login) {
            const openInfo = await firebase.db
               .collection('usersOpen')
               .doc(login)
               .get();

            const secureInfo = await firebase.db
               .collection('usersSecure')
               .doc(login)
               .get();

            if (openInfo.data().photo.length !== 0) {
               firebase.storageRef
                  .child(`usersPhoto/${login}/thumb@200_photo.jpg`)
                  .getDownloadURL()
                  .then(function(url) {
                     dispatch({
                        type: VIEWED_USER_INFO_LOADED,
                        payload: {
                           openInfo: openInfo.data(),
                           secureInfo: secureInfo.data(),
                           userPhoto: url
                        }
                     });
                  })
                  .catch(function(error) {
                     // Handle any errors
                  });
            } else {
               dispatch({
                  type: VIEWED_USER_INFO_LOADED,
                  payload: {
                     openInfo: openInfo.data(),
                     secureInfo: secureInfo.data(),
                     userPhoto: null
                  }
               });
            }
         } else {
            const openInfo = await firebase.db
               .collection('usersOpen')
               .doc(login)
               .get();
            if (openInfo.data().photo.length !== 0) {
               firebase.storageRef
                  .child(`usersPhoto/${login}/thumb@200_photo.jpg`)
                  .getDownloadURL()
                  .then(function(url) {
                     dispatch({
                        type: VIEWED_USER_INFO_LOADED,
                        payload: { openInfo: openInfo.data(), secureInfo: null, userPhoto: url }
                     });
                  })
                  .catch(function(error) {
                     // Handle any errors
                  });
            } else {
               dispatch({
                  type: VIEWED_USER_INFO_LOADED,
                  payload: { openInfo: openInfo.data(), secureInfo: null, userPhoto: null }
               });
            }
         }
      });
   };
}

// ОЧИСТИТЬ ДАННЫЕ ПРОСМАТРИВАЕМОГО ЛИЧНОГО КАБИНЕТА
export function clearViewedUserInfo() {
   return (dispatch, getState) => {
      dispatch({ type: CLEAR_VIEWED_USER_INFO });
   };
}

// ИЗМЕНИТЬ ТЕКСТ О СЕБЕ
export function changeAboutYourself(text) {
   return (dispatch, getState) => {
      const { firebase } = getState();
      dispatch({ type: UPDATE_USER_INFO_BEGIN });

      firebase.auth.currentUser.getIdTokenResult().then(async (idTokenResult) => {
         await firebase.db
            .collection('usersOpen')
            .doc(idTokenResult.claims.login)
            .update({
               aboutYourself: text
            });
         const openInfo = await firebase.db
            .collection('usersOpen')
            .doc(idTokenResult.claims.login)
            .get();
         // const secureInfo = await firebase.db
         //    .collection('usersSecure')
         //    .doc(idTokenResult.claims.login)
         //    .get();
         dispatch({
            type: USER_INFO_UPDATED,
            payload: { viewedUserOpenInfo: openInfo.data() }
         });
      });
   };
}

// ЗАГРУЗИТЬ НОВОЕ ФОТО
export function uploadUserPhoto(imageBlob) {
   return (dispatch, getState) => {
      const { firebase } = getState();
      dispatch({ type: UPDATE_USER_INFO_BEGIN });

      firebase.auth.currentUser.getIdTokenResult().then(async (idTokenResult) => {
         var photoUserRef = firebase.storageRef.child(
            `usersPhoto/${idTokenResult.claims.login}/photo.jpg`
         );
         photoUserRef.put(imageBlob).then(async function(snapshot) {
            setTimeout(async () => {
               await firebase.db
                  .collection('usersOpen')
                  .doc(idTokenResult.claims.login)
                  .update({
                     photo: ['thumb@200_photo.jpg', 'thumb@128_photo.jpg', 'thumb@64_photo.jpg']
                  });

               const openInfo = await firebase.db
                  .collection('usersOpen')
                  .doc(idTokenResult.claims.login)
                  .get();

               firebase.storageRef
                  .child(`usersPhoto/${idTokenResult.claims.login}/thumb@200_photo.jpg`)
                  .getDownloadURL()
                  .then(function(url) {
                     dispatch({
                        type: USER_INFO_UPDATED,
                        payload: { viewedUserOpenInfo: openInfo.data(), viewedUserPhoto: url }
                     });
                  })
                  .catch(function(error) {
                     // Handle any errors
                     console.log(error);
                  });
            }, 5000);
         });
      });
   };
}

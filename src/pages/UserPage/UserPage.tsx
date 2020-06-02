import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { CircleSpinner } from 'react-spinners-kit';
import LogOut from '@components/LogOut';
import AboutYourSelf from '@components/AboutYourSelf';
import Routes from '@config/routes';
import NewPhotoPopup from '@components/NewPhotoPopup';
import { Route, Switch, withRouter } from 'react-router-dom';
import { Redirect } from 'react-router';

import styles from './style.module.scss';

import DefaultUserImg from '@img/user/defaultPhoto.png';
import UploadPhotoImg from '@img/user/uploadPhoto.png';

type UserProps = {
   match: any;
   auth: any;
   authUser: any;
   history: any;
   initialized: boolean;
};

const UserPage: React.FC<UserProps> = ({ match, auth, authUser, history, initialized }) => {
   const photoInput = useRef(null);

   const [checkYourAccount, setCheckYourAccount] = useState(false);

   const [loadingUserInfo, setLoadingUserInfo] = useState(true);

   const [showPhotoPopup, setShowPhotoPopup] = useState(false);

   const [photoFile, setPhotoFile] = useState<any>('');

   const isYourAccount = () => {
      if (auth.currentUser === null) return false;
      return auth.currentUser.getIdTokenResult().then((idTokenResult: any) => {
         if (idTokenResult.claims.login === match.params.login) {
            if (!auth.currentUser.emailVerified) {
               history.push(Routes.verifyMail);
            } else return true;
         } else {
            return false;
         }
      });
   };

   const getPhotoFromInput = (evt: any) => {
      var tgt = evt.target || window.event!.srcElement,
         files = tgt.files;
      if (FileReader && files && files.length) {
         var fr = new FileReader();
         fr.onload = function() {
            setPhotoFile(fr.result);
         };
         fr.readAsDataURL(files[0]);
      }
   };

   useEffect(() => {
      if (initialized) {
         setCheckYourAccount(isYourAccount());
      }
      // eslint-disable-next-line
   }, [initialized]);

   useEffect(() => {
      setLoadingUserInfo(false);
   }, [checkYourAccount]);

   if (loadingUserInfo) return <CircleSpinner size={21} color="#f2cb04" />;

   return (
      <div className={styles['userContainer']}>
         <div className={styles['userContainer__contentContainer']}>
            <div className={styles['topInfo']}>
               <div className={styles['topInfo__photo']}>
                  <img src={DefaultUserImg} className={styles['image']} alt="" />
                  {isYourAccount ? (
                     <>
                        <label
                           className={styles['uploadPhotoBtn']}
                           htmlFor="newPhoto"
                           onClick={() => setShowPhotoPopup(true)}>
                           <input
                              id="newPhoto"
                              type="file"
                              className={styles['input']}
                              accept="image/jpeg,image/png"
                              // @ts-ignore
                              onChange={getPhotoFromInput}
                              ref={photoInput}
                           />
                           <img src={UploadPhotoImg} alt="" className={styles['icon']} />
                        </label>
                        <NewPhotoPopup
                           photoFile={photoFile}
                           isShow={showPhotoPopup}
                           setPhotoFile={setPhotoFile}
                           setShowPhotoPopup={setShowPhotoPopup}
                        />
                     </>
                  ) : null}
               </div>

               <div className={styles['topInfo__text']}>
                  <div className={styles['top']}>
                     <span className={styles['name']}>Никита Поздняк</span>
                     <LogOut />
                  </div>
                  <span className={styles['role']}>читатель</span>
                  <div className={styles['mail']}>
                     <span className={styles['mark']}>Почта:</span>
                     <a href="mailto:nikita220800@mail.ru" className={styles['mail-link']}>
                        nikita220800@mail.ru
                     </a>
                  </div>
                  <div className={styles['aboutYourSelf']}>
                     <span className={styles['mark']}>О себе:</span>
                     <AboutYourSelf
                        isYourAccount={checkYourAccount}
                        info={
                           'Очень интересная информация, которой я хочу поделиться на этой странице'
                        }
                     />
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

// @ts-ignore
const mapStateToProps = ({ firebase }) => {
   return {
      ...firebase
   };
};
// @ts-ignore
export default withRouter(connect(mapStateToProps, null)(UserPage));

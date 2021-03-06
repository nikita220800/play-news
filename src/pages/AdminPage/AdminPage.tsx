import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import LogOut from '@components/LogOut';
import { useSelector, useDispatch } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { CircleSpinner } from 'react-spinners-kit';
import { getViewedUserInfo } from '@actions/firebase';
import Routes from '@config/routes';
import classNames from 'classnames';

import DefaultUserImg from '@img/user/defaultPhoto.png';

import styles from './style.module.scss';

type AdminProps = {
   match: any;
   history: any;
};

const AdminPage: React.FC<AdminProps> = ({ match, history }) => {
   const dispatch = useDispatch();
   const {
      auth,
      initialized,
      viewedUserLoading,
      viewedUserOpenInfo,
      viewedUserPhoto
   } = useSelector((state: any) => state.firebase);

   const [checkAdmin, setCheckAdmin] = useState(false);

   // Перед загрузкой провряется, является ли пользователь админом
   // и подтверждена ли у него почта (иначе происходит редирект на главную)
   const isAdmin = () => {
      if (auth.currentUser === null) return history.push(Routes.mainPage);
      return auth.currentUser.getIdTokenResult().then((idTokenResult: any) => {
         if (
            idTokenResult.claims.loggedAsAdmin !== true ||
            idTokenResult.claims.admin !== true ||
            match.params.login !== idTokenResult.claims.login ||
            !auth.currentUser.emailVerified
         ) {
            history.push(Routes.mainPage);
         } else setCheckAdmin(true);
      });
   };

   // Когда компонент загружен, начать проверку администратора
   useEffect(() => {
      if (initialized) {
         isAdmin();
      }
      // eslint-disable-next-line
   }, [initialized]);
   // Если пользователь - Админ, то получить его данные
   useEffect(() => {
      if (checkAdmin) {
         dispatch(getViewedUserInfo(match.params.login));
      }
      // eslint-disable-next-line
   }, [checkAdmin]);

   // Пока Админ не проверен и не загружены данные выводить экран загрузки
   if (!checkAdmin || viewedUserLoading)
      return (
         <div className={classNames(styles['userContainer'], styles['containerLoader'])}>
            <div
               className={classNames(styles['userContainer__contentContainer'], styles['loader'])}>
               <CircleSpinner size={40} color="#f2cb04" />{' '}
            </div>
         </div>
      );

   return (
      <>
         <Helmet>
            <title>Административная панель</title>
         </Helmet>
         <div className={styles['userContainer']}>
            <div className={styles['userContainer__contentContainer']}>
               <div className={styles['topInfo']}>
                  <div className={styles['topInfo__photo']}>
                     <img
                        src={viewedUserPhoto !== null ? viewedUserPhoto : DefaultUserImg}
                        className={styles['image']}
                        alt=""
                     />
                  </div>

                  <div className={styles['topInfo__text']}>
                     <div className={styles['top']}>
                        <span className={styles['name']}>
                           {viewedUserOpenInfo.name + ' ' + viewedUserOpenInfo.surname}
                        </span>
                        <LogOut />
                     </div>
                     <span className={styles['role']}>Админ</span>
                  </div>
               </div>
               <h2>Админ панель</h2> <span>(в разработке)</span>
            </div>
         </div>
      </>
   );
};

// @ts-ignore
export default withRouter(AdminPage);

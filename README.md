# Проект "Новостной сайт об игровой индустрии play-news.ru"

![Логотип](LOGO/logoReadme.png)

[Ссылка на дизайн проекта](https://www.figma.com/file/9QVqA5upcSyXHxjpETYZMf/Play-News?node-id=0%3A1 'Ссылка на дизайн проекта')

### Описание компонентов системы

В системе существуют следующие роли:

-  Администратор
-  Редактор
-  Неавторизированный пользователь
-  Зарегистрированный и авторизированный пользователь

В разработке используется библиотека **React.js** и база данных **Firebase**

Веб-приложение состоит из следующих страниц (глобальных компонентов):

| Страница    | Описание                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Login       | Страница для входа/регистрации в аккаунт пользователя, администратора (для администратора предусмотрена отдельная форма входа) |
| Info        | Страница с основной информацией о проекте                                                                                      |
| AdminPage   | Админ панель                                                                                                                   |
| UserPage    | Личный кабинет пользователя                                                                                                    |
| Main        | Главная страница со списком последних статей                                                                                   |
| ArticlePage | Страница с контеном открытой статьи                                                                                            |

Веб-приложение состоит из следующих компонентов React:

(Каждый компонент веб-приложения откомментирован)

| Компонент          | Описание                                                                                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AboutYourSelf      | Выводит в личном кабинете пользователя информацию в поле "О себе". Если пользователь находится в своем кабинете (и авторизован), то позволяет отредактировать информацию          |
| AlertPopup         | Выводит передаваемое в него сообщение (ошибку, уведомление и т д)                                                                                                                 |
| Editor             | Содержит форму для создания статьи (в том числе и экран для предварительного просмотра результата)                                                                                |
| Footer             | Футер сайта                                                                                                                                                                       |
| LoadMore           | Кнопка для подгрузки контента (загрузить больше статей или комментариев и т. д.)                                                                                                  |
| Logo               | Компонент с логотипом сайта (при нажатии отправляет на галнвую страницу)                                                                                                          |
| LogOut             | Кнопка выхода из личного кабинета                                                                                                                                                 |
| MainList           | Список со статьями (выводимые статьи меняются в зависимости от передаваемых параметров)                                                                                           |
| Navbar             | Главное меню сайта (адаптируется в зависимости от разрешения экрана)                                                                                                              |
| Profile (в Navbar) | Если пользователь авторизован, то содержит основную информацию об аккаунте, сслыку для перехода в личный кабинет и кнопку выхода, иначе предлагаетпользователю зарегистрироваться |
| NewPhotoPopup      | Форма для изменения основной фотографии профиля (встроенный редактор для обрезки фотографии и предпросмотр результата )                                                           |
| NewsSlider         | Слайдер со списком новостей                                                                                                                                                       |
| SideList           | Дополнительный список статей по категориям (распологается справа от MainList)                                                                                                     |
| UserMenu           | Меню пользователя в личном кабинете                                                                                                                                               |

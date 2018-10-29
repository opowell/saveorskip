import PageIndex from './pages/Index';
import ProfilePage from './pages/ProfilePage';
import ProfilesPage from './pages/ProfilesPage';
import AccountPage from './pages/AccountPage';
import ScrapersPage from './pages/ScrapersPage';

export default [
  {
    name: 'home',
    path: '/',
    component: PageIndex,
  },
  {
    path: '/profile/:id',
    component: ProfilePage,
    name: 'profile',
  },
  {
    path: '/profiles',
    component: ProfilesPage,
    name: 'profiles',
  },
  {
    path: '/scrapers',
    component: ScrapersPage,
    name: 'scrapers',
  },
  {
    path: '/account',
    component: AccountPage,
    name: 'account',
  },
];

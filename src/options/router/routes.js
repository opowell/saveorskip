import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ProfilesPage from './pages/ProfilesPage';
import AccountPage from './pages/AccountPage';
import ScrapersPage from './pages/ScrapersPage';
import SourcePage from './pages/SourcePage';
import LinkPage from './pages/LinkPage';
import ProfilePageLinks from './pages/ProfilePageLinks';
import ProfilePageSources from './pages/ProfilePageSources';

export default [
  {
    name: 'home',
    path: '/',
    component: HomePage,
  },
  {
    path: '/profile/:id',
    component: ProfilePage,
    name: 'profile',
  },
  {
    path: '/profile/:id/links',
    component: ProfilePageLinks,
    name: 'profileLinks',
  },
  {
    path: '/profile/:id/sources',
    component: ProfilePageSources,
    name: 'profileSources',
  },
  {
    path: '/profile/:profileId/sources/:sourceId',
    component: SourcePage,
    name: 'source',
  },
  {
    path: '/profile/:profileId/link/:linkId',
    component: LinkPage,
    name: 'link',
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

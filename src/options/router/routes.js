import Account from './pages/Account';
import Home from './pages/Home';
import Profile from './pages/Profile';
import ProfileLink from './pages/ProfileLink';
import ProfileLinks from './pages/ProfileLinks';
import ProfileSource from './pages/ProfileSource';
import ProfileSourceLink from './pages/ProfileSourceLink';
import ProfileSourceLinks from './pages/ProfileSourceLinks';
import ProfileSources from './pages/ProfileSources';
import Profiles from './pages/Profiles';
import Scrapers from './pages/Scrapers';

export default [
  {
    path: '/account',
    component: Account,
    name: 'account',
  },
  {
    name: 'home',
    path: '/',
    component: Home,
  },
  {
    path: '/profile/:id',
    component: Profile,
    name: 'profile',
  },
  {
    path: '/profile/:profileId/link/:linkId',
    component: ProfileLink,
    name: 'profileLink',
  },
  {
    path: '/profile/:id/links',
    component: ProfileLinks,
    name: 'profileLinks',
  },
  {
    path: '/profiles',
    component: Profiles,
    name: 'profiles',
  },
  {
    path: '/profile/:id/sources',
    component: ProfileSources,
    name: 'profileSources',
  },
  {
    path: '/profile/:profileId/sources/:sourceId',
    component: ProfileSource,
    name: 'profileSource',
  },
  {
    path: '/profile/:profileId/sources/:sourceId/links',
    component: ProfileSourceLinks,
    name: 'profileSourceLinks',
  },
  {
    path: '/profile/:profileId/sources/:sourceId/links/:linkId',
    component: ProfileSourceLink,
    name: 'profileSourceLink',
  },
  {
    path: '/scrapers',
    component: Scrapers,
    name: 'scrapers',
  },
];

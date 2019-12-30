import Settings from './pages/Settings';
import Home from './pages/Home';
import Link from './pages/Link';
import Links from './pages/Links';
import Profile from './pages/Profile';
import Profiles from './pages/Profiles';
import Source from './pages/Source';
import Sources from './pages/Sources';
import Scrapers from './pages/Scrapers';

export default [
  {
    path: '/settings',
    component: Settings,
    name: 'settings',
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
    component: Link,
    name: 'profileLink',
  },
  {
    path: '/profile/:id/links',
    component: Links,
    name: 'profileLinks',
  },
  {
    path: '/profiles',
    component: Profiles,
    name: 'profiles',
  },
  {
    path: '/profile/:id/sources',
    component: Sources,
    name: 'profileSources',
  },
  {
    path: '/profile/:profileId/sources/:sourceId',
    component: Source,
    name: 'profileSource',
  },
  {
    path: '/scrapers',
    component: Scrapers,
    name: 'scrapers',
  },
];

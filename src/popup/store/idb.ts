import store from './index';
import { openDB } from 'idb';

export async function setCurPage(payload: any) {
  if (payload == null) {
    return;
  }
  if (payload.id != null && payload.url == null) {
    payload.url = payload.id;
  }
  if (payload.title != null && payload.name == null) {
    payload.title = payload.name;
  }
}

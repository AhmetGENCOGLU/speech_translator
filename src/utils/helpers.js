import { localStorageFromToKey } from "../constants";

const setFromToInitialValues = (fromOrTo, val) =>
  JSON.parse(localStorage.getItem(localStorageFromToKey) || "{}")?.[fromOrTo] ??
  val;

export { setFromToInitialValues };

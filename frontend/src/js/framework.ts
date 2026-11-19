import { App } from '../../bindings/progress';

// The Go bindings are the source of truth. Do not gate on `window._wails`:
// @wailsio/runtime creates that object in a plain browser too, and Wails
// injects `_wails.flags` from the `didFinishNavigation` hook, which races
// `window.onload`. Instead, attempt the call; outside Wails the runtime
// request fails and callers fall back to sample data.
export async function customConfirm(message: string): Promise<boolean> {
  try {
    return await App.ConfirmDelete();
  } catch {
    return confirm(message);
  }
}

export async function saveFile(data: string) {
  try {
    await App.SaveJsonData(data);
  } catch (error) {
    // Plain browser: nothing to persist. Log anything else.
    if ((window as any)._wails?.flags) {
      console.error("Failed to save data", error);
    }
  }
}

export async function loadLocal(): Promise<string | null> {
  try {
    return await App.GetJsonData();
  } catch {
    return null;
  }
}

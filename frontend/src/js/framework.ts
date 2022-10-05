import { GetJsonData, SaveJsonData } from '../../wailsjs/go/main/App';

export async function customConfirm(message: string): Promise<boolean> {
  if (window.go) {
    return window.go.main.App.ConfirmDelete();
  } else {
    return confirm(message);
  }
}

export async function saveFile(data: string) {
  if (window.go) {
    return await SaveJsonData(data);
  } else {
    return;
  }
}

export async function loadLocal(): Promise<string> {
  if (window.go) {
    return await GetJsonData();
  } else {
    return JSON.stringify([]);
  }
}

export async function ensureFileExists(): Promise<void> {
  if (window.go) {
    return;
  } else {
    return;
  }
}

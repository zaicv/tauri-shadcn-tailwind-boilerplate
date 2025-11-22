// Tauri native API helpers
// Import from @tauri-apps/api (v1 style imports work in v2)
import { invoke } from '@tauri-apps/api/tauri';

export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
}

// Check if running in Tauri
export const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

// Get system information
export async function getSystemInfo(): Promise<SystemInfo | null> {
  if (!isTauri()) return null;
  try {
    return await invoke<SystemInfo>('get_system_info');
  } catch (error) {
    console.error('Failed to get system info:', error);
    return null;
  }
}

// Get app info
export async function getAppInfo(): Promise<string | null> {
  if (!isTauri()) return null;
  try {
    return await invoke<string>('get_app_info');
  } catch (error) {
    console.error('Failed to get app info:', error);
    return null;
  }
}

// Show native notification
export async function showNotification(title: string, body: string): Promise<void> {
  if (!isTauri()) {
    // Fallback to web notifications
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    return;
  }
  try {
    await invoke('show_notification', { title, body });
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}


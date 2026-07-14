export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST';
  body?: any;
  showLoading?: boolean;
  loadingMessage?: string;
}

/**
 * Global API wrapper to standardize requests to Next.js API Routes.
 * This function expects to be called within a context where `useFeedback`
 * could be manually triggered, or we handle feedback explicitly in components.
 * 
 * Since this is a pure function, it doesn't use hooks directly.
 * Components will pass their `showLoading`, `showSuccess`, `showError` callbacks if they want automatic feedback.
 */
export async function fetchApi<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {},
  feedback?: {
    showLoading?: (msg?: string) => void;
    showSuccess?: (msg?: string) => void;
    showError?: (msg?: string) => void;
    clear?: () => void;
  }
): Promise<ApiResponse<T>> {
  
  if (feedback?.showLoading && options.showLoading !== false) {
    feedback.showLoading(options.loadingMessage || 'Loading...');
  }

  try {
    const res = await fetch(`/api${endpoint}`, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data: ApiResponse<T> = await res.json();

    if (data.success) {
      if (feedback?.showSuccess && options.method !== 'GET') {
        feedback.showSuccess(data.message);
      } else if (feedback?.clear) {
        feedback.clear();
      }
      return data;
    } else {
      if (feedback?.showError) {
        feedback.showError(data.message || 'An error occurred');
      }
      return data;
    }
  } catch (error: any) {
    if (feedback?.showError) {
      feedback.showError(error.message || 'Network error');
    }
    return {
      success: false,
      message: error.message || 'Network error',
      code: 'NETWORK_ERROR',
    };
  }
}

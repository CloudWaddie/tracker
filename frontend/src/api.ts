const API_URL = "http://localhost:8000";

export interface Tracker {
  id: number;
  name: string;
  description?: string;
  config: any[];
  schedule_cron?: string;
  last_run_status?: string;
  last_run_at?: string;
  last_run_logs?: string;
  last_run_info?: any;
  is_active: boolean;
  created_at: string;
}

export interface TrackerCreate {
  name: string;
  description?: string;
  config: any[];
  schedule_cron?: string;
  is_active?: boolean;
}

export const getTrackers = async (): Promise<Tracker[]> => {
  const response = await fetch(`${API_URL}/trackers/`);
  if (!response.ok) {
    throw new Error("Failed to fetch trackers");
  }
  return response.json();
};

export const createTracker = async (tracker: TrackerCreate, adminKey: string): Promise<Tracker> => {
  const response = await fetch(`${API_URL}/trackers/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey,
    },
    body: JSON.stringify(tracker),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized: Invalid Admin Key");
    throw new Error("Failed to create tracker");
  }
  return response.json();
};

export const updateTracker = async (id: number, tracker: TrackerCreate, adminKey: string): Promise<Tracker> => {
  const response = await fetch(`${API_URL}/trackers/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey,
    },
    body: JSON.stringify(tracker),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized: Invalid Admin Key");
    throw new Error("Failed to update tracker");
  }
  return response.json();
};

export const runTracker = async (trackerId: number, adminKey: string): Promise<void> => {
  const response = await fetch(`${API_URL}/trackers/${trackerId}/run`, {
    method: "POST",
    headers: {
      "X-Admin-Key": adminKey,
    }
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized: Invalid Admin Key");
    throw new Error("Failed to run tracker");
  }
};

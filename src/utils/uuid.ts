// UUID generation utility to prevent ID collisions

export const generateUUID = (): string => {
  // Simple UUID v4 implementation for client-side
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Fallback for timestamp-based IDs with random suffix to prevent collisions
export const generateTimestampId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
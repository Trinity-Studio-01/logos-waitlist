// API configuration and helper functions

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
  // Waitlist endpoints
  async getAllSignups() {
    const response = await fetch(`${API_BASE_URL}/waitlist/all`);
    if (!response.ok) throw new Error('Failed to fetch signups');
    return response.json();
  },

  async getWaitlistCount() {
    const response = await fetch(`${API_BASE_URL}/waitlist/count`);
    if (!response.ok) throw new Error('Failed to fetch count');
    return response.json();
  },

  async exportToCSV() {
    const response = await fetch(`${API_BASE_URL}/waitlist/export`);
    if (!response.ok) throw new Error('Failed to export');
    return response.blob();
  }
};

export const downloadCSV = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

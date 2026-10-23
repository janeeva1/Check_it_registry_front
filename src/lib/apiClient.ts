// API Client for MySQL Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

function buildQuery(params: Record<string, any>): string {
  const q = new URLSearchParams();
  Object.keys(params).forEach(key => {
    const v = params[key];
    if (v !== undefined && v !== null && v !== '') q.append(key, String(v));
  });
  const qs = q.toString();
  return qs ? `?${qs}` : '';
}

interface User {
  id: string;
  name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email: string;
  role: string;
  region?: string;
  created_at: string;
}

export interface ProofType { key: string; label: string; hint: string }
export type OwnershipLevel = 'registered' | 'proof_submitted' | 'verified_owner' | 'disputed';
export interface OwnershipProof {
  id: string; proof_type: string; proof_label: string; file_url: string; note?: string | null;
  status: 'pending' | 'approved' | 'rejected'; review_note?: string | null; reviewed_at?: string | null; created_at: string;
}
export interface DeviceOwnership {
  deviceId: string; category: string; level: OwnershipLevel; verifiedAt: string | null;
  proofGroup: string; proofTypes: ProofType[]; proofs: OwnershipProof[];
  openDispute: { id: string; status: string; created_at: string } | null;
}
export interface ClaimableItem { brand: string; model: string; category: string; proofGroup: string; proofTypes: ProofType[] }

interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

class ApiClient {
  private token: string | null = null;
  private authCallback: ((event: string, session: any) => void) | null = null;

  constructor() {
    this.token = localStorage.getItem("auth_token");
  }
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    if (import.meta.env.DEV) {
      console.debug("API Request:", options.method || "GET", url);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",

    };

    // Add existing headers
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === "string") {
          headers[key] = value;
        }
      });
    }

    const token = this.token || localStorage.getItem("auth_token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });


      if (!response.ok) {
        let error;
        try {
          const text = await response.text();
          if (text) {
            error = JSON.parse(text);
          } else {
            error = { error: `HTTP ${response.status}` };
          }
        } catch {
          error = { error: `HTTP ${response.status}` };
        }
        if (import.meta.env.DEV) console.error("API Error:", error);
        // A revoked/expired session: clear it so the app returns to login
        if (response.status === 401 && token && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/verify-device')) {
          this.token = null;
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_data");
          if (this.authCallback) this.authCallback("SIGNED_OUT", null);
        }
        const errMsg = typeof error?.error === 'string'
          ? error.error
          : typeof error?.error?.message === 'string'
            ? error.error.message
            : typeof error?.message === 'string'
              ? error.message
              : `HTTP ${response.status}`;
        // Keep the status and body so screens can react (e.g. canClaim on 409)
        throw Object.assign(new Error(errMsg), { status: response.status, data: error });
      }

      // Handle empty responses
      const text = await response.text();
      if (!text) {
        return {};
      }

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON response from server");
      }
      // Unwrap response envelope if present ({ success: true, data: ... } or { success: false, error: ... }).
      // Done outside the JSON try/catch so the server's real message reaches the user.
      if (parsed && typeof parsed === 'object' && parsed.success !== undefined) {
        if (!parsed.success) {
          const envelopeErr = typeof parsed.error?.message === 'string'
            ? parsed.error.message
            : typeof parsed.error === 'string'
              ? parsed.error
              : 'Request failed';
          throw Object.assign(new Error(envelopeErr), { status: response.status, data: parsed });
        }
        return parsed.data !== undefined ? parsed.data : parsed;
      }
      return parsed;
    } catch (fetchError) {
      if (import.meta.env.DEV) console.error("Fetch Error:", fetchError);

      // Handle different types of network errors
      if (fetchError instanceof TypeError) {
        if (fetchError.message.includes("fetch")) {
          throw new Error(
            "Network error - unable to connect to server. Please check if the server is running."
          );
        }
        if (fetchError.message.includes("JSON")) {
          throw new Error("Server returned invalid response format");
        }
      }

      // Handle connection refused errors
      if (
        fetchError instanceof Error &&
        fetchError.message.includes("ECONNREFUSED")
      ) {
        throw new Error(
          "Connection refused - server may not be running on the expected port"
        );
      }

      throw fetchError;
    }
  }

  private async upload(endpoint: string, formData: FormData) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {};
    const token = this.token || localStorage.getItem("auth_token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(url, { method: 'POST', headers, body: formData });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(err.error || `Upload failed: ${response.status}`);
    }
    return response.json();
  }

  // Auth methods
  auth = {
    signUp: async (data: {
      name?: string;
      first_name?: string;
      middle_name?: string;
      last_name?: string;
      email: string;
      password: string;
      phone?: string;
      region?: string;
      role?: string;
    }) => {
      try {
        const response: AuthResponse = await this.request("/auth/register", {
          method: "POST",
          body: JSON.stringify(data),
        });

        this.token = response.token;
        localStorage.setItem("auth_token", response.token);

        // Trigger auth state change
        if (this.authCallback) {
          this.authCallback("SIGNED_IN", {
            user: response.user,
            access_token: response.token,
          });
        }

        return { data: { user: response.user, token: response.token }, error: null };
      } catch (error) {
        return {
          data: { user: null, token: null },
          error:
            error instanceof Error ? error : new Error("Registration failed"),
        };
      }
    },

    // Sign up with optional profile image (multipart/form-data)
    signUpWithProfileImage: async (
      data: {
        name?: string;
        first_name?: string;
        middle_name?: string;
        last_name?: string;
        email: string;
        password: string;
        phone?: string;
        region?: string;
      },
      profileImage?: File
    ) => {
      try {
        const formData = new FormData();
        if (data.first_name) formData.append("first_name", data.first_name);
        if (data.middle_name) formData.append("middle_name", data.middle_name);
        if (data.last_name) formData.append("last_name", data.last_name);
        if (data.name) formData.append("name", data.name);
        formData.append("email", data.email);
        formData.append("password", data.password);
        if (data.phone) formData.append("phone", data.phone);
        if (data.region) formData.append("region", data.region);
        if (profileImage) formData.append("profile_image", profileImage);

        const headers: any = {};
        if (this.token) {
          headers["Authorization"] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers, // Do NOT set Content-Type for FormData
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
          throw new Error(error.error || `HTTP ${response.status}`);
        }

        const json: AuthResponse = await response.json();
        this.token = json.token;
        localStorage.setItem("auth_token", json.token);

        if (this.authCallback) {
          this.authCallback("SIGNED_IN", {
            user: json.user,
            access_token: json.token,
          });
        }

        return { data: { user: json.user }, error: null };
      } catch (error) {
        return {
          data: { user: null },
          error: error instanceof Error ? error : new Error("Registration failed"),
        };
      }
    },

    signInWithPassword: async (data: { email: string; password: string }) => {
      try {
        const response: AuthResponse = await this.request("/auth/login", {
          method: "POST",
          body: JSON.stringify(data),
        });

        this.token = response.token;
        localStorage.setItem("auth_token", response.token);

        // Trigger auth state change
        if (this.authCallback) {
          this.authCallback("SIGNED_IN", {
            user: response.user,
            access_token: response.token,
          });
        }

        return { data: { user: response.user }, error: null };
      } catch (error) {
        return {
          data: { user: null },
          error: error instanceof Error ? error : new Error("Login failed"),
        };
      }
    },

    register: async (data: {
      name?: string; first_name?: string; middle_name?: string; last_name?: string;
      email: string; password: string; phone?: string; region?: string;
      role?: string; registrationNumber?: string; businessName?: string;
      sector?: string; country?: string; city?: string; address?: string;
    }) => {
      const response = await this.request("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }) as any;
      this.token = response.token;
      localStorage.setItem("auth_token", response.token);
      if (this.authCallback) {
        this.authCallback("SIGNED_IN", { user: response.user, access_token: response.token });
      }
      return response;
    },

    signOut: async () => {
      try {
        await this.request("/auth/logout", { method: "POST" });
      } catch (error) {
        // Ignore logout errors - we'll clear the token anyway
        console.warn("Logout request failed:", error);
      }

      this.token = null;
      localStorage.removeItem("auth_token");

      // Trigger auth state change
      if (this.authCallback) {
        this.authCallback("SIGNED_OUT", null);
      }

      return { error: null };
    },

    getSession: async () => {
      if (!this.token) {
        return { data: { session: null }, error: null };
      }

      try {
        const response = await this.request("/auth/me");
        return {
          data: {
            session: {
              user: response.user,
              access_token: this.token,
            },
          },
          error: null,
        };
      } catch {
        this.token = null;
        localStorage.removeItem("auth_token");
        return { data: { session: null }, error: null };
      }
    },

    getUser: async (token: string) => {
      this.token = token;
      try {
        const response = await this.request("/auth/me");
        return { data: { user: response.user }, error: null };
      } catch (error) {
        return { data: { user: null }, error: error as Error };
      }
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Store the callback for later use
      this.authCallback = callback;

      // Check initial auth state
      const checkAuth = async () => {
        const { data } = await this.auth.getSession();
        if (data.session) {
          callback("SIGNED_IN", data.session);
        } else {
          callback("SIGNED_OUT", null);
        }
      };

      checkAuth();

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this.authCallback = null;
            },
          },
        },
      };
    },
  };



  // Device management
  devices = {
    list: () => this.request("/device-management"),
    get: (id: string) => this.request(`/device-management/${id}`),
    create: (data: any) =>
      this.request("/device-management", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    categories: () => this.request("/device-management/categories"),
    createCategory: (data: { name: string; description?: string }) =>
      this.request("/device-management/categories", {
        method: "POST", body: JSON.stringify(data),
      }),
    updateCategory: (id: string, data: { name?: string; description?: string; active?: boolean }) =>
      this.request(`/device-management/categories/${id}`, {
        method: "PUT", body: JSON.stringify(data),
      }),
    deleteCategory: (id: string) =>
      this.request(`/device-management/categories/${id}`, { method: "DELETE" }),
    leaAgencies: (params?: { page?: number; limit?: number; search?: string }) => {
      const q = new URLSearchParams();
      if (params) {
        Object.keys(params).forEach(key => {
          const v = (params as any)[key];
          if (v !== undefined && v !== null && v !== '') q.append(key, String(v));
        });
      }
      const qs = q.toString();
      return this.request(`/admin-portal/lea-agencies${qs ? `?${qs}` : ''}`);
    },
    update: (id: string, data: any) =>
      this.request(`/device-management/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request(`/device-management/${id}`, {
        method: "DELETE",
      }),
    release: (id: string) =>
      this.request(`/device-management/${id}/release`, { method: "POST" }),
    resendVerification: (deviceId: string) =>
      this.request("/device-management/resend-verification", { method: "POST", body: JSON.stringify({ device_id: deviceId }) }),
    verifyWithCode: (deviceId: string, code: string) =>
      this.request("/device-management/verify-device", { method: "POST", body: JSON.stringify({ device_id: deviceId, otp_code: code }) }),
    bulkCreate: (data: any) =>
      this.request("/device-management/bulk", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  };

  // Ownership levels, proof of ownership, claims and the admin review queue
  ownership = {
    proofTypes: (category?: string) =>
      this.request(`/ownership/proof-types${buildQuery({ category })}`) as Promise<{ group: string; types: ProofType[] }>,
    forDevice: (deviceId: string) => this.request(`/ownership/device/${deviceId}`) as Promise<DeviceOwnership>,
    submitProof: (deviceId: string, data: { file: File; proofType: string; note?: string }) => {
      const fd = new FormData();
      fd.append('proof_type', data.proofType);
      if (data.note) fd.append('note', data.note);
      fd.append('proof_document', data.file);
      return this.upload(`/ownership/device/${deviceId}/proof`, fd);
    },
    lookupClaim: (identifier: string) =>
      this.request(`/ownership/claims/lookup${buildQuery({ identifier })}`) as Promise<ClaimableItem>,
    fileClaim: (data: { identifier: string; statement: string; proofType: string; file: File }) => {
      const fd = new FormData();
      fd.append('identifier', data.identifier);
      fd.append('statement', data.statement);
      fd.append('proof_type', data.proofType);
      fd.append('proof_document', data.file);
      return this.upload('/ownership/claims', fd);
    },
    myClaims: () => this.request('/ownership/claims/mine'),
    adminProofs: (status = 'pending') => this.request(`/ownership/admin/proofs${buildQuery({ status })}`),
    reviewProof: (id: string, decision: 'approve' | 'reject', note?: string) =>
      this.request(`/ownership/admin/proofs/${id}/review`, { method: 'POST', body: JSON.stringify({ decision, note }) }),
    adminDisputes: (status = 'open') => this.request(`/ownership/admin/disputes${buildQuery({ status })}`),
    resolveDispute: (id: string, decision: 'claimant' | 'owner', note: string) =>
      this.request(`/ownership/admin/disputes/${id}/resolve`, { method: 'POST', body: JSON.stringify({ decision, note }) }),
  };

  // Report management (Admin)
  reportManagement = {
    list: (params?: { status?: string; report_type?: string }) => {
      const query = params ? buildQuery(params) : "";
      return this.request(`/report-management${query}`);
    },
    get: (caseId: string) => this.request(`/report-management/${caseId}`),
    create: (data: any) =>
      this.request("/report-management", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (caseId: string, data: any) =>
      this.request(`/report-management/${caseId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    myDevices: () => this.request('/report-management/my-devices'),
  };

  // Admin methods (legacy)
  admin = {
    stats: () => this.request("/admin-portal/stats"),
    verificationQueue: (params?: { page?: number; limit?: number }) => {
      const query = params
        ? buildQuery(params as any)
        : "";
      return this.request(`/admin-portal/verification-queue${query}`);
    },
    verifyDevice: (id: string, data: { approved: boolean; notes?: string }) =>
      this.request(`/admin-portal/verify-device/${id}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    auditLogs: (params?: any) => {
      const query = params ? buildQuery(params) : "";
      return this.request(`/admin-portal/audit-logs${query}`);
    },
    users: (params?: any) => {
      const query = params ? buildQuery(params) : "";
      return this.request(`/admin-portal/users${query}`);
    },
    updateUserRole: (id: string, role: string) =>
      this.request(`/admin-portal/users/${id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      }),
  };

  // New comprehensive admin system
  adminSystem = {
    overview: () => this.request('/admin-system/overview'),
    configuration: () => this.request('/admin-system/configuration'),
    userManagement: (params?: any) => {
      const query = params ? buildQuery(params) : '';
      return this.request(`/admin-system/users/management${query}`);
    },
    verificationQueue: (params?: any) => {
      const query = params ? buildQuery(params) : '';
      return this.request(`/admin-system/devices/verification-queue${query}`);
    },
    reportManagement: (params?: any) => {
      const query = params ? buildQuery(params) : '';
      return this.request(`/admin-system/reports/management${query}`);
    },
    auditLogs: (params?: any) => {
      const query = params ? buildQuery(params) : '';
      return this.request(`/admin-system/audit-logs${query}`);
    },
    maintenance: (operation: string, parameters?: any) => this.request('/admin-system/maintenance', {
      method: 'POST',
      body: JSON.stringify({ operation, parameters }),
    }),
    performance: (params?: any) => {
      const query = params ? buildQuery(params) : '';
      return this.request(`/admin-system/performance${query}`);
    }
  };

  // Analytics
  analytics = {
    dashboard: (params?: any) => {
      const query = params ? buildQuery(params) : '';
      return this.request(`/analytics/dashboard${query}`);
    },
    deviceBrands: () => this.request('/analytics/devices/brands'),
    hotspots: () => this.request('/analytics/hotspots'),
    leaPerformance: () => this.request('/analytics/lea-performance'),
    export: (type: string, params?: any) => {
      const query = params ? buildQuery(params) : '';
      return this.request(`/analytics/export/${type}${query}`);
    }
  };

  // System Health
  systemHealth = {
    status: () => this.request('/system-health/status'),
    auditLogs: (params?: any) => {
      const query = params ? buildQuery(params) : '';
      return this.request(`/system-health/audit-logs${query}`);
    },
    maintenance: (operation: string) => this.request(`/system-health/maintenance/${operation}`, {
      method: 'POST',
    })
  };

  // User Management
  userManagement = {
    users: (params?: any) => {
      const query = params ? buildQuery(params) : '';
      return this.request(`/user-management/users${query}`);
    },
    getUser: (userId: string) => this.request(`/user-management/users/${userId}`),
    updateUser: (userId: string, data: any) => this.request(`/user-management/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    updateRole: (userId: string, data: any) => this.request(`/user-management/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    updateRegion: (userId: string, data: any) => this.request(`/user-management/users/${userId}/region`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    suspend: (userId: string, data: any) => this.request(`/user-management/users/${userId}/suspend`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    resetPassword: (userId: string, data: any) => this.request(`/user-management/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    statistics: () => this.request('/user-management/statistics'),
    bulkOperations: (data: any) => this.request('/user-management/bulk-operations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  };

  // LEA Portal
  leaPortal = {
    stats: () => this.request('/lea-portal/stats'),
    cases: (params?: any) => {
      const query = params ? buildQuery(params) : '';
      return this.request(`/lea-portal/cases${query}`);
    },
    getCase: (caseId: string) => this.request(`/lea-portal/cases/${caseId}`),
    updateCaseStatus: (caseId: string, data: any) => this.request(`/lea-portal/cases/${caseId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    addCaseNotes: (caseId: string, data: any) => this.request(`/lea-portal/cases/${caseId}/notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    regionalStats: () => this.request('/lea-portal/regional-stats'),
    exportCases: (params?: any) => {
      const query = params ? buildQuery(params) : '';
      return this.request(`/lea-portal/export/cases${query}`);
    },
    getSettings: () => this.request('/lea-portal/settings'),
    updateSettings: (data: any) => this.request('/lea-portal/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    getThreads: () => this.request('/lea-portal/threads'),
    createThread: (data: { subject: string; participantUserId: string; caseId?: string }) => this.request('/lea-portal/threads', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getThreadMessages: (threadId: string) => this.request(`/lea-portal/threads/${threadId}/messages`),
    sendThreadMessage: (threadId: string, content: string) => this.request(`/lea-portal/threads/${threadId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  };

  // Device Transfer
  deviceTransfer = {
    initiate: (data: any) => this.request('/device-transfer/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    // For consistency, alias accept to the unified completion route
    accept: (data: { transferCode: string; otpCode?: string }) => this.request('/device-transfer/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    reject: (data: any) => this.request('/device-transfer/reject', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    // Legacy endpoints fallback (device_transfers table)
    legacyAccept: (data: { transfer_code: string; proof_of_handover_url?: string }) => this.request('/device-transfer/accept-legacy', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    legacyReject: (data: { transfer_code: string; rejection_reason?: string }) => this.request('/device-transfer/reject-legacy', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    requests: (params?: any) => {
      const query = params ? buildQuery(params) : '';
      return this.request(`/device-transfer/requests${query}`);
    },
    cancel: (transferId: string) => this.request('/device-transfer/cancel', {
      method: 'POST',
      body: JSON.stringify({ transferId }),
    })
    ,
    resendCode: (transferId: string) => this.request('/device-transfer/resend-code', {
      method: 'POST',
      body: JSON.stringify({ transferId }),
    }),
    resendSellerOtp: (transferId: string) => this.request('/device-transfer/resend-seller-otp', {
      method: 'POST',
      body: JSON.stringify({ transferId }),
    }),
    // New OTP-based transfer endpoints (OwnershipTransferService)
    verifyOtp: (data: { transferId: string; otpCode: string }) => this.request('/device-transfer/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    complete: (data: { transferCode: string; otpCode?: string }) => this.request('/device-transfer/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    myTransfers: (params?: { type?: 'all' | 'sent' | 'received' }) => this.request(`/device-transfer/my-transfers${params?.type ? `?type=${params.type}` : ''}`)
  };

  // Found Device
  foundDevice = {
    check: (params: any) => {
      const query = buildQuery(params);
      return this.request(`/found-device/check${query}`);
    },
    report: (data: any) => this.request('/found-device/report', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    reports: (params?: any) => {
      const query = params ? buildQuery(params) : '';
      return this.request(`/found-device/reports${query}`);
    }
  };

  // Marketplace
  marketplace = {
    list: (params?: any) => {
      const q = new URLSearchParams();
      if (params) {
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            q.append(key, String(params[key]));
          }
        });
      }
      const qs = q.toString();
      return this.request(`/marketplace${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => this.request(`/marketplace/${id}`),
    create: (data: any) => this.request('/marketplace', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id: string, data: any) => this.request(`/marketplace/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id: string) => this.request(`/marketplace/${id}`, {
      method: 'DELETE'
    }),
    getSellerStats: () => this.request('/marketplace/seller/stats'),
    getSellerOrders: () => this.request('/marketplace/seller/orders'),
    getMessages: (id: string) => this.request(`/marketplace/${id}/messages`),
    sendMessage: (id: string, content: string) => this.request(`/marketplace/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content })
    }),
    // Admin methods
    adminGetAll: (params?: any) => {
      const q = new URLSearchParams();
      if (params) {
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            q.append(key, String(params[key]));
          }
        });
      }
      const qs = q.toString();
      return this.request(`/marketplace/admin/all${qs ? `?${qs}` : ''}`);
    },
    adminUpdateStatus: (id: string, status: string) => this.request(`/marketplace/admin/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),
    adminToggleFeatured: (id: string, featured: boolean) => this.request(`/marketplace/admin/${id}/featured`, {
      method: 'PUT',
      body: JSON.stringify({ featured })
    }),
    getInbox: () => this.request('/marketplace/inbox'),
  };

  // Payments
  payments = {
    getMethods: () => this.request('/payments/methods'),
    addMethod: (data: any) => this.request('/payments/methods', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    removeMethod: (id: string) => this.request(`/payments/methods/${id}`, {
      method: 'DELETE'
    }),
    getBalance: () => this.request('/payments/balance'),
    getPayouts: (params?: any) => {
      const query = params ? buildQuery(params) : '';
      return this.request(`/payments${query}`); // payout list lives at GET /api/payments
    },
  };

  // Profile methods
  profile = {
    uploadImage: (file: File) => {
      const fd = new FormData();
      fd.append('image', file);
      return this.upload('/profile/image', fd);
    },
    update: async (data: { name?: string; first_name?: string; middle_name?: string; last_name?: string; phone?: string; region?: string }) => {
      return this.request('/profile/update', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    getStats: async () => {
      return this.request('/profile/stats');
    },
    getPreferences: async () => {
      return this.request('/profile/preferences');
    },
    updatePreferences: async (preferences: any) => {
      return this.request('/profile/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences)
      });
    }
  };

  // Files
  files = {
    upload: async (type: string, file: File, additionalData?: any) => {
      const formData = new FormData();
      formData.append(type, file);
      if (additionalData) {
        Object.keys(additionalData).forEach(key => {
          formData.append(key, additionalData[key]);
        });
      }

      const headers: any = {};
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${API_BASE_URL}/files/upload/${type}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    view: (subdir: string, filename: string) => `${API_BASE_URL}/files/view/${subdir}/${filename}`,
    stats: () => this.request('/files/stats'),
    cleanup: () => this.request('/files/cleanup', { method: 'POST' })
  };

  // Public Device Check APIs
  publicCheck = async (query: { imei?: string; serial?: string }, headers?: Record<string, string>) => {
    const params = new URLSearchParams(query as any).toString();
    return this.request(`/public-check?${params}`, { headers: headers || {} });
  };

  publicCheckEnhanced = async (data: any) => {
    try {
      return await this.request('/public-check/enhanced', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (e: any) {
      // "Not registered" is an answer, not an error: show it as a result
      if (e?.data?.deviceStatus) return e.data;
      throw e;
    }
  };

  publicStats = async () => {
    return this.request('/public-check/stats');
  };

  // Reports (User Portal)
  reports = {
    list: async (params?: any) => {
      const query = params ? buildQuery(params) : '';
      const res = await this.request(`/user-portal/reports${query}`);
      const normalized = Array.isArray(res)
        ? res
        : (res && Array.isArray(res?.data?.reports))
          ? res.data.reports
          : (res && Array.isArray(res?.reports))
            ? res.reports
            : [];
      return normalized;
    },
    get: async (caseId: string) => this.request(`/user-portal/reports/${caseId}`),
  };

  // User Portal
  userPortal = {
    searchUsers: async (query: string) => this.request(`/user-portal/search-users?q=${encodeURIComponent(query)}`),
    devices: (params: { status?: string; search?: string; page?: number; limit?: number } = {}) =>
      this.request(`/user-portal/devices${buildQuery(params)}`),
  };

  // Revenue & Fees
  revenue = {
    getFee: (feeKey: string) => this.request(`/revenue-admin/fees/${feeKey}`),
    listFees: () => this.request('/revenue-admin/fees'),
    setFee: (feeKey: string, value: number) =>
      this.request(`/revenue-admin/fees/${feeKey}`, {
        method: 'PUT', body: JSON.stringify({ value }),
      }),
    getProvider: () => this.request('/revenue-admin/provider'),
    setProvider: (data: { provider: string; config?: any }) =>
      this.request('/revenue-admin/provider', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    transactions: (params?: { page?: number; limit?: number; type?: string; status?: string }) => {
      const query = params ? buildQuery(params as any) : '';
      return this.request(`/revenue-admin/transactions${query}`);
    },
    summary: (params?: { start_date?: string; end_date?: string }) => {
      const query = params ? buildQuery(params) : '';
      return this.request(`/revenue-admin/summary${query}`);
    },
    // Amount is set by the server from the fee settings; returns a Paystack link
    createInvoice: (data: { fee_type: string; description?: string }) =>
      this.request('/revenue-admin/create-invoice', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    // Ask the server (which asks Paystack) whether a fee invoice is paid
    verifyInvoice: (reference: string) =>
      this.request('/revenue-admin/invoices/verify', {
        method: 'POST',
        body: JSON.stringify({ reference }),
      }),
  };

  // Security & MFA
  security = {
    mfaInitiate: (data: { action_type: string; context?: any }) =>
      this.request('/security/mfa/initiate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    mfaVerify: (data: { session_id: string; otp: string; second_otp?: string }) =>
      this.request('/security/mfa/verify', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    reauthenticate: (data: { password: string }) =>
      this.request('/security/reauthenticate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    verifyNIN: (data: { nin: string; provider?: string; pay_by_pass?: string }) =>
      this.request('/security/nin/verify', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    verifyCAC: (data: { rcNumber: string; businessName?: string; companyType?: string; pay_by_pass?: string }) =>
      this.request('/security/cac/verify', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getCACHistory: () => this.request('/security/cac/history'),
    getVerificationStatus: () => this.request('/security/cac/status'),
    getVerificationQueue: (status: string = 'pending', page: number = 1) =>
      this.request(`/security/admin/verification-queue?status=${status}&page=${page}`),
    updateQueueItem: (id: string, status: string) =>
      this.request(`/security/admin/verification-queue/${id}`, {
        method: 'PUT', body: JSON.stringify({ status }),
      }),
    riskCheck: () => this.request('/security/check-risk', { method: 'POST' }),
  };

  // Fraud detection (admin)
  fraud = {
    alerts: (params?: { page?: number; limit?: number; status?: string }) => {
      const query = params ? buildQuery(params as any) : '';
      return this.request(`/revenue-admin/fraud-alerts${query}`);
    },
    getAlert: (id: string) => this.request(`/revenue-admin/fraud-alerts/${id}`),
    updateAlert: (id: string, data: { status: string; notes?: string }) =>
      this.request(`/revenue-admin/fraud-alerts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    stats: () => this.request('/revenue-admin/fraud-alerts/stats'),
  };

  // Business Customer Onboarding
  business = {
    onboard: (data: { customer_name: string; customer_email?: string; customer_phone?: string; device_brand?: string; device_model?: string; device_imei?: string; pay_by_pass?: string }) =>
      this.request('/business/onboard', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onboardings: (params?: { page?: number; limit?: number }) => {
      const query = params ? buildQuery(params as any) : '';
      return this.request(`/business/onboardings${query}`);
    },
    onboardingStats: () => this.request('/business/onboardings/stats'),
  };

  // Business Registration & Profile
  businessProfile = {
    register: (data: {
      businessName: string; registrationNumber: string; businessType?: string;
      sector?: string; businessAddress?: string; businessPhone?: string;
      businessEmail?: string; website?: string; state?: string; city?: string;
      country?: string; expectedDeviceVolume?: string; businessDescription?: string;
    }) => this.request('/business-profile/register', {
      method: 'POST', body: JSON.stringify(data),
    }),
    getProfile: () => this.request('/business-profile/profile'),
  };

  // Device Checks
  deviceChecks = {
    history: async (params: { device_id?: string; identifier?: string; limit?: number }) => {
      const query = buildQuery(params as any);
      return this.request(`/public-check/history${query}`);
    },
    get: async (checkId: string) => this.request(`/public-check/report/${checkId}`),
    mine: async () => this.request('/public-check/mine'),
  };

  // Security Questions
  securityQuestions = {
    get: () => this.request('/profile/security-question'),
    setup: (data: { question: string; answer: string }) =>
      this.request('/profile/security-question', { method: 'POST', body: JSON.stringify(data) }),
  };

  // Account Deletion (secure multi-step flow)
  accountDeletion = {
    verifyPassword: (password: string) =>
      this.request('/profile/delete-account/verify-password', { method: 'POST', body: JSON.stringify({ password }) }),
    verifySecurity: (answer: string) =>
      this.request('/profile/delete-account/verify-security', { method: 'POST', body: JSON.stringify({ answer }) }),
    resendOtp: () =>
      this.request('/profile/delete-account/resend-otp', { method: 'POST' }),
    delete: (data: { reason: string; otpCode: string; confirmText: string }) =>
      this.request('/profile/delete-account', { method: 'POST', body: JSON.stringify(data) }),
  };

  // Data Export
  dataExport = {
    download: (type: string = 'full') => `${API_BASE_URL}/profile/export?type=${type}`,
    request: (exportType: string) =>
      this.request('/settings/data-export', { method: 'POST', body: JSON.stringify({ export_type: exportType }) }),
    status: () => this.request('/settings/data-export/status'),
  };

  // Archive (admin)
  archive = {
    stats: () => this.request('/archive/stats'),
    deletedUsers: (params?: { page?: number; search?: string }) => {
      const q = params ? buildQuery(params as any) : '';
      return this.request(`/archive/deleted-users${q}`);
    },
    deletedUserDetail: (id: string) => this.request(`/archive/deleted-users/${id}`),
    deletedDevices: (params?: { page?: number; search?: string }) => {
      const q = params ? buildQuery(params as any) : '';
      return this.request(`/archive/deleted-devices${q}`);
    },
    deletedDeviceDetail: (id: string) => this.request(`/archive/deleted-devices/${id}`),
    restoreUser: (archiveId: string) => this.request(`/archive/restore-user/${archiveId}`, { method: 'POST' }),
    restoreDevice: (archiveId: string) => this.request(`/archive/restore-device/${archiveId}`, { method: 'POST' }),
    userView: (userId: string) => this.request(`/archive/user-view/${userId}`),
    businessView: (userId: string) => this.request(`/archive/business-view/${userId}`),
    leaView: (userId: string) => this.request(`/archive/lea-view/${userId}`),
    deviceLifecycle: (deviceId: string) => this.request(`/archive/device-lifecycle/${deviceId}`),
    exportAudit: (params?: { page?: number }) => {
      const q = params ? buildQuery(params as any) : '';
      return this.request(`/archive/export-audit${q}`);
    },
  };
}

export const apiClient = new ApiClient();

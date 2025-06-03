/**
 * API Client
 * Handles all API communication with the backend
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';
import type {
  ApiResponse,
  PaginatedResponse,
  AuthResponse,
  User,
  Member,
  TeamMember,
  GymLocation,
  MembershipPlan,
  Payment,
  Promotion,
  CheckIn,
  AnalyticsData,
  LoginForm,
  RegisterForm,
  MemberForm,
  PaymentForm,
  QueryParams,
  MemberQueryParams,
  PaymentQueryParams,
} from '@/types';

// ===== Configuration =====
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'auth-token';
const REFRESH_TOKEN_KEY = 'refresh-token';

// ===== Axios Instance =====
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===== Request Interceptor =====
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token to requests
    const token = Cookies.get(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    if (process.env.NODE_ENV === 'development') {
      config.metadata = { startTime: Date.now() };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ===== Response Interceptor =====
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response time in development
    if (process.env.NODE_ENV === 'development' && response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      console.log(`API ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken } = response.data.data.session;
          Cookies.set(TOKEN_KEY, accessToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        Cookies.remove(TOKEN_KEY);
        Cookies.remove(REFRESH_TOKEN_KEY);
        
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else if (error.message) {
      toast.error(error.message);
    } else {
      toast.error('An unexpected error occurred');
    }

    return Promise.reject(error);
  }
);

// ===== Helper Functions =====
const handleApiResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  if (response.data.status === 'success') {
    return response.data.data!;
  } else {
    throw new Error(response.data.message || 'API request failed');
  }
};

const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
};

// ===== API Client Class =====
class FitZoneAPI {
  // ===== Authentication =====
  async login(credentials: LoginForm): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    const data = handleApiResponse(response);
    
    // Store tokens
    Cookies.set(TOKEN_KEY, data.session.accessToken, {
      expires: new Date(data.session.expiresAt * 1000),
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    
    Cookies.set(REFRESH_TOKEN_KEY, data.session.refreshToken, {
      expires: 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    
    return data;
  }

  async register(userData: RegisterForm): Promise<{ member: Member }> {
    const response = await apiClient.post<ApiResponse<{ member: Member }>>('/auth/register', userData);
    return handleApiResponse(response);
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    } finally {
      Cookies.remove(TOKEN_KEY);
      Cookies.remove(REFRESH_TOKEN_KEY);
    }
  }

  async getProfile(): Promise<{ user: User }> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    return handleApiResponse(response);
  }

  async updateProfile(userData: Partial<User>): Promise<{ user: User }> {
    const response = await apiClient.put<ApiResponse<{ user: User }>>('/auth/me', userData);
    return handleApiResponse(response);
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>('/auth/change-password', data);
    handleApiResponse(response);
  }

  async forgotPassword(email: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>('/auth/forgot-password', { email });
    handleApiResponse(response);
  }

  async resetPassword(data: { token: string; password: string }): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>('/auth/reset-password', data);
    handleApiResponse(response);
  }

  // ===== Members =====
  async getMembers(params: MemberQueryParams = {}): Promise<PaginatedResponse<Member[]>> {
    const queryString = buildQueryString(params);
    const response = await apiClient.get<PaginatedResponse<Member[]>>(`/members?${queryString}`);
    return response.data;
  }

  async getMember(id: string): Promise<{ member: Member }> {
    const response = await apiClient.get<ApiResponse<{ member: Member }>>(`/members/${id}`);
    return handleApiResponse(response);
  }

  async createMember(memberData: MemberForm): Promise<{ member: Member }> {
    const response = await apiClient.post<ApiResponse<{ member: Member }>>('/members', memberData);
    return handleApiResponse(response);
  }

  async updateMember(id: string, memberData: Partial<MemberForm>): Promise<{ member: Member }> {
    const response = await apiClient.put<ApiResponse<{ member: Member }>>(`/members/${id}`, memberData);
    return handleApiResponse(response);
  }

  async suspendMember(id: string, reason?: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(`/members/${id}/suspend`, { reason });
    handleApiResponse(response);
  }

  async activateMember(id: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(`/members/${id}/activate`);
    handleApiResponse(response);
  }

  async deleteMember(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/members/${id}`);
    handleApiResponse(response);
  }

  // ===== Staff =====
  async getStaff(params: QueryParams = {}): Promise<PaginatedResponse<TeamMember[]>> {
    const queryString = buildQueryString(params);
    const response = await apiClient.get<PaginatedResponse<TeamMember[]>>(`/staff?${queryString}`);
    return response.data;
  }

  async createStaff(staffData: any): Promise<{ staff: TeamMember }> {
    const response = await apiClient.post<ApiResponse<{ staff: TeamMember }>>('/auth/admin/create-staff', staffData);
    return handleApiResponse(response);
  }

  // ===== Payments =====
  async getPayments(params: PaymentQueryParams = {}): Promise<PaginatedResponse<Payment[]>> {
    const queryString = buildQueryString(params);
    const response = await apiClient.get<PaginatedResponse<Payment[]>>(`/payments?${queryString}`);
    return response.data;
  }

  async createPayment(paymentData: PaymentForm): Promise<{ payment: Payment }> {
    const response = await apiClient.post<ApiResponse<{ payment: Payment }>>('/payments', paymentData);
    return handleApiResponse(response);
  }

  async getPayment(id: string): Promise<{ payment: Payment }> {
    const response = await apiClient.get<ApiResponse<{ payment: Payment }>>(`/payments/${id}`);
    return handleApiResponse(response);
  }

  // ===== Membership Plans =====
  async getMembershipPlans(): Promise<{ plans: MembershipPlan[] }> {
    const response = await apiClient.get<ApiResponse<{ plans: MembershipPlan[] }>>('/plans');
    return handleApiResponse(response);
  }

  async createMembershipPlan(planData: any): Promise<{ plan: MembershipPlan }> {
    const response = await apiClient.post<ApiResponse<{ plan: MembershipPlan }>>('/plans', planData);
    return handleApiResponse(response);
  }

  async updateMembershipPlan(id: string, planData: any): Promise<{ plan: MembershipPlan }> {
    const response = await apiClient.put<ApiResponse<{ plan: MembershipPlan }>>(`/plans/${id}`, planData);
    return handleApiResponse(response);
  }

  async deleteMembershipPlan(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/plans/${id}`);
    handleApiResponse(response);
  }

  // ===== Gym Locations =====
  async getGymLocations(): Promise<{ locations: GymLocation[] }> {
    const response = await apiClient.get<ApiResponse<{ locations: GymLocation[] }>>('/locations');
    return handleApiResponse(response);
  }

  async createGymLocation(locationData: any): Promise<{ location: GymLocation }> {
    const response = await apiClient.post<ApiResponse<{ location: GymLocation }>>('/locations', locationData);
    return handleApiResponse(response);
  }

  async updateGymLocation(id: string, locationData: any): Promise<{ location: GymLocation }> {
    const response = await apiClient.put<ApiResponse<{ location: GymLocation }>>(`/locations/${id}`, locationData);
    return handleApiResponse(response);
  }

  // ===== Check-ins =====
  async checkIn(memberId?: string): Promise<{ checkin: CheckIn }> {
    const response = await apiClient.post<ApiResponse<{ checkin: CheckIn }>>('/checkins', { memberId });
    return handleApiResponse(response);
  }

  async checkOut(checkinId: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(`/checkins/${checkinId}/checkout`);
    handleApiResponse(response);
  }

  async getMyCheckIns(params: QueryParams = {}): Promise<PaginatedResponse<CheckIn[]>> {
    const queryString = buildQueryString(params);
    const response = await apiClient.get<PaginatedResponse<CheckIn[]>>(`/checkins/my-history?${queryString}`);
    return response.data;
  }

  async getCheckIns(params: QueryParams = {}): Promise<PaginatedResponse<CheckIn[]>> {
    const queryString = buildQueryString(params);
    const response = await apiClient.get<PaginatedResponse<CheckIn[]>>(`/checkins?${queryString}`);
    return response.data;
  }

  // ===== Promotions =====
  async getPromotions(): Promise<{ promotions: Promotion[] }> {
    const response = await apiClient.get<ApiResponse<{ promotions: Promotion[] }>>('/promotions');
    return handleApiResponse(response);
  }

  async createPromotion(promotionData: any): Promise<{ promotion: Promotion }> {
    const response = await apiClient.post<ApiResponse<{ promotion: Promotion }>>('/promotions', promotionData);
    return handleApiResponse(response);
  }

  async updatePromotion(id: string, promotionData: any): Promise<{ promotion: Promotion }> {
    const response = await apiClient.put<ApiResponse<{ promotion: Promotion }>>(`/promotions/${id}`, promotionData);
    return handleApiResponse(response);
  }

  async deletePromotion(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/promotions/${id}`);
    handleApiResponse(response);
  }

  // ===== Analytics =====
  async getAnalytics(params: { dateFrom?: string; dateTo?: string; gymLocationId?: string } = {}): Promise<AnalyticsData> {
    const queryString = buildQueryString(params);
    const response = await apiClient.get<ApiResponse<AnalyticsData>>(`/analytics?${queryString}`);
    return handleApiResponse(response);
  }

  async getRevenueAnalytics(params: any = {}): Promise<any> {
    const queryString = buildQueryString(params);
    const response = await apiClient.get<ApiResponse<any>>(`/analytics/revenue?${queryString}`);
    return handleApiResponse(response);
  }

  async getMemberAnalytics(params: any = {}): Promise<any> {
    const queryString = buildQueryString(params);
    const response = await apiClient.get<ApiResponse<any>>(`/analytics/members?${queryString}`);
    return handleApiResponse(response);
  }

  // ===== Admin =====
  async getAdminDashboard(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/admin/dashboard');
    return handleApiResponse(response);
  }

  async getSystemSettings(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/settings');
    return handleApiResponse(response);
  }

  async updateSystemSettings(settings: any): Promise<void> {
    const response = await apiClient.put<ApiResponse<void>>('/settings', settings);
    handleApiResponse(response);
  }

  // ===== File Upload =====
  async uploadFile(file: File, type: 'profile' | 'document' = 'profile'): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await apiClient.post<ApiResponse<{ url: string }>>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return handleApiResponse(response);
  }

  // ===== Health Check =====
  async healthCheck(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL.replace('/api/v1', '')}/api/health`);
    return response.data;
  }
}

// ===== Export API Instance =====
export const api = new FitZoneAPI();

// ===== Utility Functions =====
export const isTokenValid = (): boolean => {
  const token = Cookies.get(TOKEN_KEY);
  return !!token;
};

export const clearAuthTokens = (): void => {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
};

export const getAuthToken = (): string | undefined => {
  return Cookies.get(TOKEN_KEY);
};

// ===== Export Types =====
export type { ApiResponse, PaginatedResponse } from '@/types';
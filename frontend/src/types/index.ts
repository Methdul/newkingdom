// ===== Core Types =====

export type UserRole = 'admin' | 'staff' | 'member';
export type MembershipStatus = 'active' | 'inactive' | 'suspended' | 'expired' | 'cancelled' | 'pending';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'online' | 'stripe' | 'upi';
export type MembershipCategory = 'basic' | 'premium' | 'vip' | 'corporate';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

// ===== Business Entity Types (Defined first to avoid reference errors) =====

export interface GymLocation {
  id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  managerName?: string;
  operatingHours?: Record<string, { open: string; close: string }>;
  amenities?: string[];
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  category: MembershipCategory;
  description?: string;
  price: number;
  durationMonths: number;
  features?: string[];
  benefits?: string[];
  maxGymVisits?: number;
  maxGuestPasses: number;
  includesPersonalTraining: boolean;
  includesGroupClasses: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ===== User Types =====

export interface User {
  id: string;
  userId: string;
  role: UserRole;
  type: 'team_member' | 'member';
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  gymLocationId?: string;
  gymLocation?: GymLocation;
}

export interface TeamMember extends User {
  type: 'team_member';
  employeeId: string;
  permissions: Record<string, boolean>;
}

export interface Member extends User {
  type: 'member';
  memberNumber: string;
  planId?: string;
  membershipStatus: MembershipStatus;
  membershipStartDate?: string;
  membershipEndDate?: string;
  autoRenewal: boolean;
  membershipPlan?: MembershipPlan;
}

// ===== Additional Business Entity Types =====

export interface Payment {
  id: string;
  memberId: string;
  planId: string;
  gymLocationId: string;
  processedBy?: string;
  invoiceNumber: string;
  amount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDate: string;
  dueDate?: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  transactionReference?: string;
  description?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
  member?: Member;
  membershipPlan?: MembershipPlan;
  gymLocation?: GymLocation;
}

export interface Promotion {
  id: string;
  code: string;
  title: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  applicablePlans?: string[];
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckIn {
  id: string;
  memberId: string;
  gymLocationId: string;
  checkInTime: string;
  checkOutTime?: string;
  durationMinutes?: number;
  checkInMethod: 'manual' | 'qr_code' | 'rfid';
  notes?: string;
  createdAt: string;
  member?: Member;
  gymLocation?: GymLocation;
}

export interface MemberGoal {
  id: string;
  memberId: string;
  title: string;
  description?: string;
  targetValue?: number;
  currentValue: number;
  unit?: string;
  targetDate?: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
}

// ===== Analytics Types (Now MembershipPlan is defined) =====

export interface AnalyticsData {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    today?: number; // Optional: today's revenue
    growth: number;
    chart: Array<{
      date: string;
      amount: number;
    }>;
  };
  members: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    growth: number;
    expiringSoon?: number; // Optional: members expiring soon
    expired?: number; // Optional: expired members
    statusDistribution: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
  };
  checkins: {
    today: number;
    thisWeek: number;
    avgDaily: number;
    peakHours: Array<{
      hour: number;
      count: number;
    }>;
  };
  topPlans: Array<{
    plan: MembershipPlan;
    memberCount: number;
    revenue: number;
  }>;
}

// ===== API Response Types =====

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

// PaginatedResponse is separate from ApiResponse to avoid type conflicts
export interface PaginatedResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
      nextPage?: number;
      prevPage?: number;
    };
  };
  errors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

export interface AuthResponse {
  user: User;
  session: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    expiresIn: number;
  };
}

// ===== Form Types =====

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  gymLocationId: string;
  planId?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface MemberForm {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  gymLocationId: string;
  planId?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalConditions?: string;
  fitnessGoals?: string[];
}

export interface PaymentForm {
  memberId: string;
  planId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  promotionCode?: string;
  notes?: string;
}

// ===== UI Component Types =====

export interface TableColumn<T = any> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

// ===== Navigation Types =====

export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
  requiredRole?: UserRole[];
  requiredPermission?: string;
}

// ===== State Management Types =====

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginForm) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

export interface AppState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  notifications: Notification[];
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

// Find these interfaces in your types file and update them:

export interface User {
  id: string;
  userId: string;
  role: UserRole;
  type: 'team_member' | 'member';
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  photoUrl?: string; // ✅ ADD THIS LINE
  isActive: boolean;
  gymLocationId?: string;
  gymLocation?: GymLocation;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  read?: boolean; // ✅ ADD THIS LINE
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ===== Query Types =====

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface MemberQueryParams extends QueryParams {
  gymLocationId?: string;
  status?: MembershipStatus;
  planId?: string;
}

export interface PaymentQueryParams extends QueryParams {
  memberId?: string;
  gymLocationId?: string;
  status?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Member,
  TeamMember,
  Payment,
  MembershipPlan,
  GymLocation,
  Promotion,
  CheckIn,
  QueryParams,
  MemberQueryParams,
  PaymentQueryParams,
} from '@/types';
import { toast } from 'react-hot-toast';

// ===== Members =====
export function useMembers(params: MemberQueryParams = {}) {
  return useQuery({
    queryKey: ['members', params],
    queryFn: () => api.getMembers(params),
  });
}

export function useMember(id: string, enabled = true) {
  return useQuery({
    queryKey: ['member', id],
    queryFn: () => api.getMember(id),
    enabled: enabled && !!id,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createMember,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create member');
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateMember(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member', variables.id] });
      toast.success('Member updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update member');
    },
  });
}

// ===== Payments =====
export function usePayments(params: PaymentQueryParams = {}) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => api.getPayments(params),
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Payment processed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to process payment');
    },
  });
}

// ===== Membership Plans =====
export function useMembershipPlans() {
  return useQuery({
    queryKey: ['membership-plans'],
    queryFn: api.getMembershipPlans,
  });
}

// ===== Gym Locations =====
export function useGymLocations() {
  return useQuery({
    queryKey: ['gym-locations'],
    queryFn: api.getGymLocations,
  });
}

// ===== Check-ins =====
export function useMyCheckIns(params: QueryParams = {}) {
  return useQuery({
    queryKey: ['my-checkins', params],
    queryFn: () => api.getMyCheckIns(params),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (memberId?: string) => api.checkIn(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
      toast.success('Checked in successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to check in');
    },
  });
}

// ===== Analytics =====
export function useAnalytics(params: any = {}) {
  return useQuery({
    queryKey: ['analytics', params],
    queryFn: () => api.getAnalytics(params),
  });
}
/**
 * React Query hooks for Authentication
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { useAuth } from "@/context/useAuth";
import type {
  SendOtpPayload,
  VerifyOtpPayload,
  LawyerLoginPayload,
  LawyerRegisterPayload,
  AdminLoginPayload,
} from "@/types/api";

export function useSendCitizenOtp() {
  return useMutation({
    mutationFn: (payload: SendOtpPayload) => authService.sendCitizenOtp(payload),
  });
}

export function useVerifyCitizenOtp() {
  const { loginCitizen } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VerifyOtpPayload) => authService.verifyCitizenOtp(payload),
    onSuccess: (data) => {
      if (data.user) {
        loginCitizen(data.token, data.user);
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      }
    },
  });
}

export function useLawyerLogin() {
  const { loginLawyer } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LawyerLoginPayload) => authService.loginLawyer(payload),
    onSuccess: (data) => {
      if (data.user) {
        loginLawyer(data.token, data.user);
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      }
    },
  });
}

export function useLawyerRegister() {
  return useMutation({
    mutationFn: (payload: LawyerRegisterPayload) => authService.registerLawyer(payload),
  });
}

export function useAdminLogin() {
  const { loginAdmin } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminLoginPayload) => authService.loginAdmin(payload),
    onSuccess: (data) => {
      if (data.user) {
        loginAdmin(data.token, data.user);
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      }
    },
  });
}

export function useCurrentUser() {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => authService.getCurrentUser(),
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface AuthResponse {
  user: User;
  message?: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  // Get current user
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        if (response.status === 401) {
          return null; // Not authenticated
        }
        throw new Error("Failed to get user data");
      }
      const data = await response.json();
      return data.user || data; // Handle nested response format
    },
    retry: false,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.reload();
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    isLoggingOut: logoutMutation.isPending,
    error,
  };
}
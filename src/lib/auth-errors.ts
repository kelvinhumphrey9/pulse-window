import { AuthApiError } from "@supabase/supabase-js";

export const getAuthErrorMessage = (error: unknown) => {
  if (error instanceof AuthApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
};

export const isDemoAccount = (email: string | undefined | null) => {
  if (!email) return false;
  return email.endsWith('@triid.app') && email.startsWith('demo_');
};

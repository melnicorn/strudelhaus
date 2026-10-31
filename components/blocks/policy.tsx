'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Which controls a view offers. Lessons only show controls for functions already introduced;
 * the sandbox shows everything.
 */
export interface GuiPolicy {
  /** Methods the "Add control" menus may offer. Undefined = all. */
  methods?: ReadonlySet<string>;
  /** Show composition panels (groups, modifiers, arrangement). */
  composition: boolean;
}

const PolicyContext = createContext<GuiPolicy>({ composition: true });

export function GuiPolicyProvider({ policy, children }: { policy: GuiPolicy; children: ReactNode }) {
  return <PolicyContext.Provider value={policy}>{children}</PolicyContext.Provider>;
}

export function useGuiPolicy(): GuiPolicy {
  return useContext(PolicyContext);
}

export function allows(policy: GuiPolicy, method: string): boolean {
  return !policy.methods || policy.methods.has(method);
}

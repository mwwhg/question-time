import type { ReactNode } from "react";
import { createContext, useContext } from "react";

const PreviewContext = createContext<boolean>(false);

export function PreviewProvider({
  checkedAgainstPeople,
  children,
}: {
  readonly checkedAgainstPeople: boolean;
  readonly children: ReactNode;
}) {
  return <PreviewContext.Provider value={checkedAgainstPeople}>{children}</PreviewContext.Provider>;
}

/** True once the 300-pair human benchmark is published. Until then, "how sure" wording is off. */
export function useCheckedAgainstPeople(): boolean {
  return useContext(PreviewContext);
}

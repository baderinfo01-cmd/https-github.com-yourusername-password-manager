import { useStore } from "@/store/useStore";

/** Who owns the data: name and username come from "my information". */
export function getOwner() {
  const info = useStore.getState().myInfo as { firstName?: string; lastName?: string; username?: string } | undefined;
  const name = [info?.firstName, info?.lastName].filter(Boolean).join(" ").trim();
  return { name, username: info?.username || "" };
}

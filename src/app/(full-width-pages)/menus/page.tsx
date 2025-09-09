import Menus from "./menus";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menus | GARIS PT. Cisangkan",
};

export default function MenusPage() {
  return <Menus />;
}

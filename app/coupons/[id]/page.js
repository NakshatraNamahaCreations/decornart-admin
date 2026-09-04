import EditClient from "./EditClient";

export function generateStaticParams() {
  return [{ id: "_dynamic" }];
}

export default function Page() {
  return <EditClient />;
}

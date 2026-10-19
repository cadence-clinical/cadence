import { FlowsPage } from "./flows/flows-page";
import { FlowsPrint } from "./flows/flows-print";
import { IndexPage } from "./index-page";
import { GroupingOptions } from "./patient-list/grouping-options";
import { PaneOptions } from "./patient-list/pane-options";
import { PatientListA } from "./patient-list/option-a";
import { useRoute } from "./router";

/** The prototypes site: an index, and one route per prototype. src/registry.ts lists them. */
export function App() {
  const route = useRoute();
  if (route === "/patient-list/a" || route.startsWith("/patient-list/a/")) return <PatientListA />;
  if (route === "/patient-list/flows") return <FlowsPage />;
  if (route === "/patient-list/flows/print") return <FlowsPrint />;
  if (route === "/patient-list/grouping") return <GroupingOptions />;
  if (route === "/patient-list/pane") return <PaneOptions />;
  return <IndexPage />;
}

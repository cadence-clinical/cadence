import { Button } from "@/components/cadence/button";

export function App() {
  return (
    <article className="typeset typeset-reading">
      <h1>Sample heading</h1>
      <Button className="not-typeset" variant="destructive" size="lg">
        Cease infusion
      </Button>
    </article>
  );
}
